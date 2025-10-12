from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import login, logout, authenticate
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token
from .models import CustomUser
from .serializers import UserSerializer, UserCreateSerializer
import logging

logger = logging.getLogger(__name__)

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
            # Connexion automatique après inscription
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
        
        # Authentification
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
    print(f"🔍 Vérification utilisateur: {request.user}, authentifié: {request.user.is_authenticated}")
    
    if not request.user.is_authenticated:
        print("❌ Utilisateur non authentifié")
        return Response({"error": "Non authentifié"}, status=status.HTTP_401_UNAUTHORIZED)
    
    print(f"✅ Utilisateur authentifié: {request.user.username}")
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

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

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@ensure_csrf_cookie
def get_csrf_token(request):
    """Obtenir le token CSRF"""
    return Response({
        "message": "CSRF cookie set",
        "csrfToken": get_token(request)
    })

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def auth_status(request):
    """Vérifier l'état de l'authentification"""
    return Response({
        'authenticated': request.user.is_authenticated,
        'username': request.user.username if request.user.is_authenticated else None,
        'user_type': request.user.user_type if request.user.is_authenticated else None
    })