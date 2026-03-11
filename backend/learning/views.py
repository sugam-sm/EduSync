from rest_framework import viewsets, permissions
from .models import Resource, ResourceFolder
from .serializers import ResourceSerializer, ResourceFolderSerialzer

class ResourcePermissions(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        return bool(
            request.user.role.role_name == 'Teacher'
        )
    
class ResourceFolderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, ResourcePermissions]
    serializer_class = ResourceFolderSerialzer

    def get_queryset(self):
        user = self.request.user
        
        # restricting viewset to current Organization
        base_query = ResourceFolder.objects.filter(subject__organization=user.organization)

        if user.role.role_name == 'Teacher':
            queryset = base_query.filter(subject__assignsubject__teacher__user=user)
        
            selected_grade = self.request.query_params.get('grade_id')
            if selected_grade:
                queryset = queryset.filter(subject__assignsubject__grade_id=selected_grade)
            return queryset.distinct()
        
        elif user.role.role_name == 'Student':
            queryset = base_query.filter(subject__assignsubject__grade=user.student_profile.grade)

            selected_subject = self.request.query_params.get('subject_id')
            if selected_subject:
                queryset = queryset.filter(subject_id=selected_subject)

            return queryset.distinct()

        return base_query.none()
        
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user.teacher_profile)

class ResourceViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceSerializer
    permission_classes = [permissions.IsAuthenticated, ResourcePermissions]

    def get_queryset(self):
        user = self.request.user
        
        base_query = Resource.objects.filter(folder__subject__organization=user.organization)

        if user.role.role_name == 'Teacher':
            return base_query.filter(folder__subject__assignsubject__teacher__user=user).distinct()

        elif user.role.role_name == 'Student':
            return base_query.filter(folder__subject__assignsubject__grade=user.student_profile.grade).distinct()
        
        return base_query.none()

