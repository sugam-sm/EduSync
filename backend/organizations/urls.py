from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrganizationDetailView, OrganizationListView, GradeViewSet, SubjectViewSet, AssignSubjectViewSet, OrganizationSuperAdminManageView

router = DefaultRouter()
router.register(r'grades', GradeViewSet, basename='grade')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'assignments', AssignSubjectViewSet, basename='assignment')


urlpatterns = [
    path('me/', OrganizationDetailView.as_view(), name='organization-detail'),
    path('list/', OrganizationListView.as_view(), name='organization-list'),
    path('list/<int:pk>/', OrganizationSuperAdminManageView.as_view(), name='organization-superadmin-manage'),
    path('', include(router.urls)),
]