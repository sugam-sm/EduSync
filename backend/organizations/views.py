from rest_framework import generics, permissions, viewsets
from rest_framework.permissions import IsAuthenticated
from .serializers import OrganizationSerializer, GradeSerializer, SubjectSerializer, AssignSubjectSerializer
from .models import Grade, Subject, AssignSubject

# class for checking if the user is logged in and an admin.
class IsOrganizationAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and  
            getattr(request.user, 'role') and 
            request.user.role.role_name == "Administrator"
        )

# Class for retrieving and updating the organizations data using generics
class OrganizationDetailView(generics.RetrieveUpdateAPIView):
    # using the OrganizationSerilizer for converting the data
    serializer_class = OrganizationSerializer
    # checks if the user is authenticated (logged in) and if ther user is admin.
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]

    def get_object(self):
        # returns the organization details that the user is connected to.
        return self.request.user.organization
    
class GradeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]
    serializer_class = GradeSerializer

    def get_queryset(self):
        return Grade.objects.filter(organization=self.request.user.organization)

    def perform_create(self, serializer):
        serializer.save()

class SubjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]
    serializer_class = SubjectSerializer

    def get_queryset(self):
        return Subject.objects.filter(organization=self.request.user.organization)
    
class AssignSubjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]
    serializer_class = AssignSubjectSerializer

    def get_queryset(self):
        return AssignSubject.objects.filter(grade__organization=self.request.user.organization)

    def perform_create(self, serializer):
        serializer.save()
