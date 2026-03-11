from rest_framework import serializers
from .models import ResourceFolder, Resource
    
class ResourceSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Resource
        fields = ['id', 'title', 'type', 'folder', 'file', 'url', 'uploaded_at']


class ResourceFolderSerialzer(serializers.ModelSerializer):
    resources = ResourceSerializer(many=True, read_only=True)

    class Meta:
        model = ResourceFolder
        fields = ['id', 'name', 'subject', 'uploaded_by',  'uploaded_at', 'resources']
        read_only_fields = ['id', 'uploaded_by', 'uploaded_at']