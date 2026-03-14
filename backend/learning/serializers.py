from rest_framework import serializers
from .models import ResourceFolder, Resource
from organizations.models import AssignSubject

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
            sub_assign = AssignSubject.objects.filter(
                teacher__user=user,
                grade_id=grade_id
            ).first()

            if not sub_assign:
                raise serializers.ValidationError({"grade_id": "You are not assigned to this grade."})
            
            data['sub_assign'] = sub_assign
        
        return data

    def create(self, validated_data):
        # Enforce grade_id requirement during creation
        if 'grade_id' not in validated_data:
            raise serializers.ValidationError({"grade_id": "This field is required for creation."})
            
        validated_data['uploaded_by'] = self.context['request'].user.teacher_profile
        validated_data.pop('grade_id', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('grade_id', None)
        return super().update(instance, validated_data)