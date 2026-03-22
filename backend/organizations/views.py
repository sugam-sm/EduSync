from rest_framework import generics, permissions, viewsets
from rest_framework.response import Response
from .serializers import OrganizationSerializer, GradeSerializer, SubjectSerializer, AssignSubjectSerializer
from .models import Organization, Grade, Subject, AssignSubject

# custom permission for checking if the user is an admin.
class IsOrganizationAdmin(permissions.BasePermission):
    # restricting write operations for students and teachers
    def has_permission(self, request, view):
        if request.user and request.user.is_superuser:
            return True
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        return (
            request.user and
            request.user.role and
            request.user.role.role_name == "admin"
        )

# Class for retrieving and updating the organizations data using generics
class OrganizationDetailView(generics.RetrieveUpdateAPIView):
    # using the OrganizationSerializer for converting the data
    serializer_class = OrganizationSerializer
    # checks if the user is authenticated (logged in) and if the user is admin.
    permission_classes = [permissions.IsAuthenticated, IsOrganizationAdmin]

    def get_object(self):
        # returns the organization details that the user is connected to.
        return self.request.user.organization

# List and Create organizations (for superusers)
class OrganizationListView(generics.ListCreateAPIView):
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return Organization.objects.all()
        if self.request.user.organization:
            return Organization.objects.filter(id=self.request.user.organization.id)
        return Organization.objects.none()

# Superadmin managing specific organizations (rud)
class OrganizationSuperAdminManageView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return Organization.objects.all()
        return Organization.objects.none()

# control access to grade
class GradeViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsOrganizationAdmin]
    serializer_class = GradeSerializer

    def get_queryset(self):
        # currently logged in user.
        user = self.request.user
        # Superuser: return ALL grades across all organizations
        if user.is_superuser:
            return Grade.objects.all().select_related('organization', 'class_teacher')
        # restricting to one's organization
        base_query = Grade.objects.filter(organization=user.organization)

        # if administrator, return all the grades of the organization
        if user.role and user.role.role_name == 'admin':
            return base_query
        
        # if teacher, return only the grades that the teacher is assigned to
        if user.role and user.role.role_name == 'teacher':
            return base_query.filter(assignsubject__teacher__user=user).distinct()
        
        # if student, return only the grade that the student is assigned to
        if user.role and user.role.role_name == 'student':
            if getattr(user, 'student_profile', None):
                return base_query.filter(id=user.student_profile.grade_id)
        
        return base_query.none()

# control access to subjects
class SubjectViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsOrganizationAdmin]
    serializer_class = SubjectSerializer

    def get_queryset(self):
        user = self.request.user
        # Superuser: return ALL subjects across all organizations
        if user.is_superuser:
            return Subject.objects.all().select_related('organization')
        base_query = Subject.objects.filter(organization=user.organization)

        # if administrator, return all the subjects in the organization.
        if user.role and user.role.role_name == "admin":
            return base_query
        
        # if teacher, return only the subjects that the particular teacher is assigned to.
        if user.role and user.role.role_name == "teacher":
            return base_query.filter(assignsubject__teacher__user=user).distinct()

        # if student, return only the subjects that is related to the grade that the student is assigned to.
        if user.role and user.role.role_name == "student":
            if getattr(user, 'student_profile', None):
                return base_query.filter(assignsubject__grade=user.student_profile.grade).distinct()

        return base_query.none()
    
# control access to teacher-subject assignments.
class AssignSubjectViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsOrganizationAdmin]
    serializer_class = AssignSubjectSerializer

    def get_queryset(self):
        user = self.request.user
        # Superuser: return ALL assignments
        if user.is_superuser:
            return AssignSubject.objects.all().select_related('subject', 'grade', 'teacher__user')
        base_query = AssignSubject.objects.filter(grade__organization=user.organization)
        
        if getattr(user, 'role', None) and user.role.role_name == 'admin':
            return base_query
        if getattr(user, 'role', None) and user.role.role_name == 'teacher':
            return base_query.filter(teacher__user=user)
        if getattr(user, 'role', None) and user.role.role_name == 'student':
            if getattr(user, 'student_profile', None):
                return base_query.filter(grade=user.student_profile.grade)
        return base_query.none()