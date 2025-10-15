# users/serializers.py - Version corrigée
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, EligibilityRule, StudentDocument, AdminNotification, ScholarshipApplication, StudentNotification

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

class EligibilityRuleSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = EligibilityRule
        fields = ('id', 'title', 'description', 'rule_type', 'criteria', 
                 'is_active', 'created_by', 'created_by_name', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')

class StudentDocumentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    file_size_display = serializers.CharField(source='get_file_size_display', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    
    class Meta:
        model = StudentDocument
        fields = ('id', 'student', 'student_name', 'document_type', 'file', 
                 'original_filename', 'file_size', 'file_size_display',
                 'uploaded_at', 'is_verified', 'verified_by', 'verified_by_name', 'verified_at')
        read_only_fields = ('id', 'student', 'original_filename', 'file_size', 'uploaded_at')

class DocumentUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentDocument
        fields = ('document_type', 'file')
    
    def validate_file(self, value):
        max_size = 10 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("La taille du fichier ne doit pas dépasser 10MB.")
        
        allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
        file_name = value.name.lower()
        if not any(file_name.endswith(ext) for ext in allowed_extensions):
            raise serializers.ValidationError(
                f"Type de fichier non autorisé. Formats acceptés: {', '.join(allowed_extensions)}"
            )
        
        return value
    
    def create(self, validated_data):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Utilisateur non authentifié")
        
        validated_data['student'] = request.user
        validated_data['original_filename'] = validated_data['file'].name
        validated_data['file_size'] = validated_data['file'].size
        
        try:
            return super().create(validated_data)
        except Exception as e:
            raise serializers.ValidationError(f"Erreur lors de la création du document: {str(e)}")

class AdminNotificationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='related_user.get_full_name', read_only=True)
    document_type_display = serializers.CharField(source='related_document.get_document_type_display', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminNotification
        fields = ('id', 'notification_type', 'title', 'message', 'student_name', 
                 'document_type_display', 'is_read', 'created_at', 'time_ago', 
                 'related_document_id', 'related_user_id')
    
    def get_time_ago(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return "À l'instant"
        elif diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"Il y a {minutes} min"
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"Il y a {hours} h"
        else:
            days = diff.days
            return f"Il y a {days} j"

# Serializers pour les demandes de bourse
class ScholarshipApplicationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    scholarship_type_display = serializers.CharField(source='get_scholarship_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    status_color = serializers.CharField(source='get_status_color', read_only=True)
    can_edit = serializers.BooleanField(source='can_be_edited', read_only=True)
    can_submit = serializers.BooleanField(source='can_be_submitted', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = ScholarshipApplication
        fields = (
            'id', 'student', 'student_name', 'scholarship_type', 'scholarship_type_display',
            'title', 'description', 'amount_requested', 'status', 'status_display', 'status_color',
            'final_amount', 'decision_notes', 'submitted_at', 'reviewed_at', 'decision_date',
            'reviewed_by', 'reviewed_by_name', 'created_at', 'updated_at', 'time_ago',
            'can_edit', 'can_submit'
        )
        read_only_fields = ('id', 'student', 'created_at', 'updated_at', 'submitted_at', 
                          'reviewed_at', 'decision_date', 'reviewed_by')

    def get_time_ago(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return "À l'instant"
        elif diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"Il y a {minutes} min"
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"Il y a {hours} h"
        else:
            days = diff.days
            return f"Il y a {days} j"

class ScholarshipApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScholarshipApplication
        fields = ('scholarship_type', 'title', 'description', 'amount_requested')

    def create(self, validated_data):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Utilisateur non authentifié")
        
        if request.user.user_type != 'student':
            raise serializers.ValidationError("Seuls les étudiants peuvent créer des demandes")
        
        validated_data['student'] = request.user
        return super().create(validated_data)

    def validate_amount_requested(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le montant doit être positif")
        if value > 100000:  # 100,000 € maximum
            raise serializers.ValidationError("Le montant demandé est trop élevé")
        return value

class StudentNotificationSerializer(serializers.ModelSerializer):
    icon = serializers.CharField(source='get_icon', read_only=True)
    time_ago = serializers.SerializerMethodField()
    document_type_display = serializers.CharField(source='related_document.get_document_type_display', read_only=True)
    application_title = serializers.CharField(source='related_application.title', read_only=True)
    
    class Meta:
        model = StudentNotification
        fields = (
            'id', 'notification_type', 'title', 'message', 'icon',
            'is_read', 'is_important', 'created_at', 'time_ago',
            'related_document_id', 'related_application_id',
            'document_type_display', 'application_title'
        )
        read_only_fields = ('id', 'created_at')

    def get_time_ago(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return "À l'instant"
        elif diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"Il y a {minutes} min"
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"Il y a {hours} h"
        else:
            days = diff.days
            if days == 1:
                return "Hier"
            elif days < 7:
                return f"Il y a {days} jours"
            elif days < 30:
                weeks = days // 7
                return f"Il y a {weeks} sem"
            else:
                months = days // 30
                return f"Il y a {months} mois"