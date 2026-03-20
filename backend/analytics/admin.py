from django.contrib import admin
from .models import Session, Attendance, TeacherQuizRemark, QuizAttempt, StudentResponse

admin.site.register(Session)
admin.site.register(Attendance)
admin.site.register(TeacherQuizRemark)
admin.site.register(QuizAttempt)
admin.site.register(StudentResponse)
