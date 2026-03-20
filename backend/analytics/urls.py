from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SessionViewSet, AttendanceViewSet, TeacherQuizRemarkViewSet, QuizAttemptViewSet

router = DefaultRouter()
router.register(r'sessions', SessionViewSet, basename='session')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'quiz-remarks', TeacherQuizRemarkViewSet, basename='teacher-quiz-remark')
router.register(r'quiz-attempts', QuizAttemptViewSet, basename='quiz-attempt')

urlpatterns = [
    path('', include(router.urls)),
]
