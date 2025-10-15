# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import os

class CustomUser(AbstractUser):
    USER_TYPE_CHOICES = (
        ('student', 'Étudiant'),
        ('admin', 'Administrateur'),
    )
    
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='student')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name='customuser_set',
        related_query_name='user',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name='customuser_set',
        related_query_name='user',
    )

    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"

class EligibilityRule(models.Model):
    RULE_TYPE_CHOICES = (
        ('academic', 'Académique'),
        ('financial', 'Financière'),
        ('administrative', 'Administrative'),
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    rule_type = models.CharField(max_length=20, choices=RULE_TYPE_CHOICES, default='academic')
    criteria = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='created_rules')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title} ({self.get_rule_type_display()})"

class StudentDocument(models.Model):
    DOCUMENT_TYPE_CHOICES = (
        ('identity', "Pièce d'identité"),
        ('academic', "Relevé de notes"),
        ('financial', "Relevé bancaire"),
        ('residence', "Justificatif de domicile"),
        ('other', "Autre"),
    )
    
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES)
    file = models.FileField(upload_to='student_documents/%Y/%m/%d/')
    original_filename = models.CharField(max_length=255)
    file_size = models.IntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_documents')
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'users_studentdocument'
    
    def __str__(self):
        return f"{self.student.username} - {self.get_document_type_display()}"
    
    def get_file_size_display(self):
        """Retourne la taille du fichier formatée"""
        if self.file_size < 1024:
            return f"{self.file_size} B"
        elif self.file_size < 1024 * 1024:
            return f"{self.file_size / 1024:.1f} KB"
        else:
            return f"{self.file_size / (1024 * 1024):.1f} MB"
    
    def delete(self, *args, **kwargs):
        """Supprime le fichier physique lors de la suppression de l'objet"""
        if self.file:
            if os.path.isfile(self.file.path):
                os.remove(self.file.path)
        super().delete(*args, **kwargs)

class AdminNotification(models.Model):
    NOTIFICATION_TYPES = (
        ('document_upload', 'Nouveau document uploadé'),
        ('application_submitted', 'Nouvelle demande soumise'),
        ('system_alert', 'Alerte système'),
        ('user_registered', 'Nouvel utilisateur inscrit'),
    )
    
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    related_document = models.ForeignKey(StudentDocument, on_delete=models.CASCADE, null=True, blank=True)
    related_user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_notification_type_display()} - {self.title}"

class ScholarshipApplication(models.Model):
    APPLICATION_STATUS_CHOICES = [
        ('draft', 'Brouillon'),
        ('submitted', 'Soumise'),
        ('under_review', 'En cours d\'examen'),
        ('approved', 'Approuvée'),
        ('rejected', 'Rejetée'),
        ('needs_info', 'Informations requises'),
    ]
    
    SCHOLARSHIP_TYPES = [
        ('merit', 'Bourse au Mérite'),
        ('social', 'Bourse sur Critères Sociaux'),
        ('excellence', 'Bourse d\'Excellence'),
        ('sport', 'Bourse Sportive'),
        ('international', 'Bourse Internationale'),
        ('research', 'Bourse de Recherche'),
    ]

    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='applications')
    scholarship_type = models.CharField(max_length=20, choices=SCHOLARSHIP_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    amount_requested = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=APPLICATION_STATUS_CHOICES, default='draft')
    
    # Documents associés
    required_documents = models.ManyToManyField(StudentDocument, blank=True)
    
    # Dates importantes
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    decision_date = models.DateTimeField(null=True, blank=True)
    
    # Informations de décision
    decision_notes = models.TextField(blank=True)
    final_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    reviewed_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_applications')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Demande de bourse'
        verbose_name_plural = 'Demandes de bourse'

    def __str__(self):
        return f"{self.student.username} - {self.get_scholarship_type_display()}"

    def save(self, *args, **kwargs):
        if self.status == 'submitted' and not self.submitted_at:
            self.submitted_at = timezone.now()
        if self.status in ['approved', 'rejected'] and not self.decision_date:
            self.decision_date = timezone.now()
        super().save(*args, **kwargs)

    def get_status_color(self):
        status_colors = {
            'draft': 'secondary',
            'submitted': 'info',
            'under_review': 'warning',
            'approved': 'success',
            'rejected': 'danger',
            'needs_info': 'primary',
        }
        return status_colors.get(self.status, 'secondary')

    def can_be_edited(self):
        return self.status in ['draft', 'needs_info']

    def can_be_submitted(self):
        return self.status in ['draft', 'needs_info']

class StudentNotification(models.Model):
    NOTIFICATION_TYPES = [
        ('document_verified', 'Document Vérifié'),
        ('document_rejected', 'Document Rejeté'),
        ('application_approved', 'Demande Approuvée'),
        ('application_rejected', 'Demande Rejetée'),
        ('application_under_review', 'Demande en Examen'),
        ('system_alert', 'Alerte Système'),
        ('deadline_reminder', 'Rappel Date Limite'),
        ('info_request', 'Demande d\'Information'),
    ]

    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Liens optionnels
    related_document = models.ForeignKey(StudentDocument, on_delete=models.SET_NULL, null=True, blank=True)
    related_application = models.ForeignKey('ScholarshipApplication', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Statut
    is_read = models.BooleanField(default=False)
    is_important = models.BooleanField(default=False)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification Étudiant'
        verbose_name_plural = 'Notifications Étudiant'

    def __str__(self):
        return f"{self.student.username} - {self.title}"

    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()

    def get_icon(self):
        icons = {
            'document_verified': '✅',
            'document_rejected': '❌',
            'application_approved': '🎓',
            'application_rejected': '📝',
            'application_under_review': '🔍',
            'system_alert': '🔔',
            'deadline_reminder': '⏰',
            'info_request': 'ℹ️',
        }
        return icons.get(self.notification_type, '🔔')

    @classmethod
    def create_document_notification(cls, student, notification_type, title, message, related_document=None, is_important=False):
        """
        Créer une notification pour l'étudiant concernant un document
        """
        notification = cls.objects.create(
            student=student,
            notification_type=notification_type,
            title=title,
            message=message,
            related_document=related_document,
            is_important=is_important
        )
        return notification