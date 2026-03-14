from rest_framework import viewsets, permissions
from .models import Resource, ResourceFolder
from .serializers import ResourceSerializer, ResourceFolderSerialzer

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
            queryset = base_query.filter(
                sub_assign__teacher__user=user,
                uploaded_by=user.teacher_profile
            )
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
            return base_query.filter(
                folder__sub_assign__teacher__user=user,
                folder__uploaded_by=user.teacher_profile
            ).distinct()

        elif user.role.role_name == 'Student':
            return base_query.filter(folder__sub_assign__grade=user.student_profile.grade).distinct()
        
        return base_query.none()