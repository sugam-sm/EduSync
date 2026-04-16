import re
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from .models import Organization, Grade, Subject, AssignSubject
from datetime import datetime

class OrganizationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        validators=[UniqueValidator(
            queryset=Organization.objects.all(),
            message="An organization with this email already exists."
        )]
    )

    class Meta:
        model = Organization
        fields = ['id', 'name', 'email', 'logo', 'is_active']
        read_only_fields = ['id']

class GradeSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='class_teacher.full_name', read_only=True)
    org_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = Grade
        fields = ['id', 'name', 'section', 'academic_year', 'is_active', 'organization', 'class_teacher', 'teacher_name', 'org_name']
        read_only_fields = ['id', 'academic_year', 'organization', 'org_name']
        extra_kwargs = {
            'academic_year': {'required': False},
            'organization': {'required': False},
        }

    def validate_section(self, value):
        cleaned_value = value.strip().upper()
        if not re.fullmatch(r'[A-Z]+|[0-9]+', cleaned_value):
            raise serializers.ValidationError("Section must be either entirely letters or entirely numbers.")
        return cleaned_value

    def validate(self, attrs):
        name = attrs.get('name')
        section = attrs.get('section')
        
        request = self.context.get('request')
        org = request.user.organization if request else None
        academic_year = attrs.get('academic_year') or str(datetime.now().year)

        if name and section and org:
            existing = Grade.objects.filter(
                name=name,
                section=section,
                academic_year=academic_year,
                organization=org
            )
            
            if self.instance:
                existing = existing.exclude(id=self.instance.id)
            
            if existing.exists():
                raise serializers.ValidationError({
                    "non_field_errors": [f"Grade '{name}' with section '{section}' already exists for this year."]
                })
        
        return attrs

    def validate_class_teacher(self, value):
        if value:
            existing_class = Grade.objects.filter(
                class_teacher=value, 
                is_active=True
            ).exclude(id=self.instance.id if self.instance else None)
            if existing_class.exists():
                raise serializers.ValidationError("This teacher is already assigned to another active class.")
        return value

    def create(self, validated_data):
        validated_data['academic_year'] = str(datetime.now().year)
        validated_data['organization'] = self.context['request'].user.organization
        return super().create(validated_data)

class SubjectSerializer(serializers.ModelSerializer):
    org_name = serializers.CharField(source='organization.name', read_only=True)
    class Meta:
        model = Subject
        fields = ['id', 'name', 'org_name']
        read_only_fields = ['id', 'org_name']

    def validate_name(self, value):
        return value.strip().lower()

    def validate(self, attrs):
        name = attrs.get('name')
        if name:
            org = self.context['request'].user.organization
            # Check for uniqueness within the organization
            existing = Subject.objects.filter(name=name, organization=org)
            if self.instance:
                existing = existing.exclude(id=self.instance.id)
            
            if existing.exists():
                raise serializers.ValidationError({"name": "A subject with this name already exists in your organization."})
        return attrs

    def create(self, validated_data): 
        validated_data['organization'] = self.context['request'].user.organization
        return super().create(validated_data)

class AssignSubjectSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.full_name', read_only=True)
    grade_name = serializers.CharField(source='grade.name', read_only=True)
    grade_section = serializers.CharField(source='grade.section', read_only=True)
    org_name = serializers.CharField(source='grade.organization.name', read_only=True)

    class Meta:
        model = AssignSubject
        fields = ['id', 'subject', 'grade', 'teacher', 'subject_name', 'teacher_name', 'grade_name', 'grade_section', 'org_name']
        validators = []

    def validate(self, data):
        org = self.context['request'].user.organization
        subject = data.get('subject')
        grade = data.get('grade')

        if subject.organization != org or grade.organization != org:
            raise serializers.ValidationError("Subject or Grade does not belong to your organization.")
        
        # Check for unique subject-grade combination with custom message
        existing = AssignSubject.objects.filter(subject=subject, grade=grade)
        if self.instance:
            existing = existing.exclude(id=self.instance.id)
            
        if existing.exists():
            raise serializers.ValidationError({
                "non_field_errors": ["The teacher is already assigned to the subject for this grade."]
            })

        return data