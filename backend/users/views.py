from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import UserListSerializer, UserDetailSerializer, UserCreationSerializer, UserUpdateSerializer, StudentSerializer
from .models import Student

User = get_user_model()

class IsOrganizationAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.role.role_name == "Administrator"
        )

class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role.role_name == "Administrator":
            return User.objects.filter(organization=user.organization).exclude(role__role_name="Administrator")
        elif user.role.role_name == "Teacher":
            return User.objects.filter(organization=user.organization).exclude(role__role_name="Administrator")
        return User.objects.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        if self.action == 'create':
            return UserCreationSerializer
        if self.action == 'partial_update':
            return UserUpdateSerializer
        return UserDetailSerializer

class StudentViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = StudentSerializer

    def get_queryset(self):
        user = self.request.user
        base_query = Student.objects.filter(user__organization=user.organization).select_related('user', 'grade')
        
        if user.role.role_name in ['Administrator', 'Teacher']:
            grade_id = self.request.query_params.get('grade_id')
            if grade_id:
                return base_query.filter(grade_id=grade_id)
            return base_query
        return base_query.none()
