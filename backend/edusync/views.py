from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer
from users.serializers import CurrentUserSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

class MyTokenObtainPairView(TokenObtainPairView):
    # This tells Django to use your custom serializer with the user info
    serializer_class = MyTokenObtainPairSerializer

class VerifyUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = CurrentUserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)