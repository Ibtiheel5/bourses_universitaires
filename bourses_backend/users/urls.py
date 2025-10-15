# users/urls.py
from django.urls import path
from . import views

# users/urls.py - CORRIGER les URLs de notification étudiant

urlpatterns = [
    # Authentication
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),
    path('me/', views.get_current_user, name='current_user'),
    path('csrf/', views.get_csrf_token, name='csrf_token'),
    path('status/', views.auth_status, name='auth_status'),
    
    # User Management
    path('all/', views.get_users, name='all_users'),
    path('delete/<int:user_id>/', views.delete_user, name='delete_user'),
    
    # Document Management
    path('documents/', views.manage_documents, name='manage_documents'),
    path('documents/delete/<int:document_id>/', views.delete_document, name='delete_document'),
    path('documents/download/<int:document_id>/', views.download_document, name='download_document'),
    
    # Eligibility Rules
    path('eligibility-rules/', views.get_eligibility_rules, name='get_eligibility_rules'),
    path('eligibility-rules/create/', views.create_eligibility_rule, name='create_eligibility_rule'),
    path('eligibility-rules/<int:rule_id>/', views.manage_eligibility_rule, name='manage_eligibility_rule'),
    
    # Admin Notifications
    path('admin/notifications/', views.get_admin_notifications, name='admin_notifications'),
    path('admin/notifications/<int:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
    path('admin/stats/', views.get_admin_stats, name='admin_stats'),

    # Admin Document Management
    path('admin/documents/', views.get_all_documents_admin, name='admin_documents'),
    path('admin/documents/<int:document_id>/verify/', views.verify_document, name='verify_document'),
    path('admin/documents/<int:document_id>/reject/', views.reject_document, name='reject_document'),

    # Analytics Routes
    path('admin/analytics/', views.get_admin_analytics, name='admin_analytics'),

    # System Management Routes
    path('admin/system/info/', views.get_system_info, name='system_info'),
    path('admin/system/clear-cache/', views.clear_cache, name='clear_cache'),
    path('admin/system/optimize-database/', views.optimize_database, name='optimize_database'),
    path('admin/system/update-settings/', views.update_system_settings, name='update_settings_settings'),

    # Report Generation
    path('admin/generate-report/', views.generate_full_report, name='generate_report'),
    path('admin/export-data/', views.export_data, name='export_data'),
    path('admin/generate-pdf-report/', views.generate_pdf_report, name='generate_pdf_report'),

    # Student Routes - CORRECTION ICI
    path('student/stats/', views.get_student_stats, name='student_stats'),
    path('student/notifications/', views.get_student_notifications, name='student_notifications'),
    path('student/notifications/<int:notification_id>/read/', views.mark_student_notification_read, name='mark_student_notification_read'),
    
    # Student Application Routes
    path('applications/', views.manage_applications, name='manage_applications'),
    path('applications/<int:application_id>/', views.manage_application, name='manage_application'),
    path('applications/<int:application_id>/submit/', views.submit_application, name='submit_application'),
    
    # Admin Application Routes
    path('admin/applications/', views.get_all_applications_admin, name='admin_applications'),

    # Student Notifications Routes - CORRECTION ICI
    path('student/notifications/read-all/', views.mark_all_notifications_read, name='mark_all_notifications_read'),
    path('student/notifications/<int:notification_id>/delete/', views.delete_notification, name='delete_notification'),
    path('student/notifications/delete-all/', views.delete_all_notifications, name='delete_all_notifications'),
]

