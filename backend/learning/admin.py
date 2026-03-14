from django.contrib import admin
from .models import ResourceFolder, Resource

admin.site.register(Resource)
admin.site.register(ResourceFolder)
