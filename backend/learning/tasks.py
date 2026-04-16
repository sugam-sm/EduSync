import os, json, traceback, random
from celery import shared_task
from groq import Groq
from .models import Resource, Quiz, Question, Choice, FlashcardDeck, Flashcard

# using groq for ai api.
def get_groq_client():
    api_key = os.getenv('GROQ_API_KEY')
    if not api_key:
        raise ValueError("GROQ_API_KEY not found in environment.")
    return Groq(api_key=api_key)

# function for extracting text from pdf.
def extract_text_from_pdf(file_path):
    import pdfplumber
    text = ""
    try:
        if not os.path.exists(file_path):
            return ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text() or ""
                # if no text are found fallback to ocr
                if not extracted.strip():
                    try:
                        import numpy as np
                        import cv2
                        # converting each page to image.
                        pil_image = page.to_image(resolution=200).original
                        # converting the image to open cv format.
                        cv2_img = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
                        ocr = initialize_paddle_ocr()
                        if ocr:
                            # Running the ocr to detect text.
                            result = ocr.ocr(cv2_img, cls=True)
                            if result:
                                lines = [line[1][0] for line in result[0] if isinstance(line, list)]
                                extracted = "\n".join(lines)
                    except Exception:
                        pass
                text += extracted + "\n"
    except Exception:
        # logging the errors.
        traceback.print_exc()
    return text

# helper function for initializing paddle ocr.
def initialize_paddle_ocr():
    from paddleocr import PaddleOCR
    for strategy in [{"use_angle_cls": True}, {"use_textline_orientation": True}, {}]:
        try:
            return PaddleOCR(lang="en", **strategy)
        except Exception:
            continue
    return None


def extract_text_from_image_via_paddle(file_path):
    import cv2
    try:
        ocr = initialize_paddle_ocr()
        if not ocr:
            return ""

        img = cv2.imread(file_path)
        if img is None:
            return ""

        # adding padding to the image for better text recognition in edges.
        padded_image = cv2.copyMakeBorder(img, 50, 50, 50, 50, cv2.BORDER_CONSTANT, value=[255, 255, 255])

        try:
            result = ocr.predict(padded_image)
        except Exception:
            result = ocr.ocr(padded_image, cls=True)

        if not result:
            return ""

        if isinstance(result[0], dict):
            lines = result[0].get('rec_texts', [])
        else:
            lines = [line[1][0] for line in result[0] if isinstance(line, list)]

        return "\n".join(lines)
    except Exception:
        traceback.print_exc()
        return ""


def clean_json_response(raw_text):
    cleaned = raw_text.strip()
    if cleaned.startswith('```'):
        cleaned = cleaned.split('\n', 1)[1]
    if cleaned.endswith('```'):
        cleaned = cleaned[:-3]
    return json.loads(cleaned.strip())


@shared_task
def process_resource_to_text(resource_id, auto_generate=None, **generation_kwargs):
    try:
        resource = Resource.objects.get(id=resource_id)
        file_path = resource.file.path
        ext = os.path.splitext(file_path)[1].lower()

        if ext == '.pdf':
            extracted_text = extract_text_from_pdf(file_path)
        else:
            extracted_text = extract_text_from_image_via_paddle(file_path)

        if extracted_text and len(extracted_text.strip()) > 10:
            resource.extracted_text = extracted_text
            resource.save()

            if auto_generate:
                trigger_content_generation.delay(resource_id, auto_generate, **generation_kwargs)

            return "Extraction completed"

        return "No text detected"
    except Exception as e:
        traceback.print_exc()
        return str(e)


