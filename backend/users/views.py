from rest_framework import viewsets, permissions
from django.contrib.auth import get_user_model
from .serializers import UserListSerializer, UserDetailSerializer, UserCreationSerializer, UserUpdateSerializer

User = get_user_model()

class IsOrganizationAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.role.role_name == "Administrator"
        )

class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsOrganizationAdmin]
    
    def get_queryset(self):
        # Only show users belonging to the Admin's organization
        user = self.request.user
        return User.objects.filter(
            organization=user.organization,
            role__role_name__in=['Teacher', 'Student']
        ).select_related(
            'role', 'teacher_profile', 'student_profile'
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        if self.action == 'create':
            return UserCreationSerializer
        if self.action == 'partial_update':
            return UserUpdateSerializer
        return UserDetailSerializer

