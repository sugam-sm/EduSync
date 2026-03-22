from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import UserListSerializer, UserDetailSerializer, UserCreationSerializer, UserUpdateSerializer, StudentSerializer
from .models import Student
from organizations.models import Organization, Grade, Subject
from learning.models import Quiz, FlashcardDeck, ResourceFolder
from analytics.models import Session, QuizAttempt

User = get_user_model()

class IsOrganizationAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user and request.user.is_superuser:
            return True
        return (
            request.user and
            request.user.role and
            request.user.role.role_name == "admin"
        )

class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Superuser: return ALL users across all organizations
        if user.is_superuser:
            return User.objects.all().select_related('role', 'organization')
        if user.role and user.role.role_name == "admin":
            return User.objects.filter(organization=user.organization).exclude(role__role_name="admin")
        elif user.role and user.role.role_name == "teacher":
            return User.objects.filter(organization=user.organization).exclude(role__role_name="admin")
        return User.objects.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        if self.action == 'create':
            return UserCreationSerializer
        if self.action == 'partial_update':
            return UserUpdateSerializer
        return UserDetailSerializer

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def dashboard_stats(self, request):
        if not request.user.is_superuser:
            return Response({'error': 'Unauthorized'}, status=403)
            
        return Response({
            'total_organizations': Organization.objects.count(),
            'total_users': User.objects.count(),
            'total_teachers': User.objects.filter(role__role_name='teacher').count(),
            'total_students': User.objects.filter(role__role_name='student').count(),
            'total_admins': User.objects.filter(role__role_name='admin').count(),
            'total_grades': Grade.objects.count(),
            'total_subjects': Subject.objects.count(),
            'total_quizzes': Quiz.objects.count(),
            'total_flashcard_decks': FlashcardDeck.objects.count(),
            'total_resource_folders': ResourceFolder.objects.count(),
            'total_sessions': Session.objects.count(),
            'total_quiz_attempts': QuizAttempt.objects.count(),
            'active_sessions': Session.objects.filter(is_active=True).count(),
            'organizations': [
                {
                    'id': o.id, 'name': o.name, 'email': o.email, 
                    'user_count': User.objects.filter(organization=o).count(), 'is_active': o.is_active,
                    'created_at': o.created_at,
                    'logo': o.logo.url if o.logo else None
                } for o in Organization.objects.all()
            ]
        })

class StudentViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = StudentSerializer

    def get_queryset(self):
        user = self.request.user
        # Superuser: return ALL students
        if user.is_superuser:
            return Student.objects.all().select_related('user', 'grade')
        base_query = Student.objects.filter(user__organization=user.organization).select_related('user', 'grade')
        
        if user.role and user.role.role_name in ['admin', 'teacher']:
            grade_id = self.request.query_params.get('grade_id')
            if grade_id:
                return base_query.filter(grade_id=grade_id)
            return base_query
        return base_query.none()
