from django.utils import timezone
from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Resource, ResourceFolder, FlashcardDeck, Flashcard, Quiz, Question, Choice
from .serializers import (
    ResourceSerializer, ResourceFolderSerialzer, FlashcardDeckSerializer, 
    FlashcardSerializer, QuizSerializer, QuestionSerializer, ChoiceSerializer,
)
from users.models import Student

class ResourcePermissions(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return bool(request.user.role and request.user.role.role_name in ['teacher', 'admin'])

class ResourceFolderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ResourcePermissions]
    serializer_class = ResourceFolderSerialzer

    def get_queryset(self):
        user = self.request.user
        base_query = ResourceFolder.objects.filter(sub_assign__subject__organization=user.organization)

        if user.role and user.role.role_name == 'admin':
            return base_query.select_related('sub_assign', 'sub_assign__subject').distinct()

        if user.role and user.role.role_name == 'teacher':
            queryset = base_query.filter(sub_assign__teacher__user=user, uploaded_by=user.teacher_profile)
            selected_grade = self.request.query_params.get('grade')
            if selected_grade:
                queryset = queryset.filter(sub_assign__grade=selected_grade)
            selected_subject = self.request.query_params.get('subject')
            if selected_subject and selected_subject != 'All':
                queryset = queryset.filter(sub_assign__subject=selected_subject)
            return queryset.select_related('sub_assign', 'sub_assign__subject').distinct()
        
        elif user.role and user.role.role_name == 'student':
            queryset = base_query.filter(sub_assign__grade=user.student_profile.grade)
            selected_subject = self.request.query_params.get('subject')
            if selected_subject and selected_subject != 'All':
                queryset = queryset.filter(sub_assign__subject=selected_subject)
            return queryset.select_related('sub_assign', 'sub_assign__subject').distinct()

        return base_query.none()

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()

class ResourceViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceSerializer
    permission_classes = [permissions.IsAuthenticated, ResourcePermissions]

    def get_queryset(self):
        user = self.request.user
        base_query = Resource.objects.filter(folder__sub_assign__subject__organization=user.organization)

        folder_id = self.request.query_params.get('folder_id')
        if folder_id:
            base_query = base_query.filter(folder_id=folder_id)

        if user.role and user.role.role_name == 'admin':
            return base_query.distinct()
        if user.role and user.role.role_name == 'teacher':
            queryset = base_query.filter(folder__sub_assign__teacher__user=user, folder__uploaded_by=user.teacher_profile)
            selected_grade = self.request.query_params.get('grade')
            if selected_grade:
                queryset = queryset.filter(folder__sub_assign__grade=selected_grade)
            selected_subject = self.request.query_params.get('subject')
            if selected_subject and selected_subject != 'All':
                queryset = queryset.filter(folder__sub_assign__subject=selected_subject)
            return queryset.distinct()
        elif user.role and user.role.role_name == 'student':
            return base_query.filter(folder__sub_assign__grade=user.student_profile.grade).distinct()
        return base_query.none()

    def perform_create(self, serializer):
        resource = serializer.save()
        if resource.type == 'FILE':
            from .tasks import process_resource_to_text
            transaction.on_commit(lambda: process_resource_to_text.delay(resource.id))

    def perform_destroy(self, instance):
        instance.delete()

    @action(detail=True, methods=['post'])
    def generate_content(self, request, pk=None):
        content_type = request.data.get('content_type', 'FLASHCARD')
        question_count = int(request.data.get('question_count') or request.data.get('card_count') or 10)
        prompt = request.data.get('prompt', '')
        title = request.data.get('title', '')
        
        from .tasks import trigger_content_generation
        default_time = request.data.get('default_time_per_question', 60)
        default_points = request.data.get('default_points_per_question', 1)
        
        kwargs = {'question_count': question_count} if content_type == 'QUIZ' else {'card_count': question_count}
        
        trigger_content_generation.delay(
            pk, 
            content_type, 
            prompt_text=prompt, 
            title=title,
            default_time=default_time,
            default_points=default_points,
            **kwargs
        )
        return Response({'status': f'{content_type} generation started'}, status=status.HTTP_202_ACCEPTED)

class FlashcardDeckViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ResourcePermissions]
    serializer_class = FlashcardDeckSerializer

    def get_queryset(self):
        user = self.request.user
        base_query = FlashcardDeck.objects.filter(sub_assign__subject__organization=user.organization)
        if user.role and user.role.role_name == 'admin':
            return base_query.distinct()
        if user.role and user.role.role_name == 'teacher':
            queryset = base_query.filter(sub_assign__teacher__user=user, created_by=user.teacher_profile)
            selected_grade = self.request.query_params.get('grade')
            if selected_grade:
                queryset = queryset.filter(sub_assign__grade=selected_grade)
            selected_subject = self.request.query_params.get('subject')
            if selected_subject and selected_subject != 'All':
                queryset = queryset.filter(sub_assign__subject=selected_subject)
            return queryset.distinct()
        elif user.role and user.role.role_name == 'student':
            queryset = base_query.filter(sub_assign__grade=user.student_profile.grade)
            selected_subject = self.request.query_params.get('subject')
            if selected_subject and selected_subject != 'All':
                queryset = queryset.filter(sub_assign__subject=selected_subject)
            return queryset.distinct()
        return base_query.none()

    def create(self, request, *args, **kwargs):
        if request.data.get('creation_mode') == 'ai':
            from organizations.models import AssignSubject
            from .tasks import trigger_content_generation, process_resource_to_text
            
            grade = request.data.get('grade')
            resource_id = request.data.get('resource_id')
            file = request.FILES.get('file')
            prompt = request.data.get('prompt', '')
            title = request.data.get('title', '')
            card_count = int(request.data.get('card_count', 10))


            sub_assign = AssignSubject.objects.filter(teacher__user=request.user, grade=grade).first()
            if not sub_assign:
                return Response({"error": "You are not assigned to this grade."}, status=status.HTTP_400_BAD_REQUEST)

            if resource_id:
                trigger_content_generation.delay(
                    int(resource_id), content_type='FLASHCARD', prompt_text=prompt,
                    title=title, sub_assign_id=sub_assign.id,
                    creator_id=request.user.teacher_profile.user_id,
                    card_count=card_count
                )
                return Response({"status": "AI Generation queued for resource."}, status=status.HTTP_202_ACCEPTED)
            
            if file:
                from .models import ResourceFolder
                folder, _ = ResourceFolder.objects.get_or_create(
                    name="AI Temp Folder", 
                    sub_assign=sub_assign, 
                    uploaded_by=request.user.teacher_profile
                )
                resource = Resource.objects.create(
                    title=title or 'AI Generated',
                    type='FILE',
                    folder=folder,
                    file=file
                )
                process_resource_to_text.delay(
                    resource.id, 
                    auto_generate='FLASHCARD',
                    prompt_text=prompt,
                    title=title,
                    sub_assign_id=sub_assign.id,
                    creator_id=request.user.teacher_profile.user_id,
                    card_count=card_count
                )
                return Response({"status": "File uploaded and AI Generation queued."}, status=status.HTTP_202_ACCEPTED)

            # Prompt-only generation (no file or resource)
            if prompt:
                trigger_content_generation.delay(
                    None, content_type='FLASHCARD', prompt_text=prompt,
                    title=title, sub_assign_id=sub_assign.id,
                    creator_id=request.user.teacher_profile.user_id,
                    card_count=card_count
                )
                return Response({"status": "AI Generation started from prompt."}, status=status.HTTP_202_ACCEPTED)

            return Response({"error": "Please provide a prompt, file, or resource for AI generation."}, status=status.HTTP_400_BAD_REQUEST)

        response = super().create(request, *args, **kwargs)
        return response

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()

class FlashcardViewSet(viewsets.ModelViewSet):
    serializer_class = FlashcardSerializer
    permission_classes = [permissions.IsAuthenticated, ResourcePermissions]

    def get_queryset(self):
        user = self.request.user
        base_query = Flashcard.objects.filter(deck__sub_assign__subject__organization=user.organization)
        
        deck_id = self.request.query_params.get('deck_id')
        if deck_id:
            base_query = base_query.filter(deck_id=deck_id)

        if user.role and user.role.role_name == 'admin':
            return base_query.distinct()
        if user.role and user.role.role_name == 'teacher':
            queryset = base_query.filter(deck__created_by=user.teacher_profile)
            selected_grade = self.request.query_params.get('grade')
            if selected_grade:
                queryset = queryset.filter(deck__sub_assign__grade=selected_grade)
            selected_subject = self.request.query_params.get('subject')
            if selected_subject and selected_subject != 'All':
                queryset = queryset.filter(deck__sub_assign__subject=selected_subject)
            return queryset.distinct()
        elif user.role and user.role.role_name == 'student':
            return base_query.filter(deck__sub_assign__grade=user.student_profile.grade).distinct()
        return base_query.none()

class QuizViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ResourcePermissions]
    serializer_class = QuizSerializer

    def get_queryset(self):
        user = self.request.user
        base_query = Quiz.objects.filter(
            sub_assign__subject__organization=user.organization
        ).prefetch_related('questions__choices')
        
        if user.role and user.role.role_name == 'admin':
            return base_query.select_related('sub_assign', 'sub_assign__subject').distinct()
        if user.role and user.role.role_name == 'teacher':
            queryset = base_query.filter(
                sub_assign__teacher__user=user, created_by=user.teacher_profile
            )
            selected_grade = self.request.query_params.get('grade')
            if selected_grade:
                queryset = queryset.filter(sub_assign__grade=selected_grade)
            selected_subject = self.request.query_params.get('subject')
            if selected_subject and selected_subject != 'All':
                queryset = queryset.filter(sub_assign__subject=selected_subject)
            return queryset.select_related('sub_assign', 'sub_assign__subject').distinct()
        
        elif user.role and user.role.role_name == 'student':
            # Only show published & active quizzes for students
            queryset = base_query.filter(
                sub_assign__grade=user.student_profile.grade, 
                is_active=True,
                is_published=True
            )
            selected_subject = self.request.query_params.get('subject')
            if selected_subject and selected_subject != 'All':
                queryset = queryset.filter(sub_assign__subject=selected_subject)
            return queryset.distinct()
        return base_query.none()

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()

    def create(self, request, *args, **kwargs):
        if request.data.get('creation_mode') == 'ai':
            from organizations.models import AssignSubject
            from .tasks import trigger_content_generation, process_resource_to_text
            
            grade = request.data.get('grade')
            resource_id = request.data.get('resource_id')
            file = request.FILES.get('file')
            prompt = request.data.get('prompt', '')
            title = request.data.get('title', '')
            question_count = int(request.data.get('question_count') or 10)
            default_time = int(float(request.data.get('default_time_per_question') or 60))
            default_points = int(float(request.data.get('default_points_per_question') or 1))
            start_dt = request.data.get('start_datetime')
            end_dt = request.data.get('end_datetime')


            sub_assign = AssignSubject.objects.filter(teacher__user=request.user, grade=grade).first()
            if not sub_assign:
                return Response({"error": "You are not assigned to this grade."}, status=status.HTTP_400_BAD_REQUEST)

            if resource_id:
                trigger_content_generation.delay(
                    int(resource_id), content_type='QUIZ', prompt_text=prompt,
                    title=title, sub_assign_id=sub_assign.id,
                    creator_id=request.user.teacher_profile.user_id,
                    question_count=question_count,
                    default_time=default_time,
                    default_points=default_points,
                    start_dt=start_dt,
                    end_dt=end_dt
                )
                return Response({"status": "AI Quiz generation queued for resource."}, status=status.HTTP_202_ACCEPTED)
            
            if file:
                from .models import ResourceFolder
                folder, _ = ResourceFolder.objects.get_or_create(
                    name="AI Temp Folder", 
                    sub_assign=sub_assign, 
                    uploaded_by=request.user.teacher_profile
                )
                resource = Resource.objects.create(
                    title=title or 'AI Generated',
                    type='FILE',
                    folder=folder,
                    file=file
                )
                process_resource_to_text.delay(
                    resource.id, 
                    auto_generate='QUIZ',
                    prompt_text=prompt,
                    title=title,
                    sub_assign_id=sub_assign.id,
                    creator_id=request.user.teacher_profile.user_id,
                    question_count=question_count,
                    default_time=default_time,
                    default_points=default_points,
                    start_dt=start_dt,
                    end_dt=end_dt
                )
                return Response({"status": "File uploaded and AI Quiz generation queued."}, status=status.HTTP_202_ACCEPTED)

            # Prompt-only generation (no file or resource)
            if prompt:
                trigger_content_generation.delay(
                    None, content_type='QUIZ', prompt_text=prompt,
                    title=title, sub_assign_id=sub_assign.id,
                    creator_id=request.user.teacher_profile.user_id,
                    question_count=question_count,
                    default_time=default_time,
                    default_points=default_points,
                    start_dt=start_dt,
                    end_dt=end_dt
                )
                return Response({"status": "AI Quiz generation started from prompt."}, status=status.HTTP_202_ACCEPTED)

            return Response({"error": "Please provide a prompt, file, or resource for AI generation."}, status=status.HTTP_400_BAD_REQUEST)

        response = super().create(request, *args, **kwargs)
        return response

class QuestionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ResourcePermissions]
    serializer_class = QuestionSerializer

    def get_queryset(self):
        quiz_id = self.request.query_params.get('quiz_id')
        user = self.request.user
        queryset = Question.objects.filter(
            quiz__sub_assign__subject__organization=user.organization
        ).prefetch_related('choices')
        
        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)
        
        if user.role and user.role.role_name == 'admin':
            return queryset.distinct()
        if user.role and user.role.role_name == 'teacher':
            queryset = queryset.filter(quiz__created_by=user.teacher_profile)
            selected_grade = self.request.query_params.get('grade')
            if selected_grade:
                queryset = queryset.filter(quiz__sub_assign__grade=selected_grade)
            selected_subject = self.request.query_params.get('subject')
            if selected_subject and selected_subject != 'All':
                queryset = queryset.filter(quiz__sub_assign__subject=selected_subject)
            return queryset.order_by('order').distinct()
        elif user.role and user.role.role_name == 'student':
            return queryset.filter(quiz__sub_assign__grade=user.student_profile.grade).order_by('order').distinct()
            
        return queryset.none()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({"message": "question successfully deleted"}, status=status.HTTP_200_OK)

