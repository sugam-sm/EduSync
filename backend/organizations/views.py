from rest_framework import generics, permissions, viewsets
from .serializers import OrganizationSerializer, GradeSerializer, SubjectSerializer, AssignSubjectSerializer
from .models import Grade, Subject, AssignSubject

# custom permission for cheking if the user is an admin.
class IsOrganizationAdmin(permissions.BasePermission):
    # restriciting write operations for students and teachers
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        return(
            request.user.role.role_name == 'Administrator'
        )

# Class for retrieving and updating the organizations data using generics
class OrganizationDetailView(generics.RetrieveUpdateAPIView):
    # using the OrganizationSerilizer for converting the data
    serializer_class = OrganizationSerializer
    # checks if the user is authenticated (logged in) and if ther user is admin.
    permission_classes = [permissions.IsAuthenticated, IsOrganizationAdmin]

    def get_object(self):
        # returns the organization details that the user is connected to.
        return self.request.user.organization

# control access to grade
class GradeViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsOrganizationAdmin]
    serializer_class = GradeSerializer

    def get_queryset(self):
        # currently logged in user.
        user = self.request.user
        # restricting to one's organization
        base_query = Grade.objects.filter(organization=user.organization)

        # if administrator, return all the grades of the organization
        if user.role.role_name == 'Administrator':
            return base_query
        
        # if teacher, return only the grades that the teacher is assigned to
        if user.role.role_name == 'Teacher':
            return base_query.filter(assignsubject__teacher__user=user).distinct()
        
        # if student, return only the grade that the student is assigned to
        if user.role.role_name == 'Student':
            return base_query.filter(id=user.student_profile.grade_id)
        
        return base_query.none()

    def perform_create(self, serializer):
        serializer.save()

# control access to subjects
class SubjectViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsOrganizationAdmin]
    serializer_class = SubjectSerializer

    def get_queryset(self):
        user = self.request.user
        base_query = Subject.objects.filter(organization=user.organization)

        # if administrator, return all the subjects in the organization.
        if user.role.role_name == "Administrator":
            return base_query
        
        # if teacher, return only the subjects that the particular teacher is assigned to.
        if user.role.role_name == "Teacher":
            return base_query.filter(assign__subject__teacher__user=user).distinct()

        # if student, return only the subjects that is related to the grade that the student is assigned to.
        if user.role.role_name == "Student":
            return base_query.filter(assignsubject__grade=user.student_profile.grade).distinct()

        return base_query.none()
    
# control access to teacher-subject assignments.
class AssignSubjectViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsOrganizationAdmin]
    serializer_class = AssignSubjectSerializer

    def get_queryset(self):
        user = self.request.user
        base_query = AssignSubject.objects.filter(grade__organization=user.organization)
        
        if user.role.role_name == 'Administrator':
            return base_query
        if user.role.role_name == 'Teacher':
            return base_query.filter(teacher__user=user)
        if user.role.role_name == 'Student':
            return base_query.filter(grade=user.student_profile.grade)
        return base_query.none()

    def perform_create(self, serializer):
        serializer.save()
