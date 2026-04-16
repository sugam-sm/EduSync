from rest_framework import generics, permissions, viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
import csv
import io
from .serializers import OrganizationSerializer, GradeSerializer, SubjectSerializer, AssignSubjectSerializer
from .models import Organization, Grade, Subject, AssignSubject

# custom permission for checking if the user is an admin.
class IsOrganizationAdmin(permissions.BasePermission):
    # restricting write operations for students and teachers
    def has_permission(self, request, view):
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
    serializer_class = GradeSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOrganizationAdmin()]

    def get_queryset(self):
        # currently logged in user.
        user = self.request.user
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

    def normalize_row(self, row, aliases):
        cleaned = {}
        for k, v in row.items():
            if k is None: continue
            norm_key = k.strip().lower().replace(' ', '_')
            cleaned[norm_key] = v.strip() if isinstance(v, str) else v
        
        final = cleaned.copy()
        for alias, target in aliases.items():
            if alias in cleaned and target not in cleaned:
                final[target] = cleaned[alias]
        return final

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser])
    def bulk_upload(self, request):
        from django.core.exceptions import ValidationError
        from datetime import datetime
        file = request.FILES.get('file')
        if not file:
            return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            decoded_file = file.read().decode('utf-8-sig')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            aliases = {
                'grade': 'name',
                'grade_name': 'name',
                'class': 'name',
                'year': 'academic_year',
            }

            created_grades = []
            errors = []

            for index, row in enumerate(reader):
                try:
                    row = self.normalize_row(row, aliases)
                    name = row.get('name')
                    section = row.get('section')
                    academic_year = row.get('academic_year') or str(datetime.now().year)

                    if not name or not section:
                        errors.append(f"Row {index+1}: Name and Section are required.")
                        continue

                    grade = Grade(
                        name=name,
                        section=section.strip().upper(),
                        academic_year=str(academic_year).strip(),
                        organization=request.user.organization
                    )
                    
                    try:
                        grade.full_clean()
                        grade.save()
                        created_grades.append(grade.id)
                    except ValidationError as ve:
                        def flatten_errors(errs):
                            msgs = []
                            for field, field_errors in errs.items():
                                label = field.replace('_', ' ').title()
                                for err in field_errors:
                                    if label == "__All__":
                                        msgs.append(f"Row {index+1}: {err}")
                                    else:
                                        msgs.append(f"Row {index+1}: {label} — {err}")
                            return msgs
                        errors.extend(flatten_errors(ve.message_dict))
                        
                except Exception as row_e:
                    errors.append(f"Row {index+1}: {str(row_e)}")
            
            return Response({
                "detail": f"Successfully imported {len(created_grades)} grades.",
                "errors": errors if errors else None
            }, status=status.HTTP_201_CREATED if len(created_grades) > 0 else status.HTTP_207_MULTI_STATUS)
        except Exception as e:
            return Response({"detail": f"Error parsing CSV: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({"detail": "Grade deleted successfully"}, status=status.HTTP_200_OK)


# control access to subjects
class SubjectViewSet(viewsets.ModelViewSet):
    serializer_class = SubjectSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOrganizationAdmin()]

    def get_queryset(self):
        user = self.request.user
        base_query = Subject.objects.filter(organization=user.organization)
        grade_id = self.request.query_params.get('grade')

        # if administrator, return all the subjects in the organization.
        if user.role and user.role.role_name == "admin":
            if grade_id and grade_id != 'All':
                return base_query.filter(assignsubject__grade=grade_id).distinct()
            return base_query
        
        # if teacher, return only the subjects that the particular teacher is assigned to.
        if user.role and user.role.role_name == "teacher":
            if grade_id and grade_id != 'All':
                return base_query.filter(
                    assignsubject__teacher__user=user,
                    assignsubject__grade=grade_id
                ).distinct()
            return base_query.filter(assignsubject__teacher__user=user).distinct()

        # if student, return only the subjects that is related to the grade that the student is assigned to.
        if user.role and user.role.role_name == "student":
            if getattr(user, 'student_profile', None):
                return base_query.filter(assignsubject__grade=user.student_profile.grade).distinct()

        return base_query.none()

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser])
    def bulk_upload(self, request):
        from django.core.exceptions import ValidationError
        file = request.FILES.get('file')
        if not file:
            return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            decoded_file = file.read().decode('utf-8-sig')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            aliases = {
                'subject': 'name',
                'subject_name': 'name',
            }

            created_subjects = []
            errors = []

            for index, row in enumerate(reader):
                try:
                    cleaned = {}
                    for k, v in row.items():
                        if k is None: continue
                        norm_key = k.strip().lower().replace(' ', '_')
                        cleaned[norm_key] = v.strip() if isinstance(v, str) else v
                    
                    row = cleaned.copy()
                    for alias, target in aliases.items():
                        if alias in cleaned and target not in cleaned:
                            row[target] = cleaned[alias]

                    name = row.get('name')
                    if not name:
                        errors.append(f"Row {index+1}: Name is required.")
                        continue

                    subject = Subject(
                        name=name,
                        organization=request.user.organization
                    )
                    
                    try:
                        subject.full_clean()
                        subject.save()
                        created_subjects.append(subject.id)
                    except ValidationError as ve:
                        def flatten_errors(errs):
                            msgs = []
                            for field, field_errors in errs.items():
                                label = field.replace('_', ' ').title()
                                for err in field_errors:
                                    if label == "__All__":
                                        msgs.append(f"Row {index+1}: {err}")
                                    else:
                                        msgs.append(f"Row {index+1}: {label} — {err}")
                            return msgs
                        errors.extend(flatten_errors(ve.message_dict))
                except Exception as row_e:
                    errors.append(f"Row {index+1}: {str(row_e)}")
            
            return Response({
                "detail": f"Successfully imported {len(created_subjects)} subjects.",
                "errors": errors if errors else None
            }, status=status.HTTP_201_CREATED if len(created_subjects) > 0 else status.HTTP_207_MULTI_STATUS)
        except Exception as e:
            return Response({"detail": f"Error parsing CSV: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({"detail": "Subject deleted successfully"}, status=status.HTTP_200_OK)

    
# control access to teacher-subject assignments.
class AssignSubjectViewSet(viewsets.ModelViewSet):
    serializer_class = AssignSubjectSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOrganizationAdmin()]

    def get_queryset(self):
        user = self.request.user
        base_query = AssignSubject.objects.filter(grade__organization=user.organization)
        
        if getattr(user, 'role', None) and user.role.role_name == 'admin':
            return base_query
        if getattr(user, 'role', None) and user.role.role_name == 'teacher':
            return base_query.filter(teacher__user=user)
        if getattr(user, 'role', None) and user.role.role_name == 'student':
            if getattr(user, 'student_profile', None):
                return base_query.filter(grade=user.student_profile.grade)
        return base_query.none()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({"detail": "Assignment deleted successfully"}, status=status.HTTP_200_OK)