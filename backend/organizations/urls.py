from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrganizationDetailView, GradeViewSet, SubjectViewSet, AssignSubjectViewSet

router = DefaultRouter()
router.register(r'grades', GradeViewSet, basename='grade')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'assignments', AssignSubjectViewSet, basename='assignment')


urlpatterns = [
    path('me/', OrganizationDetailView.as_view(), name='manage-organization'),
    path('', include(router.urls)),
]