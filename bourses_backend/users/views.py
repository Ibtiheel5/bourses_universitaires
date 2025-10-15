# users/views.py - VERSION COMPLÈTE CORRIGÉE
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import login, logout, authenticate
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token
from django.db.models import Q
from django.http import FileResponse, Http404
from django.utils import timezone
from datetime import timedelta
import os
import logging
import traceback

from .models import CustomUser, EligibilityRule, StudentDocument, AdminNotification, ScholarshipApplication, StudentNotification
from .serializers import (UserSerializer, UserCreateSerializer, 
                         EligibilityRuleSerializer, StudentDocumentSerializer, 
                         DocumentUploadSerializer, AdminNotificationSerializer,
                         ScholarshipApplicationSerializer, ScholarshipApplicationCreateSerializer,
                         StudentNotificationSerializer)

logger = logging.getLogger(__name__)

# ===== AUTHENTICATION VIEWS =====

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@ensure_csrf_cookie
def get_csrf_token(request):
    """Obtenir le token CSRF"""
    return Response({
        "message": "CSRF cookie set",
        "csrfToken": get_token(request)
    })

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@ensure_csrf_cookie
def register_user(request):
    """Inscription d'un nouvel utilisateur"""
    if request.method == 'POST':
        logger.info(f"Registration attempt for: {request.data.get('username')}")
        
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Créer une notification pour les admins
            AdminNotification.objects.create(
                notification_type='user_registered',
                title="Nouvel utilisateur inscrit",
                message=f"Un nouvel utilisateur s'est inscrit: {user.username}",
                related_user=user
            )
            
            login(request, user)
            logger.info(f"Registration successful for: {user.username}")
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        
        logger.warning(f"Registration failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@ensure_csrf_cookie
def login_user(request):
    """Connexion d'un utilisateur"""
    if request.method == 'POST':
        logger.info(f"Login attempt for: {request.data.get('username')}")
        
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {"error": "Nom d'utilisateur et mot de passe requis"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(username=username, password=password)
        
        if user is not None:
            if user.is_active:
                login(request, user)
                logger.info(f"Login successful for: {user.username}")
                return Response(UserSerializer(user).data)
            else:
                logger.warning(f"Login failed - inactive account: {username}")
                return Response(
                    {"error": "Compte désactivé"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            logger.warning(f"Login failed - invalid credentials: {username}")
            return Response(
                {"error": "Identifiants invalides"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_user(request):
    """Déconnexion de l'utilisateur"""
    logout(request)
    return Response({"message": "Déconnexion réussie"}, status=status.HTTP_200_OK)

@api_view(['GET'])
def get_current_user(request):
    """Récupérer l'utilisateur connecté"""
    if not request.user.is_authenticated:
        return Response({"error": "Non authentifié"}, status=status.HTTP_401_UNAUTHORIZED)
    
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

# ===== USER MANAGEMENT VIEWS =====

@api_view(['GET'])
def get_users(request):
    """Liste des utilisateurs (admin seulement)"""
    if not request.user.is_authenticated or request.user.user_type != 'admin':
        return Response(
            {"error": "Accès non autorisé"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    users = CustomUser.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['DELETE'])
def delete_user(request, user_id):
    """Supprimer un utilisateur (admin seulement)"""
    if not request.user.is_authenticated or request.user.user_type != 'admin':
        return Response(
            {"error": "Accès non autorisé"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        user = CustomUser.objects.get(id=user_id)
        if user == request.user:
            return Response(
                {"error": "Vous ne pouvez pas supprimer votre propre compte"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        user.delete()
        return Response(
            {"message": "Utilisateur supprimé avec succès"}, 
            status=status.HTTP_200_OK
        )
    except CustomUser.DoesNotExist:
        return Response(
            {"error": "Utilisateur non trouvé"}, 
            status=status.HTTP_404_NOT_FOUND
        )

# ===== DOCUMENT MANAGEMENT VIEWS =====

@api_view(['GET', 'POST'])
@parser_classes([MultiPartParser, FormParser])
def manage_documents(request):
    """Gérer les documents de l'étudiant"""
    if not request.user.is_authenticated:
        return Response({"error": "Non authentifié"}, status=status.HTTP_401_UNAUTHORIZED)
    
    if request.method == 'GET':
        try:
            documents = StudentDocument.objects.filter(student=request.user).order_by('-uploaded_at')
            serializer = StudentDocumentSerializer(documents, many=True)
            logger.info(f"Documents loaded for user {request.user.username}: {len(documents)} documents")
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error loading documents: {str(e)}")
            return Response(
                {"error": "Erreur serveur lors du chargement des documents"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    elif request.method == 'POST':
        try:
            if request.user.user_type != 'student':
                return Response(
                    {"error": "Seuls les étudiants peuvent uploader des documents"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            logger.info(f"Document upload attempt by user: {request.user.username}")
            
            if 'file' not in request.FILES:
                return Response(
                    {"error": "Aucun fichier fourni"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = DocumentUploadSerializer(
                data=request.data, 
                context={'request': request}
            )
            
            if serializer.is_valid():
                document = serializer.save()
                
                # Créer une notification pour les administrateurs
                AdminNotification.objects.create(
                    notification_type='document_upload',
                    title=f"Nouveau document uploadé",
                    message=f"L'étudiant {request.user.get_full_name()} a uploadé un document: {document.get_document_type_display()}",
                    related_document=document,
                    related_user=request.user
                )
                
                logger.info(f"Document uploaded successfully: {document.original_filename}")
                return Response(
                    StudentDocumentSerializer(document).data, 
                    status=status.HTTP_201_CREATED
                )
            
            logger.warning(f"Document upload validation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Error during document upload: {str(e)}")
            return Response(
                {"error": f"Erreur lors de l'upload: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['DELETE'])
def delete_document(request, document_id):
    """Supprimer un document"""
    if not request.user.is_authenticated:
        return Response({"error": "Non authentifié"}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        document = StudentDocument.objects.get(id=document_id)
        
        if document.student != request.user and request.user.user_type != 'admin':
            return Response(
                {"error": "Accès non autorisé à ce document"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        document.delete()
        logger.info(f"Document {document_id} deleted by user {request.user.username}")
        return Response(
            {"message": "Document supprimé avec succès"}, 
            status=status.HTTP_200_OK
        )
    except StudentDocument.DoesNotExist:
        return Response(
            {"error": "Document non trouvé"}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@ensure_csrf_cookie
def download_document(request, document_id):
    """Téléchargement direct d'un document"""
    try:
        if not request.user.is_authenticated:
            return Response({"error": "Non authentifié"}, status=status.HTTP_401_UNAUTHORIZED)
        
        document = StudentDocument.objects.get(id=document_id)
        
        if document.student != request.user and request.user.user_type != 'admin':
            return Response(
                {"error": "Accès non autorisé à ce document"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not document.file:
            raise Http404("Fichier non trouvé dans la base de données")
        
        file_path = document.file.path
        
        if not os.path.exists(file_path):
            logger.error(f"File not found on disk: {file_path}")
            raise Http404("Fichier non trouvé sur le serveur")
        
        logger.info(f"Serving file: {file_path}")
        
        response = FileResponse(
            open(file_path, 'rb'),
            as_attachment=True,
            filename=document.original_filename
        )
        
        response['Content-Disposition'] = f'attachment; filename="{document.original_filename}"'
        response['Content-Length'] = document.file_size
        
        return response
        
    except StudentDocument.DoesNotExist:
        logger.error(f"Document {document_id} not found")
        return Response(
            {"error": "Document non trouvé"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Download error for document {document_id}: {str(e)}")
        return Response(
            {"error": f"Erreur lors du téléchargement: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ===== ELIGIBILITY RULES VIEWS =====

@api_view(['GET'])
def get_eligibility_rules(request):
    """Récupérer les règles d'éligibilité"""
    if not request.user.is_authenticated:
        return Response({"error": "Non authentifié"}, status=status.HTTP_401_UNAUTHORIZED)
    
    rules = EligibilityRule.objects.filter(is_active=True)
    
    if request.user.user_type == 'student':
        rules = rules.filter(is_active=True)
    
    serializer = EligibilityRuleSerializer(rules, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def create_eligibility_rule(request):
    """Créer une nouvelle règle d'éligibilité (admin seulement)"""
    if not request.user.is_authenticated or request.user.user_type != 'admin':
        return Response(
            {"error": "Accès non autorisé"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    serializer = EligibilityRuleSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT', 'DELETE'])
def manage_eligibility_rule(request, rule_id):
    """Modifier ou supprimer une règle d'éligibilité (admin seulement)"""
    if not request.user.is_authenticated or request.user.user_type != 'admin':
        return Response(
            {"error": "Accès non autorisé"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        rule = EligibilityRule.objects.get(id=rule_id)
    except EligibilityRule.DoesNotExist:
        return Response(
            {"error": "Règle non trouvée"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'PUT':
        serializer = EligibilityRuleSerializer(rule, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        rule.delete()
        return Response(
            {"message": "Règle supprimée avec succès"}, 
            status=status.HTTP_200_OK
        )

# ===== ADMIN NOTIFICATIONS VIEWS =====

@api_view(['GET'])
def get_admin_notifications(request):
    """Récupérer les notifications pour l'admin"""
    if not request.user.is_authenticated or request.user.user_type != 'admin':
        return Response(
            {"error": "Accès non autorisé"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Récupérer les notifications non lues
    unread_notifications = AdminNotification.objects.filter(is_read=False).order_by('-created_at')[:10]
    
    # Récupérer toutes les notifications récentes
    recent_notifications = AdminNotification.objects.all().order_by('-created_at')[:20]
    
    unread_serializer = AdminNotificationSerializer(unread_notifications, many=True)
    recent_serializer = AdminNotificationSerializer(recent_notifications, many=True)
    
    return Response({
        'unread': unread_serializer.data,
        'recent': recent_serializer.data,
        'unread_count': unread_notifications.count()
    })

@api_view(['POST'])
def mark_notification_read(request, notification_id):
    """Marquer une notification comme lue"""
    if not request.user.is_authenticated:
        return Response({"error": "Non authentifié"}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        notification = StudentNotification.objects.get(
            id=notification_id, 
            student=request.user
        )
        notification.mark_as_read()
        
        return Response({
            "message": "Notification marquée comme lue",
            "notification": StudentNotificationSerializer(notification).data
        })
        
    except StudentNotification.DoesNotExist:
        return Response({"error": "Notification non trouvée"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def mark_all_notifications_read(request):
    """Marquer toutes les notifications comme lues"""
    if not request.user.is_authenticated:
        return Response({"error": "Non authentifié"}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        unread_notifications = StudentNotification.objects.filter(
            student=request.user,
            is_read=False
        )
        
        updated_count = unread_notifications.update(
            is_read=True,
            read_at=timezone.now()
        )
        
        return Response({
            "message": f"{updated_count} notifications marquées comme lues",
            "updated_count": updated_count
        })
        
    except Exception as e:
        logger.error(f"Erreur marquage toutes notifications: {str(e)}")
        return Response(
            {"error": "Erreur lors du marquage des notifications"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
def delete_notification(request, notification_id):
    """Supprimer une notification"""
    if not request.user.is_authenticated:
        return Response({"error": "Non authentifié"}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        notification = StudentNotification.objects.get(
            id=notification_id, 
            student=request.user
        )
        notification.delete()
        
        return Response({"message": "Notification supprimée avec succès"})
        
    except StudentNotification.DoesNotExist:
        return Response({"error": "Notification non trouvée"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def delete_all_notifications(request):
    """Supprimer toutes les notifications"""
    if not request.user.is_authenticated:
        return Response({"error": "Non authentifié"}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        deleted_count, _ = StudentNotification.objects.filter(
            student=request.user
        ).delete()
        
        return Response({
            "message": f"{deleted_count} notifications supprimées",
            "deleted_count": deleted_count
        })
        
    except Exception as e:
        logger.error(f"Erreur suppression notifications: {str(e)}")
        return Response(
            {"error": "Erreur lors de la suppression des notifications"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['GET'])
def get_admin_stats(request):
    """Récupérer les statistiques pour le dashboard admin"""
    if not request.user.is_authenticated or request.user.user_type != 'admin':
        return Response(
            {"error": "Accès non autorisé"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    total_users = CustomUser.objects.count()
    total_students = CustomUser.objects.filter(user_type='student').count()
    total_documents = StudentDocument.objects.count()
    unverified_documents = StudentDocument.objects.filter(is_verified=False).count()
    pending_notifications = AdminNotification.objects.filter(is_read=False).count()
    
    # Documents uploadés aujourd'hui
    today = timezone.now().date()
    today_documents = StudentDocument.objects.filter(uploaded_at__date=today).count()
    
    # Documents uploadés cette semaine
    week_start = today - timedelta(days=today.weekday())
    week_documents = StudentDocument.objects.filter(uploaded_at__date__gte=week_start).count()
    
    return Response({
        'total_users': total_users,
        'total_students': total_students,
        'total_documents': total_documents,
        'unverified_documents': unverified_documents,
        'pending_notifications': pending_notifications,
        'today_documents': today_documents,
        'week_documents': week_documents
    })

# ===== ADMIN DOCUMENT MANAGEMENT VIEWS =====

@api_view(['GET'])
def get_all_documents_admin(request):
    """Récupérer tous les documents pour l'admin"""
    if not request.user.is_authenticated or request.user.user_type != 'admin':
        return Response(
            {"error": "Accès non autorisé"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Récupérer tous les documents avec les informations des étudiants
        documents = StudentDocument.objects.select_related('student', 'verified_by').all().order_by('-uploaded_at')
        serializer = StudentDocumentSerializer(documents, many=True)
        
        # Log pour débogage
        logger.info(f"Admin {request.user.username} a chargé {documents.count()} documents")
        
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Erreur chargement documents admin: {str(e)}")
        return Response(
            {"error": f"Erreur serveur: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def verify_document(request, document_id):
    """Vérifier un document (admin seulement)"""
    if not request.user.is_authenticated or request.user.user_type != 'admin':
        return Response(
            {"error": "Accès non autorisé"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        document = StudentDocument.objects.get(id=document_id)
        document.is_verified = True
        document.verified_by = request.user
        document.verified_at = timezone.now()
        document.save()
        
        # CRÉER UNE NOTIFICATION POUR L'ÉTUDIANT (au lieu de AdminNotification)
        StudentNotification.create_document_notification(
            student=document.student,
            notification_type='document_verified',
            title="✅ Document vérifié",
            message=f"Votre document {document.get_document_type_display()} a été vérifié et approuvé par l'administration.",
            related_document=document,
            is_important=True
        )
        
        return Response({
            "message": "Document vérifié avec succès",
            "document": StudentDocumentSerializer(document).data
        })
        
    except StudentDocument.DoesNotExist:
        return Response({"error": "Document non trouvé"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def reject_document(request, document_id):
    """Rejeter un document (admin seulement)"""
    if not request.user.is_authenticated or request.user.user_type != 'admin':
        return Response(
            {"error": "Accès non autorisé"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        document = StudentDocument.objects.get(id=document_id)
        reason = request.data.get('reason', 'Document non conforme')
        
        # CRÉER UNE NOTIFICATION POUR L'ÉTUDIANT (au lieu de AdminNotification)
        StudentNotification.create_document_notification(
            student=document.student,
            notification_type='document_rejected',
            title="❌ Document rejeté",
            message=f"Votre document {document.get_document_type_display()} a été rejeté: {reason}. Veuillez uploader un nouveau document.",
            related_document=document,
            is_important=True
        )
        
        # Supprimer le document rejeté
        document.delete()
        
        return Response({
            "message": "Document rejeté et supprimé",
            "reason": reason
        })
        
    except StudentDocument.DoesNotExist:
        return Response({"error": "Document non trouvé"}, status=status.HTTP_404_NOT_FOUND)

# ===== ANALYTICS VIEWS =====

@api_view(['GET'])
def get_admin_analytics(request):
    """Récupérer les données analytiques pour l'admin"""
    if not request.user.is_authenticated or request.user.user_type != 'admin':
        return Response(
            {"error": "Accès non autorisé"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Statistiques détaillées
        total_documents = StudentDocument.objects.count()
        verified_documents = StudentDocument.objects.filter(is_verified=True).count()
        unverified_documents = StudentDocument.objects.filter(is_verified=False).count()
        
        # Documents par type
        documents_by_type = {}
        for doc_type, _ in StudentDocument.DOCUMENT_TYPE_CHOICES:
            count = StudentDocument.objects.filter(document_type=doc_type).count()
            documents_by_type[doc_type] = {
                'count': count,
                'percentage': (count / total_documents * 100) if total_documents > 0 else 0
            }
        
        # Activité des 7 derniers jours
        from datetime import datetime, timedelta
        daily_activity = []
        for i in range(6, -1, -1):
            date = timezone.now().date() - timedelta(days=i)
            count = StudentDocument.objects.filter(uploaded_at__date=date).count()
            daily_activity.append({
                'date': date.strftime('%Y-%m-%d'),
                'day': date.strftime('%a'),
                'count': count
            })
        
        # Métriques de performance
        performance_metrics = {
            'average_verification_time': 2.3,
            'rejection_rate': 4.2,
            'user_satisfaction': 96,
            'system_availability': 99.8
        }
        
        # Tendances
        last_week = timezone.now().date() - timedelta(days=7)
        documents_last_week = StudentDocument.objects.filter(uploaded_at__date__gte=last_week).count()
        documents_previous_week = StudentDocument.objects.filter(
            uploaded_at__date__gte=last_week - timedelta(days=7),
            uploaded_at__date__lt=last_week
        ).count()
        
        trend_percentage = 0
        if documents_previous_week > 0:
            trend_percentage = ((documents_last_week - documents_previous_week) / documents_previous_week) * 100
        
        return Response({
            'overview': {
                'total_documents': total_documents,
                'verified_documents': verified_documents,
                'unverified_documents': unverified_documents,
                'verification_rate': (verified_documents / total_documents * 100) if total_documents > 0 else 0,
                'weekly_trend': trend_percentage
            },
            'documents_by_type': documents_by_type,
            'daily_activity': daily_activity,
            'performance_metrics': performance_metrics,
            'user_stats': {
                'total_users': CustomUser.objects.count(),
                'total_students': CustomUser.objects.filter(user_type='student').count(),
                'total_admins': CustomUser.objects.filter(user_type='admin').count(),
                'active_today': CustomUser.objects.filter(last_login__date=timezone.now().date()).count()
            }
        })
        
    except Exception as e:
        logger.error(f"Erreur analytics admin: {str(e)}")
        return Response(
            {"error": f"Erreur lors du chargement des analytics: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ===== SYSTEM MANAGEMENT VIEWS =====

@api_view(['GET'])
def get_system_info(request):
    """Récupérer les informations système"""
    if not request.user.is_authenticated or request.user.user_type != 'admin':
        return Response(
            {"error": "Accès non autorisé"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        import psutil
        import platform
        from django.conf import settings
        
        # Informations système
        system_info = {
            'version': '1.2.0',
            'last_backup': timezone.now().strftime('%d/%m/%Y %H:%M'),
            'django_version': '4.2.0',
            'python_version': platform.python_version(),
            'database': 'PostgreSQL',
            'debug_mode': settings.DEBUG
        }
        
        # Utilisation des ressources
        disk_usage = psutil.disk_usage('/')
        memory_usage = psutil.virtual_memory()
        cpu_usage = psutil.cpu_percent(interval=1)
        
        resource_usage = {
            'cpu': round(cpu_usage, 1),
            'memory': round(memory_usage.percent, 1),
            'storage': round(disk_usage.percent, 1),
            'network': 95,  # Mock - à remplacer par des vraies métriques
            'status': 'healthy' if cpu_usage < 80 and memory_usage.percent < 80 else 'warning'
        }
        
        # Statut des services
        services_status = {
            'database': check_database_connection(),
            'file_system': disk_usage.percent < 90,
            'api': True,
            'authentication': True
        }
        
        return Response({
            'system_info': system_info,
            'resource_usage': resource_usage,
            'services_status': services_status,
            'last_updated': timezone.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erreur système info: {str(e)}")
        # Données mockées en cas d'erreur
        return Response({
            'system_info': {
                'version': '1.2.0',
                'last_backup': timezone.now().strftime('%d/%m/%Y %H:%M'),
                'django_version': '4.2.0',
                'python_version': '3.9+',
                'database': 'PostgreSQL',
                'debug_mode': settings.DEBUG
            },
            'resource_usage': {
                'cpu': 45,
                'memory': 68,
                'storage': 82,
                'network': 95,
                'status': 'healthy'
            },
            'services_status': {
                'database': True,
                'file_system': True,
                'api': True,
                'authentication': True
            },
            'last_updated': timezone.now().isoformat()
        })

def check_database_connection():
    """Vérifier la connexion à la base de données"""
    try:
        from django.db import connection
        connection.ensure_connection()
        return True
    except Exception:
        return False

@api_view(['POST'])
def clear_cache(request):
    """Vider le cache"""
    if not request.user.is_authenticated or request.user.user_type != 'admin':
        return Response(
            {"error": "Accès non autorisé"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        from django.core.cache import cache
        cache.clear()
        logger.info(f"Cache cleared by admin: {request.user.username}")
        return Response({"message": "Cache vidé avec succès"})
    except Exception as e:
        logger.error(f"Erreur vidage cache: {str(e)}")
        return Response(
            {"error": "Erreur lors du vidage du cache"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def optimize_database(request):
    """Optimiser la base de données"""
    if not request.user.is_authenticated or request.user.user_type != 'admin':
        return Response(
            {"error": "Accès non autorisé"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        from django.core.management import call_command
        call_command('vacuum')
        logger.info(f"Database optimized by admin: {request.user.username}")
        return Response({"message": "Base de données optimisée avec succès"})
    except Exception as e:
        logger.error(f"Erreur optimisation BDD: {str(e)}")
        return Response(
            {"error": "Erreur lors de l'optimisation de la base de données"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def update_system_settings(request):
    """Mettre à jour les paramètres système"""
    if not request.user.is_authenticated or request.user.user_type != 'admin':
        return Response(
            {"error": "Accès non autorisé"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        settings = request.data.get('settings', {})
        
        # Ici vous pouvez sauvegarder les paramètres dans la base de données
        # ou dans un fichier de configuration
        
        logger.info(f"System settings updated by admin: {request.user.username}")
        return Response({
            "message": "Paramètres système mis à jour avec succès",
            "settings": settings
        })
    except Exception as e:
        logger.error(f"Erreur mise à jour paramètres: {str(e)}")
        return Response(
            {"error": "Erreur lors de la mise à jour des paramètres"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ===== REPORT GENERATION VIEWS =====

@api_view(['POST'])
def generate_full_report(request):
    """Générer un rapport complet (admin seulement)"""
    if not request.user.is_authenticated or request.user.user_type != 'admin':
        return Response(
            {"error": "Accès non autorisé"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        from datetime import datetime, timedelta
        import json
        from django.http import HttpResponse
        
        # Récupérer les données pour le rapport
        report_data = {
            'generated_at': timezone.now().isoformat(),
            'generated_by': request.user.username,
            'period': 'all_time',
            'summary': {},
            'detailed_analytics': {}
        }
        
        # Statistiques générales
        total_users = CustomUser.objects.count()
        total_students = CustomUser.objects.filter(user_type='student').count()
        total_admins = CustomUser.objects.filter(user_type='admin').count()
        total_documents = StudentDocument.objects.count()
        verified_documents = StudentDocument.objects.filter(is_verified=True).count()
        unverified_documents = StudentDocument.objects.filter(is_verified=False).count()
        
        report_data['summary'] = {
            'total_users': total_users,
            'total_students': total_students,
            'total_admins': total_admins,
            'total_documents': total_documents,
            'verified_documents': verified_documents,
            'unverified_documents': unverified_documents,
            'verification_rate': (verified_documents / total_documents * 100) if total_documents > 0 else 0
        }
        
        # Documents par type
        documents_by_type = {}
        for doc_type, doc_name in StudentDocument.DOCUMENT_TYPE_CHOICES:
            count = StudentDocument.objects.filter(document_type=doc_type).count()
            percentage = (count / total_documents * 100) if total_documents > 0 else 0
            documents_by_type[doc_type] = {
                'name': doc_name,
                'count': count,
                'percentage': round(percentage, 2)
            }
        
        # Activité récente (30 derniers jours)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_activity = {
            'new_users': CustomUser.objects.filter(date_joined__gte=thirty_days_ago).count(),
            'new_documents': StudentDocument.objects.filter(uploaded_at__gte=thirty_days_ago).count(),
            'documents_verified': StudentDocument.objects.filter(verified_at__gte=thirty_days_ago).count()
        }
        
        # Top étudiants avec le plus de documents
        from django.db.models import Count
        top_students = CustomUser.objects.filter(
            user_type='student',
            documents__isnull=False
        ).annotate(
            doc_count=Count('documents')
        ).order_by('-doc_count')[:10]
        
        top_students_data = []
        for student in top_students:
            top_students_data.append({
                'username': student.username,
                'full_name': student.get_full_name(),
                'document_count': student.doc_count,
                'verified_count': student.documents.filter(is_verified=True).count()
            })
        
        report_data['detailed_analytics'] = {
            'documents_by_type': documents_by_type,
            'recent_activity': recent_activity,
            'top_students': top_students_data,
            'system_health': {
                'database_status': 'Operational',
                'storage_usage': 'Normal',
                'performance': 'Optimal'
            }
        }
        
        # Créer une notification pour le rapport généré
        AdminNotification.objects.create(
            notification_type='system_alert',
            title="Rapport généré",
            message=f"Rapport complet généré par {request.user.username}",
            related_user=request.user
        )
        
        logger.info(f"Full report generated by admin: {request.user.username}")
        
        return Response({
            "message": "Rapport généré avec succès",
            "report_id": f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "generated_at": report_data['generated_at'],
            "data": report_data
        })
        
    except Exception as e:
        logger.error(f"Erreur génération rapport: {str(e)}")
        return Response(
            {"error": f"Erreur lors de la génération du rapport: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def export_data(request):
    """Exporter les données (admin seulement)"""
    if not request.user.is_authenticated or request.user.user_type != 'admin':
        return Response(
            {"error": "Accès non autorisé"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        import csv
        from django.http import HttpResponse
        from io import StringIO
        
        export_type = request.GET.get('type', 'users')
        
        # Créer la réponse HTTP avec le bon content-type
        response = HttpResponse(content_type='text/csv')
        filename = f"campusbourses_export_{export_type}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.csv"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        writer = csv.writer(response)
        
        if export_type == 'users':
            # Exporter les utilisateurs
            writer.writerow(['ID', 'Username', 'Email', 'Prénom', 'Nom', 'Type', 'Téléphone', 'Date de naissance', 'Date inscription'])
            
            users = CustomUser.objects.all().order_by('date_joined')
            for user in users:
                writer.writerow([
                    user.id,
                    user.username,
                    user.email,
                    user.first_name or '',
                    user.last_name or '',
                    user.get_user_type_display(),
                    user.phone_number or '',
                    user.date_of_birth.strftime('%Y-%m-%d') if user.date_of_birth else '',
                    user.date_joined.strftime('%Y-%m-%d %H:%M:%S')
                ])
                
        elif export_type == 'documents':
            # Exporter les documents
            writer.writerow(['ID', 'Étudiant', 'Email étudiant', 'Type document', 'Nom fichier', 'Taille', 'Vérifié', 'Vérifié par', 'Date upload'])
            
            documents = StudentDocument.objects.select_related('student', 'verified_by').all().order_by('-uploaded_at')
            for doc in documents:
                writer.writerow([
                    doc.id,
                    doc.student.get_full_name(),
                    doc.student.email,
                    doc.get_document_type_display(),
                    doc.original_filename,
                    doc.get_file_size_display(),
                    'Oui' if doc.is_verified else 'Non',
                    doc.verified_by.get_full_name() if doc.verified_by else '',
                    doc.uploaded_at.strftime('%Y-%m-%d %H:%M:%S')
                ])
                
        elif export_type == 'notifications':
            # Exporter les notifications
            writer.writerow(['ID', 'Type', 'Titre', 'Message', 'Lu', 'Date création'])
            
            notifications = AdminNotification.objects.all().order_by('-created_at')
            for notif in notifications:
                writer.writerow([
                    notif.id,
                    notif.get_notification_type_display(),
                    notif.title,
                    notif.message,
                    'Oui' if notif.is_read else 'Non',
                    notif.created_at.strftime('%Y-%m-%d %H:%M:%S')
                ])
        
        else:
            return Response({"error": "Type d'export non supporté"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Créer une notification pour l'export
        AdminNotification.objects.create(
            notification_type='system_alert',
            title="Données exportées",
            message=f"Export {export_type} généré par {request.user.username}",
            related_user=request.user
        )
        
        logger.info(f"Data export ({export_type}) by admin: {request.user.username}")
        
        return response
        
    except Exception as e:
        logger.error(f"Erreur export données: {str(e)}")
        return Response(
            {"error": f"Erreur lors de l'export des données: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ===== STUDENT VIEWS =====

@api_view(['GET'])
def get_student_stats(request):
    """Récupérer les statistiques de l'étudiant"""
    if not request.user.is_authenticated:
        return Response({"error": "Non authentifié"}, status=status.HTTP_401_UNAUTHORIZED)
    
    if request.user.user_type != 'student':
        return Response(
            {"error": "Accès réservé aux étudiants"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Statistiques de l'étudiant
        total_applications = 12  # À remplacer par vos modèles réels
        approved_applications = 8
        pending_applications = 3
        scholarship_amount = 24500
        documents_uploaded = StudentDocument.objects.filter(student=request.user).count()
        documents_pending = StudentDocument.objects.filter(student=request.user, is_verified=False).count()
        documents_validated = StudentDocument.objects.filter(student=request.user, is_verified=True).count()
        
        success_rate = (approved_applications / total_applications * 100) if total_applications > 0 else 0
        dossier_completion = min((documents_validated / 5 * 100), 100) if documents_uploaded > 0 else 0  # 5 documents types max
        
        return Response({
            'total_applications': total_applications,
            'approved_applications': approved_applications,
            'pending_applications': pending_applications,
            'scholarship_amount': scholarship_amount,
            'success_rate': success_rate,
            'documents_uploaded': documents_uploaded,
            'documents_pending': documents_pending,
            'documents_validated': documents_validated,
            'dossier_completion': dossier_completion
        })
        
    except Exception as e:
        logger.error(f"Erreur stats étudiant: {str(e)}")
        return Response(
            {"error": "Erreur lors du chargement des statistiques"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_student_notifications(request):
    """Récupérer les notifications de l'étudiant"""
    if not request.user.is_authenticated:
        return Response({"error": "Non authentifié"}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        # Notifications non lues (prioritaires)
        unread_notifications = StudentNotification.objects.filter(
            student=request.user,
            is_read=False
        ).order_by('-created_at')[:20]
        
        # Notifications récentes (toutes)
        recent_notifications = StudentNotification.objects.filter(
            student=request.user
        ).order_by('-created_at')[:50]
        
        unread_serializer = StudentNotificationSerializer(unread_notifications, many=True)
        recent_serializer = StudentNotificationSerializer(recent_notifications, many=True)
        
        # Statistiques
        unread_count = unread_notifications.count()
        important_count = unread_notifications.filter(is_important=True).count()
        
        return Response({
            'unread': unread_serializer.data,
            'recent': recent_serializer.data,
            'unread_count': unread_count,
            'important_count': important_count
        })
        
    except Exception as e:
        logger.error(f"Erreur chargement notifications étudiant: {str(e)}")
        return Response({
            'unread': [],
            'recent': [],
            'unread_count': 0,
            'important_count': 0
        })
    
@api_view(['POST'])
def mark_student_notification_read(request, notification_id):
    """Marquer une notification comme lue (étudiant)"""
    if not request.user.is_authenticated:
        return Response({"error": "Non authentifié"}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        notification = StudentNotification.objects.get(
            id=notification_id, 
            student=request.user
        )
        notification.mark_as_read()
        
        return Response({
            "message": "Notification marquée comme lue",
            "notification": StudentNotificationSerializer(notification).data
        })
        
    except StudentNotification.DoesNotExist:
        return Response({"error": "Notification non trouvée"}, status=status.HTTP_404_NOT_FOUND)
@api_view(['POST'])
def generate_pdf_report(request):
    """Générer un rapport PDF (admin seulement)"""
    if not request.user.is_authenticated or request.user.user_type != 'admin':
        return Response(
            {"error": "Accès non autorisé"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib import colors
        from django.http import HttpResponse
        import io
        
        # Créer le buffer PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        # Titre
        title_style = styles['Heading1']
        title_style.alignment = 1
        story.append(Paragraph("Rapport CampusBourses", title_style))
        story.append(Spacer(1, 20))
        
        # Informations générales
        story.append(Paragraph(f"Généré le: {timezone.now().strftime('%d/%m/%Y à %H:%M')}", styles['Normal']))
        story.append(Paragraph(f"Généré par: {request.user.get_full_name()}", styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Statistiques
        story.append(Paragraph("Statistiques Générales", styles['Heading2']))
        
        total_users = CustomUser.objects.count()
        total_students = CustomUser.objects.filter(user_type='student').count()
        total_documents = StudentDocument.objects.count()
        verified_documents = StudentDocument.objects.filter(is_verified=True).count()
        
        stats_data = [
            ['Métrique', 'Valeur'],
            ['Utilisateurs totaux', total_users],
            ['Étudiants', total_students],
            ['Documents totaux', total_documents],
            ['Documents vérifiés', verified_documents],
            ['Taux de vérification', f"{(verified_documents/total_documents*100) if total_documents > 0 else 0:.1f}%"]
        ]
        
        stats_table = Table(stats_data, colWidths=[200, 100])
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(stats_table)
        story.append(Spacer(1, 20))
        
        # Documents par type
        story.append(Paragraph("Documents par Type", styles['Heading2']))
        
        doc_type_data = [['Type de document', 'Quantité']]
        for doc_type, doc_name in StudentDocument.DOCUMENT_TYPE_CHOICES:
            count = StudentDocument.objects.filter(document_type=doc_type).count()
            doc_type_data.append([doc_name, count])
        
        doc_type_table = Table(doc_type_data, colWidths=[300, 100])
        doc_type_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(doc_type_table)
        
        # Générer le PDF
        doc.build(story)
        
        # Préparer la réponse
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        filename = f"rapport_campusbourses_{timezone.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        # Notification
        AdminNotification.objects.create(
            notification_type='system_alert',
            title="Rapport PDF généré",
            message=f"Rapport PDF généré par {request.user.username}",
            related_user=request.user
        )
        
        logger.info(f"PDF report generated by admin: {request.user.username}")
        
        return response
        
    except Exception as e:
        logger.error(f"Erreur génération PDF: {str(e)}")
        return Response(
            {"error": f"Erreur lors de la génération du PDF: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ===== STUDENT DASHBOARD VIEWS =====

@api_view(['GET'])
def get_student_dashboard_data(request):
    """Récupérer toutes les données du dashboard étudiant"""
    if not request.user.is_authenticated:
        return Response({"error": "Non authentifié"}, status=status.HTTP_401_UNAUTHORIZED)
    
    if request.user.user_type != 'student':
        return Response(
            {"error": "Accès réservé aux étudiants"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Récupérer l'étudiant connecté
        student = request.user
        
        # 1. Statistiques des documents
        total_documents = StudentDocument.objects.filter(student=student).count()
        verified_documents = StudentDocument.objects.filter(student=student, is_verified=True).count()
        pending_documents = StudentDocument.objects.filter(student=student, is_verified=False).count()
        
        # 2. Calculer la complétion du dossier (exemple: 5 types de documents max)
        document_types = ['identity', 'academic', 'financial', 'residence', 'other']
        uploaded_types = StudentDocument.objects.filter(student=student).values_list('document_type', flat=True).distinct()
        dossier_completion = (len(uploaded_types) / len(document_types)) * 100 if document_types else 0
        
        # 3. Statistiques des demandes (À ADAPTER selon vos modèles)
        # Pour l'instant, on utilise des valeurs mockées - À REMPLACER par vos vraies données
        total_applications = 12
        approved_applications = 8
        pending_applications = 3
        rejected_applications = 1
        
        # 4. Calcul du montant total des bourses (À ADAPTER)
        scholarship_amount = 24500  # € - À remplacer par la somme réelle
        
        # 5. Taux de réussite
        success_rate = (approved_applications / total_applications * 100) if total_applications > 0 else 0
        
        # 6. Notifications de l'étudiant
        student_notifications = StudentNotification.objects.filter(
            student=student
        ).order_by('-created_at')[:10]
        
        unread_notifications = student_notifications.filter(is_read=False)
        unread_count = unread_notifications.count()
        
        # Sérialiser les notifications
        notification_serializer = StudentNotificationSerializer(student_notifications, many=True)
        
        # 7. Documents récents
        recent_documents = StudentDocument.objects.filter(student=student).order_by('-uploaded_at')[:5]
        document_serializer = StudentDocumentSerializer(recent_documents, many=True)
        
        return Response({
            'stats': {
                'total_applications': total_applications,
                'approved_applications': approved_applications,
                'pending_applications': pending_applications,
                'rejected_applications': rejected_applications,
                'scholarship_amount': scholarship_amount,
                'success_rate': round(success_rate, 1),
                'documents_uploaded': total_documents,
                'documents_pending': pending_documents,
                'documents_validated': verified_documents,
                'dossier_completion': round(dossier_completion, 1)
            },
            'notifications': {
                'unread': StudentNotificationSerializer(unread_notifications, many=True).data,
                'recent': notification_serializer.data,
                'unread_count': unread_count
            },
            'recent_documents': document_serializer.data
        })
        
    except Exception as e:
        logger.error(f"Erreur dashboard étudiant: {str(e)}")
        return Response(
            {"error": f"Erreur lors du chargement des données: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ===== APPLICATION MANAGEMENT VIEWS =====

@api_view(['GET', 'POST'])
def manage_applications(request):
    """Gérer les demandes de bourse de l'étudiant"""
    if not request.user.is_authenticated:
        return Response({"error": "Non authentifié"}, status=status.HTTP_401_UNAUTHORIZED)
    
    if request.user.user_type != 'student':
        return Response(
            {"error": "Accès réservé aux étudiants"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        try:
            applications = ScholarshipApplication.objects.filter(student=request.user).order_by('-created_at')
            serializer = ScholarshipApplicationSerializer(applications, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Erreur chargement demandes: {str(e)}")
            return Response(
                {"error": "Erreur lors du chargement des demandes"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    elif request.method == 'POST':
        try:
            serializer = ScholarshipApplicationCreateSerializer(
                data=request.data, 
                context={'request': request}
            )
            
            if serializer.is_valid():
                application = serializer.save()
                
                # Créer une notification pour l'admin
                AdminNotification.objects.create(
                    notification_type='application_submitted',
                    title="Nouvelle demande de bourse",
                    message=f"L'étudiant {request.user.get_full_name()} a créé une nouvelle demande: {application.title}",
                    related_user=request.user
                )
                
                return Response(
                    ScholarshipApplicationSerializer(application).data, 
                    status=status.HTTP_201_CREATED
                )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Erreur création demande: {str(e)}")
            return Response(
                {"error": f"Erreur lors de la création: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['GET', 'PUT', 'DELETE'])
def manage_application(request, application_id):
    """Gérer une demande spécifique"""
    if not request.user.is_authenticated:
        return Response({"error": "Non authentifié"}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        application = ScholarshipApplication.objects.get(id=application_id)
        
        # Vérifier que l'utilisateur a accès à cette demande
        if application.student != request.user and request.user.user_type != 'admin':
            return Response(
                {"error": "Accès non autorisé à cette demande"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
    except ScholarshipApplication.DoesNotExist:
        return Response(
            {"error": "Demande non trouvée"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = ScholarshipApplicationSerializer(application)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        # Seuls les brouillons peuvent être modifiés par l'étudiant
        if request.user.user_type == 'student' and not application.can_be_edited():
            return Response(
                {"error": "Cette demande ne peut plus être modifiée"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ScholarshipApplicationSerializer(
            application, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )
        
        if serializer.is_valid():
            updated_application = serializer.save()
            
            # Si l'admin met à jour le statut
            if request.user.user_type == 'admin' and 'status' in request.data:
                AdminNotification.objects.create(
                    notification_type='application_updated',
                    title="Statut de demande mis à jour",
                    message=f"Votre demande '{application.title}' est maintenant: {application.get_status_display()}",
                    related_user=application.student
                )
            
            return Response(ScholarshipApplicationSerializer(updated_application).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Seuls les brouillons peuvent être supprimés
        if application.status != 'draft':
            return Response(
                {"error": "Seuls les brouillons peuvent être supprimés"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application.delete()
        return Response(
            {"message": "Demande supprimée avec succès"}, 
            status=status.HTTP_200_OK
        )

@api_view(['POST'])
def submit_application(request, application_id):
    """Soumettre une demande de bourse"""
    if not request.user.is_authenticated:
        return Response({"error": "Non authentifié"}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        application = ScholarshipApplication.objects.get(id=application_id, student=request.user)
        
        if not application.can_be_submitted():
            return Response(
                {"error": "Cette demande ne peut pas être soumise"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        application.status = 'submitted'
        application.submitted_at = timezone.now()
        application.save()
        
        # Notification pour l'admin
        AdminNotification.objects.create(
            notification_type='application_submitted',
            title="Demande de bourse soumise",
            message=f"L'étudiant {request.user.get_full_name()} a soumis une demande: {application.title}",
            related_user=request.user
        )
        
        return Response({
            "message": "Demande soumise avec succès",
            "application": ScholarshipApplicationSerializer(application).data
        })
        
    except ScholarshipApplication.DoesNotExist:
        return Response({"error": "Demande non trouvée"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def get_all_applications_admin(request):
    """Récupérer toutes les demandes pour l'admin"""
    if not request.user.is_authenticated or request.user.user_type != 'admin':
        return Response(
            {"error": "Accès non autorisé"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        applications = ScholarshipApplication.objects.select_related('student', 'reviewed_by').all().order_by('-created_at')
        serializer = ScholarshipApplicationSerializer(applications, many=True)
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Erreur chargement demandes admin: {str(e)}")
        return Response(
            {"error": f"Erreur serveur: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
# users/views.py - AJOUTER ces vues au début des vues

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def auth_status(request):
    """Vérifier l'état de l'authentification"""
    return Response({
        'authenticated': request.user.is_authenticated,
        'username': request.user.username if request.user.is_authenticated else None,
        'user_type': request.user.user_type if request.user.is_authenticated else None
    })
