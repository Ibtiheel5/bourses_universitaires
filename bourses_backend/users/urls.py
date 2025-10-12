from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),
    path('me/', views.get_current_user, name='current_user'),
    path('all/', views.get_users, name='all_users'),
    path('delete/<int:user_id>/', views.delete_user, name='delete_user'),
    path('csrf/', views.get_csrf_token, name='csrf_token'),
    path('status/', views.auth_status, name='auth_status'),
]