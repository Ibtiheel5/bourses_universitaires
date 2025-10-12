from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 
                 'user_type', 'phone_number', 'date_of_birth', 'is_active')
        read_only_fields = ('id', 'is_active')

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6, style={'input_type': 'password'})
    email = serializers.EmailField(required=True)
    
    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 
                 'phone_number', 'date_of_birth')
    
    def create(self, validated_data):
        # Forcer le type utilisateur à 'student' pour les nouvelles inscriptions
        validated_data['user_type'] = 'student'
        user = CustomUser.objects.create_user(**validated_data)
        return user

    def validate_username(self, value):
        if CustomUser.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà utilisé.")
        return value

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value