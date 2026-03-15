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
        return f"{self.name} ({self.sub_assign.subject.name})"

class Resource(models.Model):
    RESOURCE_TYPES = [('FILE', 'File'), ('LINK', 'URL/Link')]
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=10, choices=RESOURCE_TYPES)
    folder = models.ForeignKey(ResourceFolder, on_delete=models.CASCADE, related_name='resources')
    
    file = models.FileField(upload_to='learning_resources/', null=True, blank=True)
    url = models.URLField(null=True, blank=True)

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} [{self.type}]"

class FlashcardDeck(models.Model):
    title = models.CharField(max_length=255)
    sub_assign = models.ForeignKey(AssignSubject, on_delete=models.CASCADE, related_name='decks')
    created_by = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Flashcard Decks"

    def __str__(self):
        return f"{self.title} ({self.sub_assign.subject.name})"

class Flashcard(models.Model):
    deck = models.ForeignKey(FlashcardDeck, on_delete=models.CASCADE, related_name='cards')
    front = models.TextField(blank=True, null=True)
    back = models.TextField(blank=True, null=True)
    # Added Image Fields
    front_image = models.ImageField(upload_to='flashcards/front/', null=True, blank=True)
    back_image = models.ImageField(upload_to='flashcards/back/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Flashcard {self.id} - {self.deck.title}"