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
        fields = '__all__'

class ResourceFolderSerialzer(serializers.ModelSerializer):
    resources = ResourceSerializer(many=True, read_only=True)
    grade_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = ResourceFolder
        fields = ['id', 'name', 'sub_assign', 'uploaded_by', 'uploaded_at', 'resources', 'grade_id']
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

    class Meta:
        model = FlashcardDeck
        fields = ['id', 'title', 'sub_assign', 'created_by', 'created_at', 'cards', 'grade_id']
        read_only_fields = ['id', 'sub_assign', 'created_by', 'created_at']

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

    class Meta:
        model = Question
        fields = ['id', 'question_text', 'type', 'points', 'image', 'choices']

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)
    grade_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'sub_assign', 'created_by', 'is_active', 'time_limit_minutes', 'created_at', 'grade_id', 'questions']
        read_only_fields = ['id', 'sub_assign', 'created_by', 'created_at']

    def create(self, validated_data):
        questions_data = validated_data.pop('questions')
        grade_id = validated_data.pop('grade_id')
        user = self.context['request'].user

        sub_assign = AssignSubject.objects.filter(teacher__user=user, grade_id=grade_id).first()

        if not sub_assign:
            raise serializers.ValidationError({"grade_id": "You are not assigned to this grade."})

        with transaction.atomic():
            quiz = Quiz.objects.create(sub_assign=sub_assign, created_by=user.teacher_profile, **validated_data)

            for question_data in questions_data:
                choices_data = question_data.pop('choices')
                question = Question.objects.create(quiz=quiz, **question_data)
                
                for choice_data in choices_data:
                    Choice.objects.create(question=question, **choice_data)

        return quiz