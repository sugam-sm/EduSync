from rest_framework import viewsets, permissions
from .models import Resource, ResourceFolder, FlashcardDeck, Flashcard, Quiz, Question, Choice
from .serializers import (
    ResourceSerializer, ResourceFolderSerialzer, FlashcardDeckSerializer, 
    FlashcardSerializer, QuizSerializer, QuestionSerializer, ChoiceSerializer
)

class ResourcePermissions(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return bool(request.user.role.role_name == 'Teacher')

class ResourceFolderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ResourcePermissions]
    serializer_class = ResourceFolderSerialzer

    def get_queryset(self):
        user = self.request.user
        base_query = ResourceFolder.objects.filter(sub_assign__subject__organization=user.organization)

        if user.role.role_name == 'Teacher':
            queryset = base_query.filter(sub_assign__teacher__user=user, uploaded_by=user.teacher_profile)
            selected_grade = self.request.query_params.get('grade_id')
            if selected_grade:
                queryset = queryset.filter(sub_assign__grade_id=selected_grade)
            return queryset.select_related('sub_assign', 'sub_assign__subject').distinct()
        
        elif user.role.role_name == 'Student':
            queryset = base_query.filter(sub_assign__grade=user.student_profile.grade)
            selected_subject = self.request.query_params.get('subject_id')
            if selected_subject:
                queryset = queryset.filter(sub_assign__subject_id=selected_subject)
            return queryset.select_related('sub_assign', 'sub_assign__subject').distinct()

        return base_query.none()

class ResourceViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceSerializer
    permission_classes = [permissions.IsAuthenticated, ResourcePermissions]

    def get_queryset(self):
        user = self.request.user
        base_query = Resource.objects.filter(folder__sub_assign__subject__organization=user.organization)

        if user.role.role_name == 'Teacher':
            return base_query.filter(folder__sub_assign__teacher__user=user, folder__uploaded_by=user.teacher_profile).distinct()
        elif user.role.role_name == 'Student':
            return base_query.filter(folder__sub_assign__grade=user.student_profile.grade).distinct()
        return base_query.none()

class FlashcardDeckViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ResourcePermissions]
    serializer_class = FlashcardDeckSerializer

    def get_queryset(self):
        user = self.request.user
        base_query = FlashcardDeck.objects.filter(sub_assign__subject__organization=user.organization)
        if user.role.role_name == 'Teacher':
            return base_query.filter(sub_assign__teacher__user=user, created_by=user.teacher_profile).distinct()
        elif user.role.role_name == 'Student':
            return base_query.filter(sub_assign__grade=user.student_profile.grade).distinct()
        return base_query.none()

class FlashcardViewSet(viewsets.ModelViewSet):
    serializer_class = FlashcardSerializer
    permission_classes = [permissions.IsAuthenticated, ResourcePermissions]

    def get_queryset(self):
        user = self.request.user
        base_query = Flashcard.objects.filter(deck__sub_assign__subject__organization=user.organization)
        if user.role.role_name == 'Teacher':
            return base_query.filter(deck__created_by=user.teacher_profile).distinct()
        elif user.role.role_name == 'Student':
            return base_query.filter(deck__sub_assign__grade=user.student_profile.grade).distinct()
        return base_query.none()

class QuizViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ResourcePermissions]
    serializer_class = QuizSerializer

    def get_queryset(self):
        user = self.request.user
        base_query = Quiz.objects.filter(sub_assign__subject__organization=user.organization)
        
        if user.role.role_name == 'Teacher':
            return base_query.filter(
                sub_assign__teacher__user=user,  created_by=user.teacher_profile
            ).distinct()
        
        elif user.role.role_name == 'Student':
            return base_query.filter(sub_assign__grade=user.student_profile.grade, is_active=True).distinct()
            
        return base_query.none()

class QuestionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ResourcePermissions]
    serializer_class = QuestionSerializer

    def get_queryset(self):
        quiz_id = self.request.query_params.get('quiz_id')
        user = self.request.user
        queryset = Question.objects.filter(quiz__sub_assign__subject__organization=user.organization)
        
        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)
        
        if user.role.role_name == 'Teacher':
            return queryset.filter(quiz__created_by=user.teacher_profile).order_by('order').distinct()
        elif user.role.role_name == 'Student':
            return queryset.filter(quiz__sub_assign__grade=user.student_profile.grade).order_by('order').distinct()
            
        return queryset.none()