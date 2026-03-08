from django.contrib import admin
from .models import Organization, Grade, Subject, AssignSubject

# Registering organization model
admin.site.register(Organization)
# Registering class model
admin.site.register(Grade)
# Registering subject model
admin.site.register(Subject)
# Registering subject assignment model
admin.site.register(AssignSubject)
