from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from users.serializers import CurrentUserSerializer
from rest_framework import serializers
from django.contrib.auth import get_user_model


User = get_user_model()

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        try:
            data = super().validate(attrs)
        except Exception:
            raise serializers.ValidationError(
                {"detail": "Invalid Credentials. Verify your credentials and try again."}
            )
        
        user = self.user

        if not user.is_active:
            raise serializers.ValidationError(
                {"detail": "Your account is disabled. Please contact your admin."}
            )
        
        # Adding custom data to the JSON response
        data['user'] = CurrentUserSerializer(user).data

        return data

