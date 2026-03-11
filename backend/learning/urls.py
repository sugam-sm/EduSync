from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ResourceFolderViewSet, ResourceViewSet

router = DefaultRouter()
router.register(r'resources', ResourceViewSet, basename='resource')
router.register(r'resourcefolders', ResourceFolderViewSet, basename='resourcefolder')

urlpatterns = [
    path('', include(router.urls)),
]