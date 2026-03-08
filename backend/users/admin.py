from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Teacher, Student, Role

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('role_name',)

class TeacherInline(admin.StackedInline):
    model = Teacher
    can_delete = False
    extra = 0
    show_change_link = True

class StudentInline(admin.StackedInline):
    model = Student
    can_delete = False
    extra = 0
    show_change_link = True

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {
            'fields': (
                'first_name',
                'middle_name',
                'last_name',
                'email',
                'gender'
            )
        }),
        ('Organization Info', {
            'fields': (
                'organization',
                'role'
            )
        }),
        ('Permissions', {
            'fields': (
                'is_active',
                'is_staff',
                'is_superuser',
                'groups',
                'user_permissions'
            )
        }),
        ('Important dates', {
            'fields': (
                'last_login',
                'date_joined'
            )
        }),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Custom Fields', {
            'fields': (
                'first_name',
                'middle_name',
                'last_name',
                'email',
                'gender',
                'organization',
                'role',
                'is_staff',
                'is_superuser',
            ),
        }),
    )

    list_display = (
        'username',
        'full_name',
        'email',
        'role',
        'organization',
        'is_staff',
        'is_active'
    )

    list_filter = (
        'role',
        'gender',
        'is_staff',
        'is_active'
    )

    search_fields = (
        'username',
        'email',
        'first_name',
        'last_name'
    )

    inlines = [TeacherInline, StudentInline]

@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'contact_number',
        'specialization',
        'qualification'
    )
    search_fields = (
        'user__username',
        'user__first_name',
        'user__last_name',
        'specialization'
    )
    list_select_related = ('user',)

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'grade',
        'guardian_name',
        'guardian_contact'
    )
    search_fields = (
        'user__username',
        'user__first_name',
        'user__last_name',
        'guardian_name'
    )
    list_select_related = ('user', 'grade')