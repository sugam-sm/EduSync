from django.contrib import admin
from .models import ResourceFolder, Resource, FlashcardDeck, Flashcard

admin.site.register(Resource)
admin.site.register(ResourceFolder)
admin.site.register(FlashcardDeck)
admin.site.register(Flashcard)