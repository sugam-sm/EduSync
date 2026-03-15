from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ResourceFolderViewSet, ResourceViewSet, FlashcardDeckViewSet, FlashcardViewSet

router = DefaultRouter()
router.register(r'resourcefolders', ResourceFolderViewSet, basename='resourcefolder')
router.register(r'resources', ResourceViewSet, basename='resource')
router.register(r'decks', FlashcardDeckViewSet, basename='deck')
router.register(r'flashcards', FlashcardViewSet, basename='flashcard')

urlpatterns = [
    path('', include(router.urls)),
]