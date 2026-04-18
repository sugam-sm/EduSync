from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum, Count
from collections import defaultdict
import datetime

from .models import Session, Attendance, TeacherQuizRemark, QuizAttempt, StudentResponse
from .serializers import (
    SessionSerializer, AttendanceSerializer, TeacherQuizRemarkSerializer, 
    QuizAttemptSerializer, StudentResponseSerializer, BulkRemarkSerializer
)
from users.models import Student
from learning.models import Quiz
from organizations.models import Subject, AssignSubject

class SessionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SessionSerializer

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'role') and user.role.role_name == 'teacher':
            queryset = Session.objects.filter(teacher__user=user)
        elif hasattr(user, 'role') and user.role.role_name == 'student':
            queryset = Session.objects.filter(grade=user.student_profile.grade)
        else:
            return Session.objects.none()
        
        grade = self.request.query_params.get('grade')
        if grade:
            queryset = queryset.filter(grade=grade)
            
        subject = self.request.query_params.get('subject')
        if subject and subject != 'All':
            queryset = queryset.filter(subject=subject)

        return queryset

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
            if student.pk not in marked_student_ids:
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
        user = self.request.user
        if hasattr(user, 'role') and user.role.role_name == 'teacher':
            queryset = Attendance.objects.filter(session__teacher__user=user)
            grade = self.request.query_params.get('grade')
            if grade:
                queryset = queryset.filter(session__grade=grade)
            subject = self.request.query_params.get('subject')
            if subject and subject != 'All':
                queryset = queryset.filter(session__subject=subject)
            return queryset
        elif hasattr(user, 'role') and user.role.role_name == 'student':
            return Attendance.objects.filter(student=user.student_profile)
        return Attendance.objects.none()

class TeacherQuizRemarkViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TeacherQuizRemarkSerializer

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'teacher_profile'):
            queryset = TeacherQuizRemark.objects.filter(teacher=user.teacher_profile)
            grade = self.request.query_params.get('grade')
            if grade:
                queryset = queryset.filter(student__grade=grade)
            subject = self.request.query_params.get('subject')
            if subject and subject != 'All':
                queryset = queryset.filter(quiz__sub_assign__subject=subject)
                
            quiz_id = self.request.query_params.get('quiz_id')
            if quiz_id:
                queryset = queryset.filter(quiz_id=quiz_id)
                
            return queryset
        elif hasattr(user, 'student_profile'):
            return TeacherQuizRemark.objects.filter(student=user.student_profile)
        return TeacherQuizRemark.objects.none()

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user.teacher_profile)

    @action(detail=False, methods=['post'])
    def bulk_submit(self, request):
        quiz_id = request.query_params.get('quiz_id')
        if not quiz_id:
            return Response({"error": "quiz_id is required parameters"}, status=status.HTTP_400_BAD_REQUEST)
            
        serializer = BulkRemarkSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        teacher = request.user.teacher_profile
        remarks_data = serializer.validated_data['remarks']
        
        saved_remarks = []
        with transaction.atomic():
            for item in remarks_data:
                remark, created = TeacherQuizRemark.objects.update_or_create(
                    quiz_id=quiz_id,
                    student_id=item['student_id'],
                    defaults={
                        'teacher': teacher,
                        'remark_text': item['remark_text']
                    }
                )
                saved_remarks.append(remark)
                
        return Response(TeacherQuizRemarkSerializer(saved_remarks, many=True).data)

class QuizAttemptViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = QuizAttemptSerializer

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'student_profile'):
            return QuizAttempt.objects.filter(student=user.student_profile)
        return QuizAttempt.objects.all()

    @action(detail=False, methods=['post'])
    def start_quiz(self, request):
        quiz_id = request.data.get('quiz')
        student = request.user.student_profile
        
        try:
            quiz = Quiz.objects.get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"error": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)
            
        attempt, created = QuizAttempt.objects.get_or_create(
            quiz=quiz,
            student=student,
            defaults={'status': 'in-progress'}
        )
        
        if not created and attempt.status != 'in-progress':
            return Response({"error": "You have already completed this quiz."}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(QuizAttemptSerializer(attempt).data)

    @action(detail=False, methods=['post'])
    def submit_answer(self, request):
        quiz_id = request.data.get('quiz')
        question_id = request.data.get('question')
        choice_id = request.data.get('selected_choice')
        time_taken = request.data.get('time_taken_seconds', 0)
        
        student = request.user.student_profile
        
        try:
            attempt = QuizAttempt.objects.get(quiz_id=quiz_id, student=student, status='in-progress')
        except QuizAttempt.DoesNotExist:
            return Response({"error": "Active quiz attempt not found."}, status=status.HTTP_404_NOT_FOUND)
            
        response, created = StudentResponse.objects.update_or_create(
            attempt=attempt,
            question_id=question_id,
            defaults={
                'selected_choice_id': choice_id,
                'time_taken_seconds': time_taken
            }
        )
        
        return Response(StudentResponseSerializer(response).data)

    @action(detail=False, methods=['post'])
    def finish_quiz(self, request):
        quiz_id = request.data.get('quiz')
        auto_submitted = request.data.get('auto_submitted', False)
        student = request.user.student_profile
        
        try:
            attempt = QuizAttempt.objects.get(quiz_id=quiz_id, student=student, status='in-progress')
        except QuizAttempt.DoesNotExist:
            return Response({"error": "Active quiz attempt not found."}, status=status.HTTP_404_NOT_FOUND)
            
        # Calculate score
        score = 0
        responses = attempt.responses.select_related('question', 'selected_choice')
        for resp in responses:
            if resp.selected_choice and resp.selected_choice.is_correct:
                score += resp.question.points_override
                
        attempt.total_score = score
        attempt.status = 'auto-submitted' if auto_submitted else 'completed'
        attempt.completed_at = timezone.now()
        attempt.save()
        
        return Response(QuizAttemptSerializer(attempt).data)

    @action(detail=False, methods=['get'])
    def quiz_results(self, request):
        quiz_id = request.query_params.get('quiz_id')
        if not quiz_id:
            return Response({"error": "quiz_id is required parameters"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        if not hasattr(user, 'teacher_profile') and getattr(user.role, 'role_name', '') != 'admin':
            return Response({"error": "Only teachers and admins can view quiz results."}, status=status.HTTP_403_FORBIDDEN)
            
        attempts = QuizAttempt.objects.filter(quiz_id=quiz_id).select_related('student__user', 'quiz')
        
        # Ensure teachers can only see results for quizzes they created
        if hasattr(user, 'teacher_profile') and getattr(user.role, 'role_name', '') != 'admin':
            attempts = attempts.filter(quiz__created_by=user.teacher_profile)
            
        serializer = self.get_serializer(attempts, many=True)
        return Response(serializer.data)

class StudentResponseViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = StudentResponseSerializer

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'student_profile'):
            return StudentResponse.objects.filter(attempt__student=user.student_profile)
        return StudentResponse.objects.all()

class AnalyticsDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    ATTENDANCE_SCORE = {'PRESENT': 100, 'LATE': 70, 'ABSENT': 0}

    def get(self, request):
        user = request.user
        role = user.role.role_name
        subject = request.query_params.get('subject')

        if role == 'student':
            return self._student_dashboard(user.student_profile, subject, user)

        if role in ('teacher', 'admin'):
            student_id = request.query_params.get('student_id')
            grade = request.query_params.get('grade')

            if student_id and student_id != 'All':
                try:
                    student = Student.objects.select_related('user', 'grade').get(pk=student_id)
                except Student.DoesNotExist:
                    return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)
                return self._student_dashboard(student, subject, user)

            if grade:
                from organizations.models import Grade
                try:
                    grade = Grade.objects.get(pk=grade)
                except Grade.DoesNotExist:
                    return Response({"error": "Grade not found."}, status=status.HTTP_404_NOT_FOUND)
                return self._grade_overview(request, grade, subject)

            return Response(
                {"error": "Provide grade for class overview or student_id for student drill-down."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({"error": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)

    def _student_dashboard(self, student, subject, requesting_user):
        subjects = list(Subject.objects.filter(
            assignsubject__grade=student.grade
        ).distinct().values('id', 'name'))

        assigned_subjects = None
        has_subject_filter = subject and subject != 'All'
        
        if not has_subject_filter and hasattr(requesting_user, 'teacher_profile'):
            assigned_subjects = list(AssignSubject.objects.filter(
                teacher=requesting_user.teacher_profile, 
                grade=student.grade
            ).values_list('subject', flat=True))

        class_avg = self._get_class_averages(student.grade, subject)
        quiz_data = self._get_quiz_data(student, subject, assigned_subjects, grade=student.grade)
        attendance_data = self._get_attendance_data(student, subject, assigned_subjects)
        sentiment_data = self._get_sentiment_data(student, subject, assigned_subjects)
        
        remarked_quiz_ids = {s["quiz_id"] for s in sentiment_data}
        quiz_data = [q for q in quiz_data if q["quiz_id"] in remarked_quiz_ids]

        overall_data = self._compute_edusync_index(student, quiz_data, attendance_data, sentiment_data, class_avg.get("avg_edusync_index", 0))

        # Compute student's own summary stats
        avg_quiz = sum(q['percentage'] for q in quiz_data) / len(quiz_data) if quiz_data else 0
        pos_pct = round(len([s for s in sentiment_data if s["sentiment_label"] == "Positive"]) / len(sentiment_data) * 100, 1) if sentiment_data else 0

        return Response({
            "view": "student",
            "student_name": student.user.full_name,
            "student_id": student.pk,
            "grade_name": f"{student.grade.name} {student.grade.section}",
            "subjects": subjects,
            "active_subject": int(subject) if (subject and str(subject).isdigit()) else None,
            "overall_performance": overall_data,
            "quiz_scores": quiz_data,
            "attendance": attendance_data,
            "attendance_summary": {
                "attendance_rate": attendance_data.get("attendance_rate", 0),
            },
            "student_stats": {
                "current_index": overall_data[-1]["index"] if overall_data else 0,
                "avg_quiz_percentage": round(avg_quiz, 1),
                "attendance_rate": attendance_data.get("attendance_rate", 0),
                "positive_pct": pos_pct,
            },
            "sentiment": sentiment_data,
            "sentiment_summary": {
                "positive_pct": pos_pct,
            },
            "class_averages": class_avg,
        })

    def _grade_overview(self, request, grade, subject):
        user = request.user
        students = Student.objects.filter(grade=grade).select_related('user')
        subjects = Subject.objects.filter(assignsubject__grade=grade).distinct().values('id', 'name')

        quiz_summary = self._get_quiz_summary(grade, subject, user)
        attendance_summary = self._get_attendance_summary(grade, subject)
        sentiment_summary = self._get_sentiment_summary(grade, subject)
        resource_stats = self._get_resource_stats(grade, subject)
        class_avg = self._get_class_averages(grade, subject)
        student_rankings = self._get_student_rankings(grade, subject)

        return Response({
            "view": "grade",
            "grade_name": f"{grade.name} {grade.section}",
            "grade": grade.pk,
            "total_students": students.count(),
            "subjects": list(subjects),
            "quiz_summary": quiz_summary,
            "attendance_summary": attendance_summary,
            "sentiment_summary": sentiment_summary,
            "resource_stats": resource_stats,
            "class_averages": class_avg,
            "student_rankings": student_rankings,
        })

    def _get_quiz_summary(self, grade, subject, user):
        quiz_qs = Quiz.objects.filter(sub_assign__grade=grade)
        if subject:
            quiz_qs = quiz_qs.filter(sub_assign__subject=subject)
        
        if hasattr(user, 'teacher_profile'):
            quiz_qs = quiz_qs.filter(created_by=user.teacher_profile)

        quizzes = []
        for quiz in quiz_qs.select_related('sub_assign__subject'):
            stats = self._get_class_quiz_stats(quiz)
            quizzes.append({
                "quiz_id": quiz.id,
                "quiz_title": quiz.title,
                "subject": quiz.sub_assign.subject.name,
                **stats
            })

        avg_pct = sum(q["avg_percentage"] for q in quizzes) / len(quizzes) if quizzes else 0
        return {
            "total_quizzes": len(quizzes),
            "avg_accuracy": round(avg_pct, 1),
            "quizzes": quizzes
        }

    def _get_student_cumulative_attendance(self, student, up_to_date):
        """Calculates cumulative attendance score (0-100) for a student up to a specific date."""
        att_qs = Attendance.objects.filter(
            student=student, 
            session__start_time__lte=up_to_date, 
            session__is_active=False
        )
        if not att_qs.exists():
            return 100 # Default to perfect if no sessions occurred
        
        counts = att_qs.values('status').annotate(count=Count('id'))
        donut = {item['status']: item['count'] for item in counts}
        p = donut.get('PRESENT', 0)
        l = donut.get('LATE', 0)
        total = att_qs.count()
        return ((p + l * 0.7) / total) * 100

    def _get_class_quiz_stats(self, quiz):
        # 1. Fetch all attempts and remarks for this quiz
        attempts = QuizAttempt.objects.filter(quiz=quiz, status__in=['completed', 'auto-submitted', 'missed'])
        remarks = TeacherQuizRemark.objects.filter(quiz=quiz)
        
        if not attempts.exists():
            return {"avg_percentage": 0, "avg_score": 0, "highest_score": 0, "completed_count": 0, "missed_count": 0, "avg_index": 0}
        
        # Mapping attempts and remarks by student for easy lookup
        attempt_map = {a.student_id: a for a in attempts if a.status != 'missed'}
        remark_map = {r.student_id: r for r in remarks}
        
        # 2. Calculate average of individual student indices (Discrete Point Logic)
        student_indices = []
        max_possible = quiz.questions.aggregate(total=Sum('points_override'))['total'] or 1
        
        shared_students = set(attempt_map.keys()) & set(remark_map.keys())
        for sid in shared_students:
            a = attempt_map[sid]
            r = remark_map[sid]
            
            # Purely discrete components
            score_pct = (a.total_score / max_possible) * 100
            att_score = self._get_student_cumulative_attendance(a.student, a.completed_at or a.started_at)
            _, sent_score = self._classify_sentiment(r.remark_text)
            
            # Combine into Index for this specific student/quiz event
            idx = self._calculate_weighted_index(score_pct, att_score, sent_score)
            student_indices.append(idx)
            
        avg_index = sum(student_indices) / len(student_indices) if student_indices else 0
        
        # Standard quiz stats for other views
        scores = [a.total_score for a in attempts if a.status != 'missed']
        avg_score_pct = (sum(scores) / len(scores) / max_possible * 100) if scores else 0

        return {
            "avg_percentage": round(avg_score_pct, 1),
            "avg_score": round(sum(scores) / len(scores), 1) if scores else 0,
            "highest_score": max(scores) if scores else 0,
            "completed_count": attempts.filter(status__in=['completed', 'auto-submitted']).count(),
            "missed_count": attempts.filter(status='missed').count(),
            "total_attempts": attempts.count(),
            "avg_index": round(avg_index, 1)
        }

    def _get_attendance_summary(self, grade, subject):
        sessions = Session.objects.filter(grade=grade, is_active=False)
        if subject:
            sessions = sessions.filter(subject=subject)
        
        total_sessions = sessions.count()
        if total_sessions == 0:
            return {"attendance_rate": 0, "total_sessions": 0}
        
        attendances = Attendance.objects.filter(session__in=sessions)
        counts = attendances.values('status').annotate(count=Count('id'))
        donut = {item['status']: item['count'] for item in counts}
        
        present = donut.get('PRESENT', 0)
        late = donut.get('LATE', 0)
        total_att = attendances.count()
        
        rate = ((present + late * 0.7) / total_att) * 100 if total_att > 0 else 0
        return {
            "attendance_rate": round(rate, 1),
            "total_sessions": total_sessions,
            "donut": donut
        }

    def _get_sentiment_summary(self, grade, subject):
        remarks = TeacherQuizRemark.objects.filter(student__grade=grade)
        if subject:
            remarks = remarks.filter(quiz__sub_assign__subject=subject)
        
        total = remarks.count()
        if total == 0:
            return {"positive_pct": 0, "total_remarks": 0, "positive": 0, "neutral": 0, "negative": 0}
        
        pos, neu, neg = 0, 0, 0
        for r in remarks:
            label, _ = self._classify_sentiment(r.remark_text)
            if label == "Positive": pos += 1
            elif label == "Negative": neg += 1
            else: neu += 1
            
        return {
            "positive_pct": round((pos/total)*100, 1),
            "total_remarks": total,
            "positive": pos,
            "neutral": neu,
            "negative": neg
        }

    def _get_resource_stats(self, grade, subject):
        from learning.models import Resource, FlashcardDeck, Flashcard
        res_qs = Resource.objects.filter(folder__sub_assign__grade=grade)
        deck_qs = FlashcardDeck.objects.filter(sub_assign__grade=grade)
        if subject:
            res_qs = res_qs.filter(folder__sub_assign__subject=subject)
            deck_qs = deck_qs.filter(sub_assign__subject=subject)
            
        return {
            "total_resources": res_qs.count(),
            "total_flashcards": Flashcard.objects.filter(deck__in=deck_qs).count(),
        }

    def _calculate_weighted_index(self, quiz_score, attendance_score, sentiment_score=None):
        """Unified weighted logic for Student Index and Class Averages."""
        if sentiment_score is not None:
            return (0.5 * quiz_score) + (0.4 * attendance_score) + (0.1 * sentiment_score)
        # 55/45 split if no sentiment exists
        return (0.55 * quiz_score) + (0.45 * attendance_score)

    def _get_class_averages(self, grade, subject):
        quiz_summary = self._get_quiz_summary(grade, subject, None)
        att_summary = self._get_attendance_summary(grade, subject)
        sent_summary = self._get_sentiment_summary(grade, subject)
        
        # Use unified logic even for class averages
        avg_sent = sent_summary["positive_pct"] if sent_summary["total_remarks"] > 0 else None
        avg_index = self._calculate_weighted_index(
            quiz_summary["avg_accuracy"], 
            att_summary["attendance_rate"], 
            avg_sent
        )

        return {
            "avg_quiz_percentage": quiz_summary["avg_accuracy"],
            "avg_attendance_score": att_summary["attendance_rate"],
            "avg_edusync_index": round(avg_index, 1)
        }

    def _get_student_rankings(self, grade, subject):
        students = Student.objects.filter(grade=grade).select_related('user')
        student_ids = [s.pk for s in students]

        # Batch quiz data
        attempt_qs = QuizAttempt.objects.filter(
            student_id__in=student_ids,
            status__in=['completed', 'auto-submitted', 'missed']
        )
        if subject:
            attempt_qs = attempt_qs.filter(quiz__sub_assign__subject=subject)

        attempts_list = list(attempt_qs)
        quiz_ids = set(a.quiz_id for a in attempts_list)
        quiz_max_qs = Quiz.objects.filter(id__in=quiz_ids).annotate(
            max_score=Sum('questions__points_override')
        ).values_list('id', 'max_score')
        quiz_max = {qid: (ms or 1) for qid, ms in quiz_max_qs}

        student_quiz_pcts = defaultdict(list)
        for attempt in attempts_list:
            max_score = quiz_max.get(attempt.quiz_id, 1)
            student_quiz_pcts[attempt.student_id].append((attempt.total_score / max_score) * 100)

        # Batch attendance data
        att_qs = Attendance.objects.filter(student_id__in=student_ids, session__is_active=False)
        if subject:
            att_qs = att_qs.filter(session__subject=subject)

        student_att = defaultdict(lambda: {'present': 0, 'late': 0, 'total': 0})
        for att in att_qs:
            student_att[att.student_id]['total'] += 1
            if att.status == 'PRESENT':
                student_att[att.student_id]['present'] += 1
            elif att.status == 'LATE':
                student_att[att.student_id]['late'] += 1

        # Batch sentiment data
        remarks_qs = TeacherQuizRemark.objects.filter(student_id__in=student_ids)
        if subject:
            remarks_qs = remarks_qs.filter(quiz__sub_assign__subject=subject)

        student_sent = defaultdict(lambda: {'positive': 0, 'total': 0})
        for r in remarks_qs:
            label, _ = self._classify_sentiment(r.remark_text)
            student_sent[r.student_id]['total'] += 1
            if label == 'Positive':
                student_sent[r.student_id]['positive'] += 1

        # Compute rankings
        rankings = []
        for student in students:
            sid = student.pk
            quiz_pcts = student_quiz_pcts.get(sid, [])
            avg_quiz = sum(quiz_pcts) / len(quiz_pcts) if quiz_pcts else 0

            att = student_att[sid]
            att_rate = ((att['present'] + att['late'] * 0.7) / att['total']) * 100 if att['total'] > 0 else 0

            sent = student_sent[sid]
            pos_pct = (sent['positive'] / sent['total']) * 100 if sent['total'] > 0 else None

            # Use unified logic for rankings
            index = self._calculate_weighted_index(avg_quiz, att_rate, pos_pct)

            rankings.append({
                'student_id': sid,
                'student_name': student.user.full_name,
                'avg_quiz': round(avg_quiz, 1),
                'edusync_index': round(index, 1),
                'total_quizzes': len(quiz_pcts),
                'total_sessions': att['total'],
            })

        rankings.sort(key=lambda x: x['edusync_index'], reverse=True)
        for i, r in enumerate(rankings):
            r['rank'] = i + 1

        return rankings

    def _get_quiz_data(self, student, subject, teacher_subjects=None, grade=None):
        attempts = QuizAttempt.objects.filter(student=student, status__in=['completed', 'auto-submitted', 'missed'])
        if subject:
            attempts = attempts.filter(quiz__sub_assign__subject=subject)
        elif teacher_subjects:
            attempts = attempts.filter(quiz__sub_assign__subject__in=teacher_subjects)
            
        attempts = attempts.select_related('quiz', 'quiz__sub_assign__subject').prefetch_related('quiz__questions').order_by('-completed_at')

        # Precompute class average percentages per quiz for comparison line
        quiz_class_avgs = {}
        if grade:
            for attempt in attempts:
                if attempt.quiz_id not in quiz_class_avgs:
                    stats = self._get_class_quiz_stats(attempt.quiz)
                    quiz_class_avgs[attempt.quiz_id] = stats
        
        result = []
        seen_quizzes = set()
        for attempt in sorted(attempts, key=lambda x: x.completed_at or x.started_at, reverse=True):
            if attempt.quiz_id in seen_quizzes: continue
            seen_quizzes.add(attempt.quiz_id)
            
            max_score = attempt.quiz.questions.aggregate(total=Sum('points_override'))['total'] or 1
            percentage = (attempt.total_score / max_score) * 100
            
            result.append({
                "date": (attempt.completed_at or attempt.started_at).isoformat(),
                "quiz_title": attempt.quiz.title,
                "quiz_id": attempt.quiz.id,
                "score": attempt.total_score,
                "max_score": max_score,
                "percentage": round(percentage, 1),
                "class_avg_percentage": quiz_class_avgs.get(attempt.quiz_id, {}).get('avg_percentage', 0),
                "class_avg_index": quiz_class_avgs.get(attempt.quiz_id, {}).get('avg_index', 0),
                "status": attempt.status,
                "subject": attempt.quiz.sub_assign.subject.name,
            })
        result.sort(key=lambda x: x["date"])
        return result

    def _get_attendance_data(self, student, subject, teacher_subjects=None):
        attendances = Attendance.objects.filter(student=student, session__is_active=False)
        if subject:
            attendances = attendances.filter(session__subject=subject)
        elif teacher_subjects:
            attendances = attendances.filter(session__subject__in=teacher_subjects)
            
        attendances = attendances.select_related('session', 'session__subject')
        timeline = []
        daily_att = defaultdict(list)
        for att in attendances.order_by('session__start_time'):
            date_key = att.session.start_time.date().isoformat()
            daily_att[date_key].append(att)

        for date_key, att_list in sorted(daily_att.items()):
            avg_score = sum(self.ATTENDANCE_SCORE.get(a.status, 0) for a in att_list) / len(att_list)
            timeline.append({
                "date": date_key,
                "status": att_list[-1].status,
                "score": avg_score,
                "subject": att_list[0].session.subject.name,
            })
            
        total = attendances.count()
        present = attendances.filter(status='PRESENT').count()
        late = attendances.filter(status='LATE').count()
        
        return {
            "donut": {"present": present, "late": late, "absent": total - present - late},
            "attendance_rate": round(((present + late * 0.7) / total) * 100, 1) if total > 0 else 0,
            "timeline": timeline
        }

    def _get_sentiment_data(self, student, subject, teacher_subjects=None):
        remarks = TeacherQuizRemark.objects.filter(student=student)
        
        if subject and subject != 'All':
            remarks = remarks.filter(quiz__sub_assign__subject=subject)
        elif teacher_subjects:
            remarks = remarks.filter(quiz__sub_assign__subject__in=teacher_subjects)
            
        result = []
        seen_quizzes = set()
        for remark in remarks:
            if remark.quiz_id in seen_quizzes:
                continue
            seen_quizzes.add(remark.quiz_id)
            
            label, score = self._classify_sentiment(remark.remark_text)
            result.append({
                "date": remark.created_at.isoformat(),
                "quiz_id": remark.quiz_id,
                "quiz_title": remark.quiz.title,
                "teacher_name": remark.teacher.user.full_name,
                "remark_text": remark.remark_text,
                "sentiment_label": label,
                "sentiment_score": score,
                "subject": remark.quiz.sub_assign.subject.name,
            })
        result.sort(key=lambda x: x["date"])
        return result

    _sentiment_model = None
    def _classify_sentiment(self, text):
        if self._sentiment_model is None:
            import joblib, os
            from django.conf import settings
            model_path = os.path.join(settings.BASE_DIR, 'sentiment_analysis_model.pkl')
            if os.path.exists(model_path):
                AnalyticsDashboardView._sentiment_model = joblib.load(model_path)
            else:
                return "Neutral", 50
        prediction = self._sentiment_model.predict([text])[0]
        score_map = {"Positive": 100, "Negative": 0, "Neutral": 50}
        return prediction, score_map.get(prediction, 50)

    def _compute_edusync_index(self, student_obj, quiz_data, attendance_data, sentiment_data, class_avg_index=0):
        def parse_dt(s):
            dt = datetime.datetime.fromisoformat(str(s).replace('Z', '+00:00'))
            if dt.tzinfo is None: dt = dt.replace(tzinfo=datetime.timezone.utc)
            return dt

        sorted_quizzes = sorted(quiz_data, key=lambda x: parse_dt(x["date"]))
        sorted_att = sorted(attendance_data["timeline"], key=lambda x: parse_dt(x["date"]))
        sorted_sent = sorted(sentiment_data, key=lambda x: parse_dt(x["date"]))

        result = []
        for q in sorted_quizzes:
            target_remark = next((s for s in sorted_sent if s["quiz_id"] == q["quiz_id"]), None)
            
            if not target_remark:
                continue

            q_date = parse_dt(q["date"])
            avg_quiz = q["percentage"]
            
            # Discrete Student Attendance: Cumulative until completion of THIS quiz
            avg_att = self._get_student_cumulative_attendance(student_obj, q_date)
            
            sentiment_val = target_remark["sentiment_score"]
            index = self._calculate_weighted_index(avg_quiz, avg_att, sentiment_val)

            # Discrete Class Avg Comparison: Already pre-calculated as average-of-student-indices
            curr_class_avg = q.get("class_avg_index", class_avg_index)

            result.append({
                "date": q["date"],
                "quiz_title": q["quiz_title"],
                "index": round(index, 1),
                "class_avg_index": curr_class_avg,
            })
        return result
