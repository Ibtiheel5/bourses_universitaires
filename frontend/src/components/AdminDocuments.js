// src/components/AdminDocuments.js - CORRECTION COMPLÈTE
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './AdminDocuments.css';

const AdminDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [viewing, setViewing] = useState({});
  const [downloading, setDownloading] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Chargement des documents admin...');
      
      const response = await api.get('/users/admin/documents/');
      console.log('✅ Données reçues:', response.data);
      
      setDocuments(response.data);
    } catch (error) {
      console.error('❌ Erreur chargement documents:', error);
      setError('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  // FONCTION POUR OUVIR/VOIR LE DOCUMENT
  const handleView = async (documentId, filename, fileUrl) => {
    try {
      setViewing(prev => ({ ...prev, [documentId]: true }));
      setError('');

      console.log('👁️ Tentative d\'ouverture du document:', filename);
      console.log('📄 URL du fichier:', fileUrl);

      // Construire l'URL complète du fichier
      const fullFileUrl = `http://localhost:8000${fileUrl}`;
      console.log('🔗 URL complète:', fullFileUrl);

      // Ouvrir dans un nouvel onglet
      window.open(fullFileUrl, '_blank', 'noopener,noreferrer');

      console.log('✅ Document ouvert avec succès!');
      
    } catch (error) {
      console.error('❌ Erreur ouverture document:', error);
      
      // Fallback: Téléchargement si l'ouverture échoue
      try {
        console.log('🔄 Tentative de téléchargement comme fallback...');
        await handleDownload(documentId, filename);
      } catch (downloadError) {
        console.error('❌ Les deux méthodes ont échoué:', downloadError);
        setError(`Impossible d'ouvrir le document: ${filename}`);
      }
    } finally {
      setViewing(prev => ({ ...prev, [documentId]: false }));
    }
  };

  // FONCTION POUR TÉLÉCHARGER LE DOCUMENT - CORRIGÉE
  const handleDownload = async (documentId, filename) => {
    try {
      setDownloading(prev => ({ ...prev, [documentId]: true }));
      setError('');

      console.log(`📥 Début du téléchargement: ${filename}`);

      const response = await api.get(`/users/documents/download/${documentId}/`, {
        responseType: 'blob',
        timeout: 30000
      });

      console.log('✅ Réponse reçue, création du blob...');

      // Créer un blob URL
      const blob = new Blob([response.data]);
      const blobUrl = window.URL.createObjectURL(blob);

      // Créer un lien invisible pour le téléchargement
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';

      // Ajouter au DOM et cliquer
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Nettoyer le blob URL
      window.URL.revokeObjectURL(blobUrl);

      console.log('✅ Téléchargement terminé avec succès!');
      
    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      setError(`Échec du téléchargement: ${filename}`);
      throw error; // Important: propager l'erreur pour le fallback
    } finally {
      setDownloading(prev => ({ ...prev, [documentId]: false }));
    }
  };

  // FONCTION POUR LES ICÔNES
  const getDocumentIcon = (documentType) => {
    console.log('📄 Type de document:', documentType);
    switch (documentType) {
      case 'identity': return '🆔';
      case 'academic': return '📚';
      case 'financial': return '💰';
      case 'residence': return '🏠';
      default: return '📄';
    }
  };

  // FONCTION POUR LES LABELS
  const getDocumentTypeLabel = (documentType) => {
    switch (documentType) {
      case 'identity': return "Pièce d'identité";
      case 'academic': return "Relevé de notes";
      case 'financial': return "Relevé bancaire";
      case 'residence': return "Justificatif de domicile";
      default: return "Autre document";
    }
  };

  // FONCTION POUR OBTENIR LE NOM AFFICHABLE
  const getDisplayType = (document) => {
    if (document.document_type_display) {
      return document.document_type_display;
    }
    if (document.document_type) {
      return getDocumentTypeLabel(document.document_type);
    }
    return "Document";
  };

  const handleVerify = async (documentId) => {
    try {
      await api.post(`/users/admin/documents/${documentId}/verify/`);
      await loadDocuments();
      alert('✅ Document vérifié avec succès!');
    } catch (error) {
      console.error('❌ Erreur vérification:', error);
      alert('❌ Erreur lors de la vérification');
    }
  };

  const handleReject = async (documentId) => {
    if (!rejectReason.trim()) {
      alert('Veuillez saisir une raison de rejet');
      return;
    }

    try {
      await api.post(`/users/admin/documents/${documentId}/reject/`, {
        reason: rejectReason
      });
      await loadDocuments();
      setShowRejectModal(false);
      setSelectedDocument(null);
      setRejectReason('');
      alert('✅ Document rejeté avec succès!');
    } catch (error) {
      console.error('❌ Erreur rejet:', error);
      alert('❌ Erreur lors du rejet');
    }
  };

  const openRejectModal = (document) => {
    setSelectedDocument(document);
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedDocument(null);
    setRejectReason('');
  };

  const filteredDocuments = documents.filter(doc => {
    if (filter === 'verified') return doc.is_verified;
    if (filter === 'unverified') return !doc.is_verified;
    return true;
  });

  // FONCTION POUR FORMATER LA TAILLE DES FICHIERS
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // COMPOSANT DOCUMENT CARD AVEC BOUTON "VOIR"
  const DocumentCard = ({ document }) => {
    const documentIcon = getDocumentIcon(document.document_type);
    const documentTypeLabel = getDisplayType(document);
    const isViewing = viewing[document.id] || false;
    const isDownloading = downloading[document.id] || false;

    return (
      <div className={`admin-document-card ${document.is_verified ? 'verified' : 'unverified'}`}>
        <div className="document-header">
          <div className="document-type">
            <span className="type-icon">
              {documentIcon}
            </span>
            <span className="type-label">
              {documentTypeLabel}
            </span>
          </div>
          <div className={`verification-status ${document.is_verified ? 'verified' : 'pending'}`}>
            {document.is_verified ? '✅ Vérifié' : '⏳ En attente'}
          </div>
        </div>

        <div className="document-info">
          <div className="student-info">
            <strong>Étudiant:</strong> {document.student_name || 'Non spécifié'}
          </div>
          <div className="file-info">
            <strong>Fichier:</strong> {document.original_filename}
          </div>
          <div className="size-info">
            <strong>Taille:</strong> {document.file_size_display || formatFileSize(document.file_size)}
          </div>
          <div className="date-info">
            <strong>Uploadé:</strong> {new Date(document.uploaded_at).toLocaleDateString('fr-FR')}
          </div>
          {document.is_verified && document.verified_by_name && (
            <div className="verifier-info">
              <strong>Vérifié par:</strong> {document.verified_by_name}
            </div>
          )}
        </div>

        <div className="document-actions">
          {/* BOUTON VOIR */}
          <button 
            className="btn-view"
            onClick={() => handleView(document.id, document.original_filename, document.file)}
            disabled={isViewing}
            title="Voir le document"
          >
            {isViewing ? '⏳' : '👁️'} Voir
          </button>
          
          {/* BOUTON TÉLÉCHARGER */}
          <button 
            className="btn-download"
            onClick={() => handleDownload(document.id, document.original_filename)}
            disabled={isDownloading}
            title="Télécharger le document"
          >
            {isDownloading ? '⏳' : '📥'} Télécharger
          </button>
          
          {!document.is_verified && (
            <>
              <button 
                className="btn-verify"
                onClick={() => handleVerify(document.id)}
                title="Marquer comme vérifié"
              >
                ✅ Approuver
              </button>
              <button 
                className="btn-reject"
                onClick={() => openRejectModal(document)}
                title="Rejeter le document"
              >
                ❌ Rejeter
              </button>
            </>
          )}
          
          {document.is_verified && (
            <button className="btn-verified" disabled>
              ✅ Document vérifié
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-documents-loading">
        <div className="loading-content">
          <div className="loading-icon">📁</div>
          <h2>Chargement des documents...</h2>
          <p>Récupération des documents étudiants</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-documents-error">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <div>
            <h3>Erreur de chargement</h3>
            <p>{error}</p>
            <button className="btn-retry" onClick={loadDocuments}>
              🔄 Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-documents-container">
      {/* Header */}
      <header className="admin-documents-header">
        <div className="header-content">
          <h1>📁 Gestion des Documents</h1>
          <p>Vérification et validation des documents étudiants</p>
        </div>
        <button 
          className="btn-back"
          onClick={() => navigate('/admin')}
        >
          ← Retour au Dashboard
        </button>
      </header>

      {/* Statistics */}
      <div className="documents-stats">
        <div className="stat-card">
          <span className="stat-number">{documents.length}</span>
          <span className="stat-label">Total Documents</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {documents.filter(d => d.is_verified).length}
          </span>
          <span className="stat-label">Vérifiés</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {documents.filter(d => !d.is_verified).length}
          </span>
          <span className="stat-label">En Attente</span>
        </div>
      </div>

      {/* Filters */}
      <div className="documents-filters">
        <h3>Filtres:</h3>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            📋 Tous les documents ({documents.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'unverified' ? 'active' : ''}`}
            onClick={() => setFilter('unverified')}
          >
            ⏳ En attente ({documents.filter(d => !d.is_verified).length})
          </button>
          <button 
            className={`filter-btn ${filter === 'verified' ? 'active' : ''}`}
            onClick={() => setFilter('verified')}
          >
            ✅ Vérifiés ({documents.filter(d => d.is_verified).length})
          </button>
        </div>
      </div>

      {/* Documents List */}
      <div className="documents-grid">
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map(document => (
            <DocumentCard key={document.id} document={document} />
          ))
        ) : (
          <div className="no-documents">
            <div className="no-documents-icon">📭</div>
            <h3>Aucun document trouvé</h3>
            <p>Aucun document ne correspond aux filtres sélectionnés</p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="reject-modal">
            <div className="modal-header">
              <h3>❌ Rejeter le document</h3>
              <button className="close-modal" onClick={closeRejectModal}>×</button>
            </div>
            <div className="modal-content">
              <p>
                Vous êtes sur le point de rejeter le document de <strong>{selectedDocument?.student_name}</strong>
              </p>
              <p>
                <strong>Type:</strong> {getDisplayType(selectedDocument)}
              </p>
              <p>
                <strong>Fichier:</strong> {selectedDocument?.original_filename}
              </p>
              
              <div className="reject-reason">
                <label htmlFor="rejectReason">Raison du rejet:</label>
                <textarea
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Expliquez pourquoi ce document est rejeté..."
                  rows="4"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={closeRejectModal}>
                Annuler
              </button>
              <button 
                className="btn-confirm-reject"
                onClick={() => handleReject(selectedDocument.id)}
                disabled={!rejectReason.trim()}
              >
                ❌ Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDocuments;