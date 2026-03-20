from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from .models import Session, Attendance, TeacherQuizRemark, QuizAttempt, StudentResponse
from users.models import Student, Teacher
from organizations.models import Grade, Subject
from learning.models import Quiz

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.user.full_name')
    student_username = serializers.ReadOnlyField(source='student.user.username')
    
    class Meta:
        model = Attendance
        fields = ['id', 'session', 'student', 'student_username', 'student_name', 'status', 'marked_at']
        read_only_fields = ['id', 'marked_at']

class SessionSerializer(serializers.ModelSerializer):
    teacher_name = serializers.ReadOnlyField(source='teacher.user.full_name')
    grade_name = serializers.ReadOnlyField(source='grade.name')
    section = serializers.ReadOnlyField(source='grade.section')
    subject_name = serializers.ReadOnlyField(source='subject.name')
    attendances = AttendanceSerializer(many=True, read_only=True)

    class Meta:
        model = Session
        fields = [
            'id', 'teacher', 'teacher_name', 'grade', 'grade_name', 'section', 
            'subject', 'subject_name', 'start_time', 'end_time', 'is_active', 'attendances'
        ]
        read_only_fields = ['teacher', 'start_time', 'end_time', 'is_active']

class TeacherQuizRemarkSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.full_name', read_only=True)
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)

    class Meta:
        model = TeacherQuizRemark
        fields = ['id', 'quiz', 'quiz_title', 'student', 'teacher', 'teacher_name', 'student_name', 'remark_text', 'created_at']
        read_only_fields = ['id', 'teacher', 'teacher_name', 'student_name', 'created_at']

class BulkRemarkItemSerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    remark_text = serializers.CharField(max_length=2000)

class BulkRemarkSerializer(serializers.Serializer):
    remarks = BulkRemarkItemSerializer(many=True)

class StudentResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentResponse
        fields = ['id', 'attempt', 'question', 'selected_choice', 'time_taken_seconds']

class QuizAttemptSerializer(serializers.ModelSerializer):
    responses = StudentResponseSerializer(many=True, required=False)
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    student_id = serializers.IntegerField(source='student.pk', read_only=True)
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)

    class Meta:
        model = QuizAttempt
        fields = [
            'id', 'quiz', 'quiz_title', 'student', 'student_id', 'student_name', 
            'total_score', 'started_at', 'completed_at', 'status', 'responses'
        ]
        read_only_fields = ['id', 'student', 'total_score', 'started_at', 'completed_at', 'status']

    def create(self, validated_data):
        responses_data = validated_data.pop('responses', [])
        quiz = validated_data['quiz']
        student = self.context['request'].user.student_profile
        
        with transaction.atomic():
            attempt = QuizAttempt.objects.create(
                quiz=quiz,
                student=student,
                status='completed', # Default to completed if submitted via this method
                completed_at=timezone.now()
            )
            
            score = 0
            for resp_data in responses_data:
                choice = resp_data.get('selected_choice')
                if choice and choice.is_correct:
                    question = resp_data.get('question')
                    score += question.points_override
                
                StudentResponse.objects.create(attempt=attempt, **resp_data)
            
            attempt.total_score = score
            attempt.save()
            
        return attempt
