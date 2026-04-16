from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, StudentViewSet, ProfileView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='manage-users')
router.register(r'students', StudentViewSet, basename='students')

urlpatterns = [
    path('profile/', ProfileView.as_view(), name='user-profile'),
    path('', include(router.urls)),
]