from django.db import models
from users.models import Teacher

class Organization(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    logo = models.ImageField(upload_to='organization_logos/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.id} {self.name}"

class Grade(models.Model):
    name = models.CharField(max_length=50)
    section = models.CharField(max_length=10)
    academic_year = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)
    organization = models.ForeignKey('Organization', on_delete=models.CASCADE)
    class_teacher = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        unique_together = ('name', 'section', 'academic_year', 'organization')

    def __str__(self):
        return f"{self.id} {self.name} {self.section} ({self.academic_year})"

class Subject(models.Model):
    name = models.CharField(max_length=100)
    organization = models.ForeignKey('Organization', on_delete=models.CASCADE)

    class Meta:
        unique_together = ('name', 'organization')

    def __str__(self):
        return f"{self.id} {self.name} ({self.organization.name})"
    
class AssignSubject(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE)
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'organizations_assignsubject'
        unique_together = ('subject', 'grade')

    def __str__(self):
        return f"{self.id} {self.subject.name} {self.grade} - {self.teacher.user.full_name if self.teacher else 'No Teacher'}"