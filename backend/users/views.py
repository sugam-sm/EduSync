from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from django.contrib.auth import get_user_model
import csv, io
from datetime import datetime
from .serializers import UserListSerializer, UserDetailSerializer, UserCreationSerializer, UserUpdateSerializer, StudentSerializer
from .models import Student
from organizations.models import Organization, Grade, Subject
from learning.models import Quiz, FlashcardDeck, ResourceFolder
from analytics.models import Session, QuizAttempt

User = get_user_model()

class IsOrganizationAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.role and
            request.user.role.role_name == "admin"
        )

class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return User.objects.filter(role__role_name="admin").select_related('role', 'organization')
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

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({"detail": "User deleted successfully"}, status=status.HTTP_200_OK)


    @staticmethod
    def _normalize_csv_row(row):
        """Normalize a CSV row: strip whitespace, standardize headers, and standardize field values."""
        raw_cleaned = {}
        for k, v in row.items():
            if k is None: continue
            norm_key = k.strip().lower().replace(' ', '_')
            raw_cleaned[norm_key] = v.strip() if isinstance(v, str) else v

        aliases = {
            'firstname': 'first_name',
            'lastname': 'last_name',
            'middlename': 'middle_name',
            'fullname': 'full_name',
            'phone': 'contact_number',
            'contact': 'contact_number',
            'mobile': 'contact_number',
            'degree': 'qualification',
            'major': 'specialization',
            'class': 'grade_name',
            'parent_name': 'guardian_name',
            'parent_contact': 'guardian_contact',
            'parent_relation': 'guardian_relation',
            'gradename': 'grade_name',
            'academicyear': 'academic_year',
            'subject': 'specialization',
            'subject_name': 'specialization',
        }
        
        cleaned = raw_cleaned.copy()
        for alias, target in aliases.items():
            # If alias exists and target doesn't, map it
            if alias in raw_cleaned and target not in raw_cleaned:
                cleaned[target] = raw_cleaned[alias]

        # 3. Standardize Values
        # Normalize gender: accept any case variation of Male/Female/Other
        GENDER_MAP = {
            'm': 'Male', 'male': 'Male',
            'f': 'Female', 'female': 'Female',
            'o': 'Other', 'other': 'Other',
        }
        raw_gender = str(cleaned.get('gender', '')).lower()
        cleaned['gender'] = GENDER_MAP.get(raw_gender, '')

        # Normalize role to lowercase
        cleaned['role'] = str(cleaned.get('role', '')).lower()

        # Title-case name fields for better presentation
        for name_field in ('first_name', 'middle_name', 'last_name', 'guardian_name'):
            val = cleaned.get(name_field, '')
            if val:
                cleaned[name_field] = str(val).title()

        # Standardize section, grade_name, and academic_year to uppercase
        for up_field in ('section', 'grade_name', 'academic_year'):
            if cleaned.get(up_field):
                cleaned[up_field] = str(cleaned[up_field]).upper()

        return cleaned

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser])
    def bulk_upload(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            decoded_file = file.read().decode('utf-8-sig')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            created_users = []
            errors = []
            
            for index, row in enumerate(reader):
                try:
                    row = self._normalize_csv_row(row)

                    role_name = request.data.get('role') or row.get('role', '')
                    role_name = role_name.strip().lower()
                    if role_name not in ['teacher', 'student']:
                        errors.append(f"Row {index+1}: Invalid or missing role '{role_name}'")
                        continue
                    
                    user_data = {
                        'first_name': row.get('first_name', ''),
                        'middle_name': row.get('middle_name', ''),
                        'last_name': row.get('last_name', ''),
                        'email': row.get('email', ''),
                        'gender': row.get('gender', ''),
                        'organization': request.user.organization.id,
                        'role_name': role_name
                    }
                    
                    if role_name == 'teacher':
                        user_data['teacher_profile'] = {
                            'contact_number': row.get('contact_number', ''),
                            'specialization': row.get('specialization', ''),
                            'qualification': row.get('qualification', '')
                        }
                    else:
                        grade_name = row.get('grade_name', '').strip()
                        section = row.get('section', '').strip()
                        academic_year = row.get('academic_year')
                        if academic_year:
                            academic_year = str(academic_year).strip()
                        else:
                            academic_year = str(datetime.now().year)
                        
                        try:
                            grade = Grade.objects.get(
                                organization=request.user.organization,
                                name=grade_name,
                                section=section,
                                academic_year=academic_year
                            )
                            user_data['student_profile'] = {
                                'grade': grade.id,
                                'guardian_name': row.get('guardian_name', ''),
                                'guardian_relation': row.get('guardian_relation', ''),
                                'guardian_contact': row.get('guardian_contact', '')
                            }
                        except Grade.DoesNotExist:
                            errors.append(f"Row {index+1}: Grade '{grade_name}' Section '{section}' Year '{academic_year}' not found.")
                            continue
                    
                    serializer = UserCreationSerializer(data=user_data, context={'request': request})
                    if serializer.is_valid():
                        serializer.save()
                        created_users.append(serializer.data)
                    else:
                        def flatten_errors(errs, prefix=""):
                            msgs = []
                            for field, field_errors in errs.items():
                                label = field.replace('_', ' ').title()
                                if isinstance(field_errors, dict):
                                    msgs.extend(flatten_errors(field_errors, prefix))
                                elif isinstance(field_errors, list):
                                    for err in field_errors:
                                        if isinstance(err, dict):
                                            msgs.extend(flatten_errors(err, prefix))
                                        else:
                                            msgs.append(f"Row {index+1}: {label} — {err}")
                            return msgs
                        errors.extend(flatten_errors(serializer.errors))
                except Exception as row_e:
                    errors.append(f"Row {index+1}: {str(row_e)}")
            
            return Response({
                "detail": f"Successfully imported {len(created_users)} users.",
                "created_users": created_users,
                "errors": errors if errors else None
            }, status=status.HTTP_201_CREATED if len(created_users) > 0 else status.HTTP_207_MULTI_STATUS)
            
        except Exception as e:
            return Response({"detail": f"Error parsing CSV: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

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
    pagination_class = None # Ensure direct array for dropdowns

    def get_queryset(self):
        user = self.request.user
        # Strict school-level security lock
        qs = Student.objects.filter(user__organization_id=user.organization_id).select_related('user', 'grade')
        
        # Standard grade filtering
        grade = self.request.query_params.get('grade')
        if grade and grade != 'All':
            qs = qs.filter(grade=grade)
            
        return qs

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        role_name = user.role.role_name if user.role else None

        data = {
            "id": user.pk,
            "username": user.username,
            "first_name": user.first_name or "",
            "middle_name": user.middle_name or "",
            "last_name": user.last_name or "",
            "full_name": user.full_name,
            "email": user.email or "",
            "gender": user.gender or "",
            "role": role_name,
            "org_name": user.organization.name if user.organization else None,
            "date_joined": user.date_joined,
            "needs_password_change": user.needs_password_change,
        }

        # Teacher-specific fields
        if role_name == "teacher":
            tp = getattr(user, "teacher_profile", None)
            data["teacher_profile"] = {
                "contact_number": tp.contact_number if tp else "",
                "specialization": tp.specialization if tp else "",
                "qualification": tp.qualification if tp else "",
            }

        # Student-specific fields
        if role_name == "student":
            sp = getattr(user, "student_profile", None)
            data["student_profile"] = {
                "grade_name": sp.grade.name if sp and sp.grade else "",
                "section": sp.grade.section if sp and sp.grade else "",
                "academic_year": sp.grade.academic_year if sp and sp.grade else "",
                "guardian_name": sp.guardian_name if sp else "",
                "guardian_relation": sp.guardian_relation if sp else "",
                "guardian_contact": sp.guardian_contact if sp else "",
            }

        return Response(data)

    def patch(self, request):
        user = request.user
        data = request.data
        errors = {}

        # Password change logic
        old_pw = data.get("old_password")
        new_pw = data.get("new_password")
        confirm_pw = data.get("confirm_password")
        if old_pw or new_pw or confirm_pw:
            if not old_pw:
                errors["old_password"] = "Current password is required."
            elif not new_pw:
                errors["new_password"] = "New password is required."
            elif not confirm_pw:
                errors["confirm_password"] = "Please confirm your new password."
            elif new_pw != confirm_pw:
                errors["confirm_password"] = "New passwords do not match."
            elif len(new_pw) < 6:
                errors["new_password"] = "New password must be at least 6 characters."
            elif not user.check_password(old_pw):
                errors["old_password"] = "Current password is incorrect."
            else:
                user.set_password(new_pw)
                user.needs_password_change = False

        # Basic field updates
        if "email" in data:
            email = data["email"].strip()
            if email:
                dup = User.objects.exclude(pk=user.pk).filter(email=email).exists()
                if dup:
                    errors["email"] = "This email is already registered."
                else:
                    user.email = email
            else:
                user.email = ""

        if "gender" in data:
            valid_genders = ["Male", "Female", "Other", ""]
            if data["gender"] in valid_genders:
                user.gender = data["gender"] or None
            else:
                errors["gender"] = "Invalid gender value."

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        user.save()
        # Return refreshed profile
        return self.get(request)
