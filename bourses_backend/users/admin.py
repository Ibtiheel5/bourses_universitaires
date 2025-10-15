from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, EligibilityRule, StudentDocument, ScholarshipApplication, AdminNotification, StudentNotification

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'user_type', 'is_active')
    list_filter = ('user_type', 'is_active', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        ('Informations supplémentaires', {'fields': ('user_type', 'phone_number', 'date_of_birth')}),
    )

@admin.register(EligibilityRule)
class EligibilityRuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'rule_type', 'is_active', 'created_by', 'created_at')
    list_filter = ('rule_type', 'is_active', 'created_at')
    search_fields = ('title', 'description')
    readonly_fields = ('created_by', 'created_at', 'updated_at')

@admin.register(StudentDocument)
class StudentDocumentAdmin(admin.ModelAdmin):
    list_display = ('student', 'document_type', 'original_filename', 'file_size', 'is_verified', 'uploaded_at')
    list_filter = ('document_type', 'is_verified', 'uploaded_at')
    search_fields = ('student__username', 'student__email', 'original_filename')
    readonly_fields = ('uploaded_at', 'file_size', 'original_filename')

@admin.register(ScholarshipApplication)
class ScholarshipApplicationAdmin(admin.ModelAdmin):
    list_display = ('title', 'student', 'scholarship_type', 'status', 'amount_requested', 'submitted_at')
    list_filter = ('scholarship_type', 'status', 'submitted_at', 'created_at')
    search_fields = ('title', 'student__username', 'student__email', 'description')
    readonly_fields = ('created_at', 'updated_at', 'submitted_at', 'reviewed_at', 'decision_date')
    list_editable = ('status',)
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('student', 'scholarship_type', 'title', 'description', 'amount_requested')
        }),
        ('Statut et décision', {
            'fields': ('status', 'final_amount', 'decision_notes', 'reviewed_by')
        }),
        ('Dates importantes', {
            'fields': ('submitted_at', 'reviewed_at', 'decision_date', 'created_at', 'updated_at')
        }),
    )

@admin.register(AdminNotification)
class AdminNotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('title', 'message')
    readonly_fields = ('created_at',)

@admin.register(StudentNotification)
class StudentNotificationAdmin(admin.ModelAdmin):
    list_display = ('student', 'title', 'notification_type', 'is_read', 'is_important', 'created_at')
    list_filter = ('notification_type', 'is_read', 'is_important', 'created_at')
    search_fields = ('student__username', 'student__email', 'title', 'message')
    readonly_fields = ('created_at',)
    list_editable = ('is_read', 'is_important')
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('student', 'notification_type', 'title', 'message')
        }),
        ('Liens et statut', {
            'fields': ('related_document', 'related_application', 'is_read', 'is_important')
        }),
        ('Dates', {
            'fields': ('created_at', 'read_at')
        }),
    )