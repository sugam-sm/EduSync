import os
import json
import traceback
import random
import pdfplumber
import cv2
import numpy as np
from paddleocr import PaddleOCR
from celery import shared_task
from groq import Groq
from .models import Resource, Quiz, Question, Choice, FlashcardDeck, Flashcard


def get_groq_client():
    api_key = os.getenv('GROQ_API_KEY')
    if not api_key:
        raise ValueError("GROQ_API_KEY not found in environment.")
    return Groq(api_key=api_key)


def extract_text_from_pdf(file_path):
    text = ""
    try:
        if not os.path.exists(file_path):
            return ""
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text() or ""
                if not extracted.strip():
                    try:
                        pil_image = page.to_image(resolution=200).original
                        cv2_img = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
                        ocr = initialize_paddle_ocr()
                        if ocr:
                            result = ocr.ocr(cv2_img, cls=True)
                            if result:
                                lines = [line[1][0] for line in result[0] if isinstance(line, list)]
                                extracted = "\n".join(lines)
                    except Exception:
                        pass
                text += extracted + "\n"
    except Exception:
        traceback.print_exc()
    return text


def initialize_paddle_ocr():
    for strategy in [{"use_angle_cls": True}, {"use_textline_orientation": True}, {}]:
        try:
            return PaddleOCR(lang="en", **strategy)
        except Exception:
            continue
    return None


def extract_text_from_image_via_paddle(file_path):
    try:
        ocr = initialize_paddle_ocr()
        if not ocr:
            return ""

        img = cv2.imread(file_path)
        if img is None:
            return ""

        padded = cv2.copyMakeBorder(img, 50, 50, 50, 50, cv2.BORDER_CONSTANT, value=[255, 255, 255])

        try:
            result = ocr.predict(padded)
        except Exception:
            result = ocr.ocr(padded, cls=True)

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
def process_resource_to_text(resource_id, auto_generate=None):
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
                trigger_content_generation.delay(resource_id, auto_generate)

            return "Extraction completed"

        return "No text detected"

        return str(e)


@shared_task
def trigger_content_generation(resource_id, content_type='QUIZ', prompt_text=None,
                               title=None, sub_assign_id=None, creator_id=None,
                               question_count=10):

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

        # ================= QUIZ =================
        if content_type == 'QUIZ':
            persona_prompt = f"""
You are EduGen AI.

Generate {question_count} high-quality MCQs.

SOURCE:
{source_content}

INSTRUCTIONS:
{user_instructions}

RULES:
- 4 options per question
- 1 correct answer
- Generate correct answer first
- Generate 3 strong distractors
- RANDOMLY shuffle options
- Mix conceptual, application, and definition questions
- Avoid obvious answers

Return JSON:
{{
"title": "Quiz Title",
"questions": [
  {{
    "question_text": "",
    "choices": [
      {{"choice_text": "", "is_correct": false}},
      {{"choice_text": "", "is_correct": true}},
      {{"choice_text": "", "is_correct": false}},
      {{"choice_text": "", "is_correct": false}}
    ]
  }}
]
}}
"""

        # ================= FLASHCARDS =================
        else:
            persona_prompt = f"""
You are EduGen AI.

Generate {question_count} flashcards.

SOURCE:
{source_content}

INSTRUCTIONS:
{user_instructions}

RULES:
- Mix 3 types:
  1. Definition
  2. Question-Answer
  3. Concept explanation
- Balance all types
- Avoid vague answers

Return JSON:
{{
"title": "Deck Title",
"cards": [
  {{
    "front": "",
    "back": "",
    "type": "definition | qa | concept"
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
                is_ai_generated=True
            )

            for i, q_data in enumerate(data.get('questions', [])):
                q = Question.objects.create(
                    quiz=quiz,
                    question_text=q_data.get('question_text', ''),
                    order=i + 1
                )

                choices = q_data.get('choices', [])
                random.shuffle(choices)  # 🔥 backend randomization

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
        return str(e)