@shared_task
def trigger_content_generation(
    resource_id, content_type='QUIZ', prompt_text=None, title=None, 
    sub_assign_id=None, creator_id=None, question_count=10, card_count=10,
    default_time=60, default_points=1, start_dt=None, end_dt=None, **kwargs
):

    try:
        source_content = ""
        user_instructions = prompt_text or ""
        creator = None
        sub_assign = None

        if resource_id:
            resource = Resource.objects.get(id=resource_id)
            source_content = resource.extracted_text or ""
            creator = resource.folder.uploaded_by
            sub_assign = resource.folder.sub_assign

        if creator_id:
            from users.models import Teacher
            creator = Teacher.objects.get(pk=creator_id)

        if sub_assign_id:
            from organizations.models import AssignSubject
            sub_assign = AssignSubject.objects.get(id=sub_assign_id)

        if not source_content and not user_instructions:
            return "No input provided"

        client = get_groq_client()
        
        # Get Context info for accurate generation
        grade_info = "unspecified level"
        subject_info = "unspecified subject"
        if sub_assign:
            grade_info = f"Grade {sub_assign.grade.name}"
            subject_info = sub_assign.subject.name

        # Determine effective count
        effective_count = question_count if content_type == 'QUIZ' else card_count

        if content_type == 'QUIZ':
            persona_prompt = f"""
            You are EduGen AI, an expert academic content creator.

            TARGET ASSESSMENT METADATA:
            - Subject: {subject_info}
            - Points per question: {default_points}
            - Timer (seconds): {default_time}
            - Target Level: {grade_info}

            Generate EXACTLY {effective_count} high-quality Multiple Choice Questions (MCQs).

            SOURCE MATERIAL:
            {source_content}

            INSTRUCTIONS:
            {user_instructions}

            STRICT CONTEXT RULE:
            - ONLY generate questions based on the actual SUBJECT CONTENT.
            - DO NOT create meta-questions about the passage.
            - DO NOT use phrasing like:
            - "According to the passage..."
            - "How many items are listed..."
            - Focus only on concepts, facts, and ideas within the topic.

            BLOOM’S TAXONOMY REQUIREMENT:
            - Each question MUST include a "blooms_level" field.
            - Allowed values:
            ["remember", "understand", "apply", "analyze", "evaluate"]

            DISTRIBUTION GUIDELINE:
            - 30–40%: remember + understand
            - 30–40%: apply
            - 20–30%: analyze/evaluate
            - Avoid overusing simple recall questions.

            STRICT RULES:
            1. EXACTLY {effective_count} questions.
            2. Exactly 4 choices per question.
            3. Exactly one correct answer.
            4. FIRST choice must be correct.
            5. Questions must match {default_points}-point difficulty.
            6. Avoid trivial distractors.
            7. JSON ONLY.

            Return JSON Structure:
            {{
                "title": "{title or 'AI Generated Quiz'}",
                "questions": [
                {{
                    "question_text": "Conceptual question",
                    "blooms_level": "apply",
                    "choices": [
                        {{"choice_text": "Correct Answer", "is_correct": true}},
                        {{"choice_text": "Distractor 1", "is_correct": false}},
                        {{"choice_text": "Distractor 2", "is_correct": false}},
                        {{"choice_text": "Distractor 3", "is_correct": false}}
                    ]
                }}
                ]
            }}
        """

        else:
            persona_prompt = f"""
            You are EduGen AI, an expert academic assistant specializing in active recall and concept mastery.

            Generate EXACTLY {effective_count} high-quality study flashcards for {subject_info} ({grade_info}).

            SOURCE MATERIAL:
            {source_content}

            INSTRUCTIONS:
            {user_instructions}

            STRICT CONTEXT RULE:
            - ONLY use actual SUBJECT CONTENT.
            - DO NOT include meta or structural references.
            - DO NOT generate cards about the passage itself.

            FLASHCARD STYLE RULE:
            - Prefer informative, recall-based content over direct questions.
            - Cards should feel like study notes optimized for memory.

            BLOOM’S TAXONOMY REQUIREMENT:
            - Each card MUST include a "blooms_level".
            - Allowed values:
            ["remember", "understand", "apply", "analyze"]

            CARD TYPES (MIX THESE):

            1. Definition (remember)
            - Term → definition

            2. Concept Explanation (understand)
            - Concept → multi-point explanation

            3. Application Insight (apply)
            - Concept → real-world use or example

            4. Comparison / Breakdown (analyze)
            - Concept → differences, relationships

            DISTRIBUTION GUIDELINE:
            - 30–40%: remember
            - 30–40%: understand
            - 20–30%: apply/analyze

            STRICT RULES:
            1. EXACTLY {effective_count} cards.
            2. Clear, concise, no fluff.
            3. Context-pure (only topic knowledge).
            4. JSON ONLY.

            Return JSON Structure:
            {{
                "title": "{title or 'AI Generated Flashcards'}",
                "cards": [
                {{
                    "front": "Concept or term",
                    "back": "Clear explanation",
                    "type": "definition | concept | fact",
                    "blooms_level": "understand"
                }}
                ]
            }}
        """

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": persona_prompt}],
            response_format={"type": "json_object"},
            temperature=0.7
        )

        data = clean_json_response(response.choices[0].message.content)

        # ================= SAVE QUIZ =================
        if content_type == 'QUIZ':
            quiz = Quiz.objects.create(
                title=title or data.get('title', 'AI Quiz'),
                sub_assign=sub_assign,
                created_by=creator,
                is_active=True,
                is_published=False,
                is_ai_generated=True,
                default_time_per_question=int(float(default_time)) if default_time else 60,
                default_points_per_question=int(float(default_points)) if default_points else 1,
                start_datetime=start_dt,
                end_datetime=end_dt
            )

            for i, q_data in enumerate(data.get('questions', [])):
                q = Question.objects.create(
                    quiz=quiz,
                    question_text=q_data.get('question_text', ''),
                    points_override=int(float(default_points)) if default_points else 1,
                    time_override_seconds=int(float(default_time)) if default_time else 60,
                    order=i + 1
                )

                choices = q_data.get('choices', [])
                random.shuffle(choices)

                for c in choices:
                    Choice.objects.create(
                        question=q,
                        choice_text=c.get('choice_text', ''),
                        is_correct=c.get('is_correct', False)
                    )

            return f"Quiz created ({quiz.id})"

        # ================= SAVE FLASHCARDS =================
        else:
            deck = FlashcardDeck.objects.create(
                title=title or data.get('title', 'AI Deck'),
                sub_assign=sub_assign,
                created_by=creator,
                is_ai_generated=True
            )

            for c in data.get('cards', []):
                Flashcard.objects.create(
                    deck=deck,
                    front=c.get('front', ''),
                    back=c.get('back', '')
                )

            return f"Deck created ({deck.id})"

    except Exception as e:
        traceback.print_exc()
        return str(e)