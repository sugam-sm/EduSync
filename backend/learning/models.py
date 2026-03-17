from django.db import models
from organizations.models import AssignSubject
from users.models import Teacher

class ResourceFolder(models.Model):
    name = models.CharField(max_length=255)
    sub_assign = models.ForeignKey(AssignSubject, on_delete=models.CASCADE, related_name='folders')
    uploaded_by = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Resource Folders"

    def __str__(self):
        return f"Resource Folder: {self.name} [{self.sub_assign.subject.name} - {self.sub_assign.grade.name}{self.sub_assign.grade.section}]"

class Resource(models.Model):
    RESOURCE_TYPES = [('FILE', 'File'), ('LINK', 'URL/Link')]
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=10, choices=RESOURCE_TYPES)
    folder = models.ForeignKey(ResourceFolder, on_delete=models.CASCADE, related_name='resources')
    
    file = models.FileField(upload_to='learning_resources/', null=True, blank=True)
    url = models.URLField(null=True, blank=True)

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Resource: {self.title} [{self.folder.name}]"

class FlashcardDeck(models.Model):
    title = models.CharField(max_length=255)
    sub_assign = models.ForeignKey(AssignSubject, on_delete=models.CASCADE, related_name='decks')
    created_by = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Flashcard Decks"

    def __str__(self):
        return f"Deck: {self.title} [{self.sub_assign.subject.name} - {self.sub_assign.grade.name}{self.sub_assign.grade.section}]"

class Flashcard(models.Model):
    deck = models.ForeignKey(FlashcardDeck, on_delete=models.CASCADE, related_name='cards')
    front = models.TextField(blank=True, null=True)
    back = models.TextField(blank=True, null=True)
    front_image = models.ImageField(upload_to='flashcards/front/', null=True, blank=True)
    back_image = models.ImageField(upload_to='flashcards/back/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        card_number = Flashcard.objects.filter(deck=self.deck, id__lte=self.id).count()
        return f"Card: {card_number} [{self.deck.title}]"

class Quiz(models.Model):
    title = models.CharField(max_length=255)
    sub_assign = models.ForeignKey(AssignSubject, on_delete=models.CASCADE, related_name='quizzes')
    created_by = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    time_limit_minutes = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Quizzes"

    def __str__(self):
        return f"Quiz: {self.title} [{self.sub_assign.subject.name} - {self.sub_assign.grade.name}{self.sub_assign.grade.section}]"

class Question(models.Model):
    QUESTION_TYPES = [
        ('MCQ', 'Multiple Choice'),
        ('TF', 'True/False'),
    ]
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    type = models.CharField(max_length=10, choices=QUESTION_TYPES)
    points = models.PositiveIntegerField(default=1)
    image = models.ImageField(upload_to='quiz_questions/', null=True, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def __str__(self):
        question_number = Question.objects.filter(quiz=self.quiz, order__lt=self.order).count() + 1
        return f"Question: {question_number} [{self.quiz.title}]"

class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    choice_text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"Question: {self.question.question_text} | Chioce: {self.choice_text} [isCorrect: {self.is_correct}]"