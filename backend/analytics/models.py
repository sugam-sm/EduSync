from django.db import models
from users.models import Teacher, Student
from organizations.models import Grade, Subject
from learning.models import Quiz, Question, Choice

class Session(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='sessions')
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, related_name='sessions')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='sessions')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.subject.name} - {self.grade} ({self.start_time.strftime('%Y-%m-%d %H:%M')})"

class Attendance(models.Model):
    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('LATE', 'Late'),
        ('ABSENT', 'Absent'),
    ]
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='attendances')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendances')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    marked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('session', 'student')

    def __str__(self):
        return f"{self.student.user.full_name} - {self.status}"

class TeacherQuizRemark(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='teacher_remarks')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='quiz_remarks_received')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='quiz_remarks_given')
    remark_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('quiz', 'student', 'teacher')
        ordering = ['-created_at']

    def __str__(self):
        return f"Remark: {self.teacher.user.full_name} → {self.student.user.full_name} [{self.quiz.title}]"

class QuizAttempt(models.Model):
    STATUS_CHOICES = [
        ('in-progress', 'In Progress'),
        ('completed', 'Completed'),
        ('auto-submitted', 'Auto Submitted'),
    ]
    
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='quiz_attempts')
    total_score = models.PositiveIntegerField(default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in-progress')

    class Meta:
        unique_together = ('quiz', 'student')
        ordering = ['-started_at']

    def __str__(self):
        return f"Attempt: {self.student.user.full_name} - {self.quiz.title} ({self.status})"

class StudentResponse(models.Model):
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(Choice, on_delete=models.CASCADE, null=True, blank=True)
    time_taken_seconds = models.PositiveIntegerField(default=0, help_text="Tracks engagement/behavioral flags")

    def __str__(self):
        return f"Response: {self.attempt.student.user.username} - Q: {self.question.id}"
