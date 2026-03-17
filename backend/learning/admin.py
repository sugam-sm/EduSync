from django.contrib import admin
from .models import ResourceFolder, Resource, FlashcardDeck, Flashcard, Quiz, Question, Choice

admin.site.register(Resource)
admin.site.register(ResourceFolder)
admin.site.register(FlashcardDeck)
admin.site.register(Flashcard)
admin.site.register(Quiz)
admin.site.register(Question)
admin.site.register(Choice)