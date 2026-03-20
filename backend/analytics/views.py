from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from .models import Session, Attendance, TeacherQuizRemark, QuizAttempt, StudentResponse
from .serializers import (
    SessionSerializer, AttendanceSerializer, TeacherQuizRemarkSerializer, 
    BulkRemarkSerializer, QuizAttemptSerializer, StudentResponseSerializer
)
from users.models import Student
from learning.models import Quiz

class SessionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SessionSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Session.objects.filter(teacher__user=user).prefetch_related('attendances__student__user')
        
        grade_id = self.request.query_params.get('grade_id')
        if grade_id:
            queryset = queryset.filter(grade_id=grade_id)
            
        return queryset

    def create(self, request, *args, **kwargs):
        teacher = request.user.teacher_profile
        if Session.objects.filter(teacher=teacher, is_active=True).exists():
            return Response(
                {"error": "You already have an active session. Please end it before starting a new one."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user.teacher_profile)

    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        session = self.get_object()
        if not session.is_active:
            return Response({"error": "Session is already ended."}, status=status.HTTP_400_BAD_REQUEST)
        
        session.is_active = False
        session.end_time = timezone.now()
        session.save()

        # Auto-mark missing students as ABSENT
        students = Student.objects.filter(grade=session.grade)
        marked_student_ids = session.attendances.values_list('student_id', flat=True)
        
        absent_attendances = []
        for student in students:
            if student.user_id not in marked_student_ids:
                absent_attendances.append(Attendance(
                    session=session,
                    student=student,
                    status='ABSENT'
                ))
        
        Attendance.objects.bulk_create(absent_attendances)
        
        return Response(SessionSerializer(session).data)

class AttendanceViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        return Attendance.objects.filter(session__teacher__user=self.request.user)

    def create(self, request, *args, **kwargs):
        session_id = request.data.get('session')
        student_id = request.data.get('student')
        student_username = request.data.get('username')
        requested_status = request.data.get('status')
        
        try:
            session = Session.objects.get(id=session_id, teacher__user=self.request.user)
        except Session.DoesNotExist:
            return Response({"error": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

        # Lookup student by username if provided, otherwise use student_id
        if student_username:
            try:
                student = Student.objects.get(user__username=student_username, user__organization=self.request.user.organization)
                student_id = student.user_id # Student PK is user_id
            except Student.DoesNotExist:
                return Response({"error": f"Student with username '{student_username}' not found."}, status=status.HTTP_404_NOT_FOUND)
        elif not student_id:
            return Response({"error": "Student ID or username required."}, status=status.HTTP_400_BAD_REQUEST)

        attendance_status = requested_status
        if not attendance_status:
            # Logic for LATE status (automatic marking during live session)
            now = timezone.now()
            diff = (now - session.start_time).total_seconds()
            
            attendance_status = 'PRESENT'
            if diff > 600: # 10 minutes
                attendance_status = 'LATE'
            
        attendance, created = Attendance.objects.update_or_create(
            session=session,
            student_id=student_id,
            defaults={'status': attendance_status}
        )
        
        return Response(AttendanceSerializer(attendance).data, status=status.HTTP_201_CREATED)

class TeacherQuizRemarkViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TeacherQuizRemarkSerializer

    def get_queryset(self):
        user = self.request.user
        quiz_id = self.request.query_params.get('quiz_id')
        subject_id = self.request.query_params.get('subject_id')
        base_query = TeacherQuizRemark.objects.filter(
            quiz__sub_assign__subject__organization=user.organization
        ).select_related('teacher__user', 'student__user', 'quiz')

        if quiz_id:
            base_query = base_query.filter(quiz_id=quiz_id)
        if subject_id:
            base_query = base_query.filter(quiz__sub_assign__subject_id=subject_id)

        if user.role.role_name == 'Teacher':
            return base_query.filter(teacher=user.teacher_profile).distinct()
        elif user.role.role_name == 'Student':
            return base_query.filter(student=user.student_profile).distinct()

        return base_query.none()

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def bulk_submit(self, request):
        """Bulk submit teacher remarks for students on a specific quiz."""
        quiz_id = request.query_params.get('quiz_id')
        if not quiz_id:
            return Response({"error": "quiz_id query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            quiz = Quiz.objects.get(pk=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)
            
        teacher = request.user.teacher_profile

        serializer = BulkRemarkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        remarks_data = serializer.validated_data['remarks']
        created = []

        with transaction.atomic():
            for item in remarks_data:
                text = item['remark_text'].strip()
                if not text:
                    continue

                student_id = item['student_id']
                if not Student.objects.filter(pk=student_id).exists():
                    continue

                obj, _ = TeacherQuizRemark.objects.update_or_create(
                    quiz=quiz,
                    student_id=student_id,
                    teacher=teacher,
                    defaults={'remark_text': text}
                )
                created.append(obj)

        return Response(
            TeacherQuizRemarkSerializer(created, many=True).data,
            status=status.HTTP_201_CREATED
        )

class QuizAttemptViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = QuizAttemptSerializer

    def get_queryset(self):
        user = self.request.user
        base_query = QuizAttempt.objects.filter(quiz__sub_assign__subject__organization=user.organization)

        if user.role.role_name == 'Teacher':
            return base_query.filter(quiz__created_by=user.teacher_profile).distinct()
        elif user.role.role_name == 'Student':
            return base_query.filter(student=user.student_profile).distinct()
            
        return base_query.none()

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def start_quiz(self, request):
        quiz_id = request.data.get('quiz')
        if not quiz_id:
            return Response({"error": "quiz ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            quiz = Quiz.objects.get(pk=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)
            
        student = request.user.student_profile
        
        if not quiz.is_available:
            return Response({"error": "This quiz is not currently available."}, status=status.HTTP_400_BAD_REQUEST)
        
        attempt, created = QuizAttempt.objects.get_or_create(
            quiz=quiz,
            student=student,
            defaults={'status': 'in-progress'}
        )
        
        if attempt.status != 'in-progress':
            return Response({"error": "You have already completed this quiz."}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(QuizAttemptSerializer(attempt, context={'request': request}).data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def submit_answer(self, request):
        quiz_id = request.data.get('quiz')
        student = request.user.student_profile
        
        try:
            attempt = QuizAttempt.objects.get(quiz_id=quiz_id, student=student, status='in-progress')
        except QuizAttempt.DoesNotExist:
            return Response({"error": "No active attempt found."}, status=status.HTTP_404_NOT_FOUND)
            
        question_id = request.data.get('question')
        selected_choice_id = request.data.get('selected_choice')
        time_taken = request.data.get('time_taken_seconds', 0)
        
        # Save or update response
        response, created = StudentResponse.objects.update_or_create(
            attempt=attempt,
            question_id=question_id,
            defaults={
                'selected_choice_id': selected_choice_id,
                'time_taken_seconds': time_taken
            }
        )
        
        return Response(StudentResponseSerializer(response).data)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def finish_quiz(self, request):
        quiz_id = request.data.get('quiz')
        student = request.user.student_profile
        
        try:
            attempt = QuizAttempt.objects.get(quiz_id=quiz_id, student=student, status='in-progress')
        except QuizAttempt.DoesNotExist:
            return Response({"error": "No active attempt found."}, status=status.HTTP_404_NOT_FOUND)
            
        with transaction.atomic():
            attempt.status = 'completed' if not request.data.get('auto_submitted') else 'auto-submitted'
            attempt.completed_at = timezone.now()
            
            # Final scoring
            score = 0
            responses = attempt.responses.all()
            for resp in responses:
                if resp.selected_choice and resp.selected_choice.is_correct:
                    score += resp.question.points_override
            
            attempt.total_score = score
            attempt.save()
            
        return Response(QuizAttemptSerializer(attempt, context={'request': request}).data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def quiz_results(self, request):
        """Returns all attempts for a quiz (teacher evaluation dashboard)."""
        quiz_id = request.query_params.get('quiz_id')
        if not quiz_id:
            return Response({"error": "quiz_id query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        attempts = QuizAttempt.objects.filter(quiz_id=quiz_id).select_related('student__user')
        return Response(QuizAttemptSerializer(attempts, many=True, context={'request': request}).data)
