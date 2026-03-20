from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ResourceFolderViewSet, ResourceViewSet, FlashcardDeckViewSet,
    FlashcardViewSet, QuizViewSet, QuestionViewSet
)

router = DefaultRouter()
router.register(r'resourcefolders', ResourceFolderViewSet, basename='resourcefolder')
router.register(r'resources', ResourceViewSet, basename='resource')
router.register(r'decks', FlashcardDeckViewSet, basename='deck')
router.register(r'flashcards', FlashcardViewSet, basename='flashcard')
router.register(r'quizzes', QuizViewSet, basename='quiz')
router.register(r'questions', QuestionViewSet, basename='question')

urlpatterns = [
    path('', include(router.urls)),
]