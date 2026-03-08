from django.db import models
from django.contrib.auth.models import AbstractUser

class Role(models.Model):
    role_name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.role_name

class User(AbstractUser):
    organization = models.ForeignKey(
        'organizations.Organization', 
        on_delete=models.CASCADE, 
        null=True, blank=False,
        related_name='organization_users'
    )
    role = models.ForeignKey(
        Role, 
        on_delete=models.PROTECT, 
        null=False, blank=False,
        related_name='role_users'
    )
    middle_name = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField(unique=False, null=True, blank=True)
    
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True, blank=True)

    @property
    def full_name(self):
        names = [self.first_name, self.middle_name, self.last_name]
        return " ".join([name for name in names if name])

    def __str__(self):
        return f"{self.username} ({self.full_name if self.full_name else 'super admin'}) ({self.role.role_name if self.role else 'No Role'})"

class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name='teacher_profile')
    contact_number = models.CharField(max_length=15, null=False, blank=False)
    specialization = models.CharField(max_length=255, null=False, blank=False)
    qualification = models.CharField(max_length=255, null=False, blank=False)

    def __str__(self):
        return f"{self.user.full_name} ({self.user.organization})"

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name='student_profile')
    grade = models.ForeignKey('organizations.Grade', on_delete=models.PROTECT)
    guardian_name = models.CharField(max_length=255, null=False, blank=False)
    guardian_relation = models.CharField(max_length=50, null=False, blank=False)
    guardian_contact = models.CharField(max_length=15, null=False, blank=False)
    
    @property
    def grade_name(self):
        return self.grade.name
    
    @property
    def section(self):
        return self.grade.section
    
    @property
    def academic_year(self):
        return self.grade.academic_year