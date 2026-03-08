import re
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from .models import Organization, Grade, Subject, AssignSubject
from datetime import datetime

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'email', 'logo']
        read_only_fields = ['id']

    email = serializers.EmailField(
        validators=[UniqueValidator(
            queryset=Organization.objects.all(),
            message="An organization with this email already exists."
        )]
    )

class GradeSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='class_teacher.full_name', read_only=True)

    class Meta:
        model = Grade
        fields = ['id', 'name', 'section', 'academic_year', 'is_active', 'organization', 'class_teacher', 'teacher_name']
        read_only_fields = ['id', 'academic_year', 'organization']
        extra_kwargs = {
            'academic_year': {'required': False},
            'organization': {'required': False},
        }

    def validate_section(self, value):
        cleaned_value = value.strip().upper()
        if not re.fullmatch(r'[A-Z]+|[0-9]+', cleaned_value):
            raise serializers.ValidationError(
                "Section must be either entirely letters or entirely numbers."
            )
        return cleaned_value

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
    class Meta:
        model = Subject
        fields = ['id', 'name']
        read_only_fields = ['id']

    def create(self, validated_data): 
        validated_data['organization'] = self.context['request'].user.organization
        return super().create(validated_data)

class AssignSubjectSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.full_name', read_only=True)

    class Meta:
        model = AssignSubject
        fields = ['id', 'subject', 'grade', 'teacher', 'subject_name', 'teacher_name']

    def validate(self, data):
        org = self.context['request'].user.organization
        if data['subject'].organization != org or data['grade'].organization != org:
            raise serializers.ValidationError("Subject or Grade does not belong to your organization.")
        return data