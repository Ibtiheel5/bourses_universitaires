// src/components/Documents.js - AVEC FONCTIONNALITÉ "VOIR"
import React, { useState, useEffect } from 'react';
import api from '../api';
import './Documents.css';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [downloading, setDownloading] = useState({});
  const [viewing, setViewing] = useState({});
  const [documentViewer, setDocumentViewer] = useState({
    isOpen: false,
    document: null,
    fileUrl: null
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/users/documents/');
      setDocuments(response.data);
    } catch (error) {
      setError('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  // FONCTION POUR OUVIR LE DOCUMENT DANS UNE NOUVELLE FENÊTRE
  const handleView = async (documentId, filename, fileUrl) => {
    try {
      setViewing(prev => ({ ...prev, [documentId]: true }));
      setError('');

      console.log('👁️ Tentative d\'ouverture du document:', filename);

      // Construire l'URL complète du fichier
      const fullFileUrl = `http://localhost:8000${fileUrl}`;
      console.log('📄 URL complète:', fullFileUrl);

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

  // FONCTION DE TÉLÉCHARGEMENT
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
      setSuccess(`Fichier "${filename}" téléchargé avec succès!`);

    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      setError(`Échec du téléchargement: ${filename}`);
    } finally {
      setDownloading(prev => ({ ...prev, [documentId]: false }));
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const documentType = event.target.getAttribute('data-type');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/users/documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setSuccess(`Document "${file.name}" uploadé avec succès !`);
      fetchDocuments();
    } catch (error) {
      setError('Erreur lors de l\'upload du document');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = async (documentId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      try {
        await api.delete(`/users/documents/delete/${documentId}/`);
        setSuccess('Document supprimé avec succès');
        fetchDocuments();
      } catch (error) {
        setError('Erreur lors de la suppression du document');
      }
    }
  };

  const documentTypes = [
    { type: 'identity', label: "Pièce d'identité", icon: '🆔', description: "Carte d'identité, passeport" },
    { type: 'academic', label: "Relevé de notes", icon: '📊', description: "Dernier relevé de notes officiel" },
    { type: 'financial', label: "Relevé bancaire", icon: '💰', description: "Relevé des 3 derniers mois" },
    { type: 'residence', label: "Justificatif de domicile", icon: '🏠', description: "Facture récente" },
    { type: 'other', label: "Autre document", icon: '📄', description: "Autres pièces justificatives" },
  ];

  const getDocumentTypeInfo = (type) => {
    return documentTypes.find(doc => doc.type === type) || documentTypes[4];
  };

  const handleRetry = () => {
    fetchDocuments();
  };

  // Fonction pour fermer la visionneuse
  const closeViewer = () => {
    setDocumentViewer({
      isOpen: false,
      document: null,
      fileUrl: null
    });
  };

  return (
    <div className="documents-premium">
      <div className="documents-header">
        <h1>📁 Gestion des Documents</h1>
        <p>Importez et gérez vos pièces justificatives</p>
      </div>

      {error && (
        <div className="documents-error">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <div className="error-message">{error}</div>
            <button className="btn-retry" onClick={handleRetry}>🔄 Réessayer</button>
          </div>
          <button className="btn-close-error" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {success && (
        <div className="documents-success">
          <div className="success-icon">✅</div>
          <div className="success-message">{success}</div>
          <button className="btn-close-success" onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      <section className="upload-section">
        <h2>📤 Importer un nouveau document</h2>
        <div className="upload-grid">
          {documentTypes.map((docType) => (
            <div key={docType.type} className="upload-card">
              <div className="upload-icon">{docType.icon}</div>
              <div className="upload-info">
                <h4>{docType.label}</h4>
                <p>{docType.description}</p>
              </div>
              <label className={`upload-btn ${uploading ? 'uploading' : ''}`}>
                <input
                  type="file"
                  data-type={docType.type}
                  onChange={handleFileUpload}
                  disabled={uploading}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                {uploading ? '📤 Envoi...' : '📎 Choisir'}
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="documents-list-section">
        <div className="section-header">
          <h2>📋 Mes Documents ({documents.length})</h2>
          <button className="btn-refresh" onClick={fetchDocuments} disabled={loading}>
            {loading ? '🔄...' : '🔄 Actualiser'}
          </button>
        </div>

        {loading ? (
          <div className="documents-loading">
            <div className="loading-spinner"></div>
            <p>Chargement de vos documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="no-documents">
            <div className="no-docs-icon">📭</div>
            <h3>Aucun document uploadé</h3>
            <p>Commencez par importer vos documents ci-dessus</p>
          </div>
        ) : (
          <div className="documents-grid">
            {documents.map((doc) => {
              const typeInfo = getDocumentTypeInfo(doc.document_type);
              const isDownloading = downloading[doc.id] || false;
              const isViewing = viewing[doc.id] || false;
              
              return (
                <div key={doc.id} className="document-card">
                  <div className="document-header">
                    <div className="document-icon">{typeInfo.icon}</div>
                    <div className="document-info">
                      <h4>{typeInfo.label}</h4>
                      <p className="document-filename">{doc.original_filename}</p>
                    </div>
                    <div className="document-status">
                      <span className={`status-badge ${doc.is_verified ? 'verified' : 'pending'}`}>
                        {doc.is_verified ? '✅ Vérifié' : '⏳ En attente'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="document-details">
                    <div className="detail-item">
                      <span className="detail-label">Taille:</span>
                      <span className="detail-value">{doc.file_size_display}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Uploadé le:</span>
                      <span className="detail-value">
                        {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {doc.is_verified && doc.verified_by_name && (
                      <div className="detail-item">
                        <span className="detail-label">Vérifié par:</span>
                        <span className="detail-value">{doc.verified_by_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="document-actions">
                    {/* BOUTON VOIR - NOUVEAU */}
                    <button 
                      onClick={() => handleView(doc.id, doc.original_filename, doc.file)}
                      className="btn-action view"
                      disabled={isViewing}
                      title="Voir le document"
                    >
                      {isViewing ? '⏳' : '👁️'} Voir
                    </button>
                    
                    <button 
                      onClick={() => handleDownload(doc.id, doc.original_filename)}
                      className="btn-action download"
                      disabled={isDownloading}
                      title="Télécharger le document"
                    >
                      {isDownloading ? '⏳' : '📥'} Télécharger
                    </button>
                    
                    <button 
                      onClick={() => handleDelete(doc.id)}
                      className="btn-action delete"
                      title="Supprimer le document"
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Visionneuse de document modale (optionnelle) */}
      {documentViewer.isOpen && (
        <div className="document-viewer-modal">
          <div className="viewer-header">
            <h3>{documentViewer.document?.original_filename}</h3>
            <button className="close-viewer" onClick={closeViewer}>✕</button>
          </div>
          <div className="viewer-content">
            <iframe 
              src={documentViewer.fileUrl} 
              title={documentViewer.document?.original_filename}
              className="document-frame"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;