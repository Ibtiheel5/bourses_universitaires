from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'user_type', 'is_active')
    list_filter = ('user_type', 'is_active', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        ('Informations supplémentaires', {'fields': ('user_type', 'phone_number', 'date_of_birth')}),
    )