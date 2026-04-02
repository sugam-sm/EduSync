import base64, uuid
from django.core.files.base import ContentFile
from django.db import transaction
from rest_framework import serializers

from .models import ResourceFolder, Resource, FlashcardDeck, Flashcard, Quiz, Question, Choice
from organizations.models import AssignSubject

class Base64ImageField(serializers.ImageField):
    """Handles Base64 strings sent from frontend and converts them to files."""
    def to_internal_value(self, data):
        if isinstance(data, str) and data.startswith('data:image'):
            header, imgstr = data.split(';base64,')
            ext = header.split('/')[-1]
            data = ContentFile(base64.b64decode(imgstr), name=f"{uuid.uuid4()}.{ext}")
        return super().to_internal_value(data)

class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ['id', 'title', 'type', 'folder', 'file', 'url', 'uploaded_at']

class ResourceFolderSerialzer(serializers.ModelSerializer):
    resources = ResourceSerializer(many=True, read_only=True)
    grade_id = serializers.IntegerField(write_only=True, required=False)
    subject_name = serializers.CharField(source='sub_assign.subject.name', read_only=True)
    grade_info = serializers.CharField(source='sub_assign.grade.name', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.user.full_name', read_only=True)

    class Meta:
        model = ResourceFolder
        fields = ['id', 'name', 'sub_assign', 'uploaded_by', 'uploaded_at', 'resources', 'grade_id', 'subject_name', 'grade_info', 'uploaded_by_name']
        read_only_fields = ['id', 'sub_assign', 'uploaded_by', 'uploaded_at']

    def validate(self, data):
        grade_id = data.get('grade_id')
        user = self.context['request'].user
        
        # Only validate if a new grade_id is provided
        if grade_id:
            sub_assign = AssignSubject.objects.filter(teacher__user=user, grade_id=grade_id).first()
            if not sub_assign:
                raise serializers.ValidationError({"grade_id": "You are not assigned to this grade."})
            
            data['sub_assign'] = sub_assign
        
        return data

    def create(self, validated_data):
        with transaction.atomic():
            if 'grade_id' not in validated_data:
                raise serializers.ValidationError({"grade_id": "This field is required for creation."})
                
            validated_data['uploaded_by'] = self.context['request'].user.teacher_profile
            validated_data.pop('grade_id', None)
            return super().create(validated_data)

class FlashcardSerializer(serializers.ModelSerializer):
    front_image = Base64ImageField(required=False, allow_null=True)
    back_image = Base64ImageField(required=False, allow_null=True)

    class Meta:
        model = Flashcard
        fields = ['id', 'deck', 'front', 'back', 'front_image', 'back_image']

    def validate(self, data):
        # Validate that each side has either text OR an image
        if not data.get('front') and not data.get('front_image'):
            raise serializers.ValidationError("The front of the card needs either text or an image.")
        if not data.get('back') and not data.get('back_image'):
            raise serializers.ValidationError("The back of the card needs either text or an image.")
        return data

class FlashcardDeckSerializer(serializers.ModelSerializer):
    cards = FlashcardSerializer(many=True, read_only=True)
    grade_id = serializers.IntegerField(write_only=True, required=False)
    subject_name = serializers.CharField(source='sub_assign.subject.name', read_only=True)
    grade_info = serializers.CharField(source='sub_assign.grade.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.user.full_name', read_only=True)
    card_count = serializers.IntegerField(source='cards.count', read_only=True)

    class Meta:
        model = FlashcardDeck
        fields = [
            'id', 'title', 'sub_assign', 'created_by', 'created_at', 'cards', 
            'grade_id', 'subject_name', 'grade_info', 'created_by_name', 
            'card_count', 'is_ai_generated'
        ]
        read_only_fields = ['id', 'sub_assign', 'created_by', 'created_at', 'is_ai_generated']

    def validate(self, data):
        grade_id = data.get('grade_id')
        user = self.context['request'].user
        if grade_id:
            sub_assign = AssignSubject.objects.filter(teacher__user=user, grade_id=grade_id).first()
            if not sub_assign:
                raise serializers.ValidationError({"grade_id": "You are not assigned to this grade."})
            data['sub_assign'] = sub_assign
        return data

    def create(self, validated_data):
        with transaction.atomic():
            if 'grade_id' not in validated_data:
                raise serializers.ValidationError({"grade_id": "This field is required for creation."})
            validated_data['created_by'] = self.context['request'].user.teacher_profile
            validated_data.pop('grade_id', None)
            return super().create(validated_data)
    


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'choice_text', 'is_correct']

class QuestionSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True)
    image = Base64ImageField(required=False, allow_null=True)

    class Meta:
        model = Question
        fields = ['id', 'quiz', 'question_text', 'question_type', 'points_override', 'time_override_seconds', 'image', 'order', 'choices']
        read_only_fields = ['id']

    def create(self, validated_data):
        choices_data = validated_data.pop('choices', [])
        if len(choices_data) > 4:
            raise serializers.ValidationError("A question can have a maximum of 4 choices.")
        with transaction.atomic():
            question = Question.objects.create(**validated_data)
            for choice_data in choices_data:
                Choice.objects.create(question=question, **choice_data)
        return question

    def update(self, instance, validated_data):
        choices_data = validated_data.pop('choices', None)
        if choices_data is not None and len(choices_data) > 4:
            raise serializers.ValidationError("A question can have a maximum of 4 choices.")
        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            if choices_data is not None:
                instance.choices.all().delete()
                for choice_data in choices_data:
                    Choice.objects.create(question=instance, **choice_data)

        return instance

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    grade_id = serializers.IntegerField(write_only=True, required=False)
    questions_count = serializers.IntegerField(source='questions.count', read_only=True)
    subject_name = serializers.CharField(source='sub_assign.subject.name', read_only=True)
    grade_info = serializers.CharField(source='sub_assign.grade.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.user.full_name', read_only=True)

    class Meta:
        model = Quiz
        fields = [
            'id', 'title', 'sub_assign', 'created_by', 
            'is_active', 'is_published', 'start_datetime', 'end_datetime', 
            'default_time_per_question', 'created_at', 'grade_id', 'questions', 'questions_count',
            'subject_name', 'grade_info', 'created_by_name', 'is_ai_generated'
        ]
        read_only_fields = ['id', 'sub_assign', 'created_by', 'created_at', 'is_ai_generated']

    def validate(self, data):
        grade_id = data.get('grade_id')
        user = self.context['request'].user
        if grade_id:
            sub_assign = AssignSubject.objects.filter(teacher__user=user, grade_id=grade_id).first()
            if not sub_assign:
                raise serializers.ValidationError({"grade_id": "You are not assigned to this grade."})
            data['sub_assign'] = sub_assign
        return data

    def create(self, validated_data):
        with transaction.atomic():
            if 'grade_id' not in validated_data:
                raise serializers.ValidationError({"grade_id": "This field is required for creation."})
            validated_data['created_by'] = self.context['request'].user.teacher_profile
            validated_data.pop('grade_id', None)
            return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('grade_id', None)
        return super().update(instance, validated_data)

