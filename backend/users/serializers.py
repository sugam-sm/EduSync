import datetime, string, secrets
from rest_framework import serializers
from .models import User, Teacher, Student, Role

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'role_name']
        read_only_fields = ['id']

class CurrentUserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    org_name = serializers.SerializerMethodField()

    def get_role(self, obj):
        return obj.role.role_name

    def get_org_name(self, obj):
        return obj.organization.name
    
    class Meta:
        model = User
        fields = ['id', 'username', 'role', 'org_name', 'full_name']
        read_only_fields = ['id', 'username']
    
class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = ['contact_number', 'specialization', 'qualification']

class StudentSerializer(serializers.ModelSerializer):
    name = serializers.ReadOnlyField(source='grade.name')
    section = serializers.ReadOnlyField(source='grade.section')
    academic_year = serializers.ReadOnlyField(source='grade.academic_year')

    class Meta:
        model = Student
        fields = ['grade', 'name', 'section', 'academic_year', 'guardian_name', 'guardian_relation', 'guardian_contact']
        extra_kwargs = {
            'grade': {'required': False}
        }

class UserListSerializer(serializers.ModelSerializer):
    fullname = serializers.ReadOnlyField(source='full_name')
    role_name = serializers.ReadOnlyField(source='role.role_name')
    student_profile = StudentSerializer(read_only=True)
    teacher_profile = TeacherSerializer(read_only=True)

    grade_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'fullname', 'email', 'is_active', 'role_name', 'gender', 'teacher_profile', 'student_profile', 'grade_id' ]
    
    def get_grade_id(self, obj):
        if hasattr(obj, 'student_profile') and obj.student_profile:
            return obj.student_profile.grade_id
        return None

class UserDetailSerializer(serializers.ModelSerializer):
    student_profile = StudentSerializer(read_only=True)
    teacher_profile = TeacherSerializer(read_only=True)
    role_name = serializers.ReadOnlyField(source='role.role_name')
    fullname = serializers.ReadOnlyField(source='full_name')

    class Meta:
        model = User
        fields = '__all__'

class UserCreationSerializer(serializers.ModelSerializer):
    teacher_profile = TeacherSerializer(required=False)
    student_profile = StudentSerializer(required=False)
    generated_password = serializers.CharField(source='plain_password', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'middle_name', 'last_name', 'email', 'role', 'gender', 'teacher_profile', 'student_profile', 'generated_password'
        ]
        read_only_fields = ['id', 'username']

    def validate(self, attrs):
        email = attrs.get('email')
        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "This email is already in use."})

        teacher_data = attrs.get('teacher_profile')
        if teacher_data and 'contact_number' in teacher_data:
            if Teacher.objects.filter(contact_number=teacher_data['contact_number']).exists():
                raise serializers.ValidationError({"teacher_profile": {"contact_number": "This contact number is already in use."}})
        
        return attrs

    def create(self, validated_data):
        teacher_data = validated_data.pop('teacher_profile', None)
        student_data = validated_data.pop('student_profile', None)

        alphabet = string.ascii_letters + string.digits
        generated_password = ''.join(secrets.choice(alphabet) for i in range(8))

        admin_user = self.context['request'].user
        org = admin_user.organization
        role_prefix = "T" if teacher_data else "S"
        year_short = datetime.datetime.now().strftime('%y')
        
        prefix = f"{role_prefix}{org.id}{year_short}"
        last_user = User.objects.filter(
            username__startswith=prefix
        ).order_by('-username').first()

        if last_user:
            try:
                last_number = int(last_user.username[-4:])
                new_number = last_number + 1
            except (ValueError, IndexError):
                new_number = 1
        else:
            new_number = 1

        generated_username = f"{prefix}{new_number:04d}"

        while User.objects.filter(username=generated_username).exists():
            new_number += 1
            generated_username = f"{prefix}{new_number:04d}"

        user = User.objects.create_user(
            username=generated_username,
            password=generated_password,
            organization=org,
            **validated_data
        )

        user.plain_password = generated_password

        if teacher_data:
            Teacher.objects.create(user=user, **teacher_data)
        elif student_data:
            Student.objects.create(user=user, **student_data)
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    teacher_profile = TeacherSerializer(required=False)
    student_profile = StudentSerializer(required=False)

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'first_name', 'middle_name', 'last_name', 'email', 'gender', 'is_active', 'teacher_profile', 'student_profile']
        read_only_fields = ['id', 'username']
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def validate(self, attrs):
        email = attrs.get('email')
        if email and User.objects.exclude(pk=self.instance.pk).filter(email=email).exists():
            raise serializers.ValidationError({"email": "This email is already in use."})

        teacher_data = attrs.get('teacher_profile')
        if teacher_data and 'contact_number' in teacher_data:
            contact = teacher_data['contact_number']
            if Teacher.objects.exclude(user=self.instance).filter(contact_number=contact).exists():
                raise serializers.ValidationError({"teacher_profile": {"contact_number": "This contact number is already in use."}})
        
        return attrs
    
    def update(self, instance, validated_data):
        teacher_data = validated_data.pop('teacher_profile', None)
        student_data = validated_data.pop('student_profile', None)
        password = validated_data.pop('password', None)

        if password:
            instance.set_password(password)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if teacher_data:
            teacher_instance, _ = Teacher.objects.get_or_create(user=instance)
            for attr, value in teacher_data.items():
                setattr(teacher_instance, attr, value)
            teacher_instance.save()
        
        if student_data:
            student_instance, _ = Student.objects.get_or_create(user=instance)
            for attr, value in student_data.items():
                setattr(student_instance, attr, value)
            student_instance.save()

        return instance