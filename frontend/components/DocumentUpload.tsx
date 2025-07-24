import React, { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as DocumentIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { GenAIService } from '../services/genaiService';
import { useAuth } from '../context/AuthContext';
import type { DocumentInfo } from '../types';

interface DocumentUploadProps {
  onDocumentUploaded?: (document: DocumentInfo) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onDocumentUploaded }) => {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadDocuments = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const docs = await GenAIService.listDocuments(token);
      setDocuments(docs);
    } catch (err) {
      setError('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadDocuments();
  }, [token]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await GenAIService.uploadDocument(file, token);
      setSuccess(`Document "${result.filename}" uploaded successfully! Indexed ${result.indexed_chunks} chunks.`);
      
      if (onDocumentUploaded) {
        onDocumentUploaded({
          id: result.document_id,
          filename: result.filename,
          file_type: file.type,
          uploaded_at: new Date().toISOString()
        });
      }
      
      // Refresh document list
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeColor = (fileType: string) => {
    if (fileType.includes('pdf')) return 'error';
    if (fileType.includes('text')) return 'primary';
    if (fileType.includes('image')) return 'secondary';
    return 'default';
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <UploadIcon color="primary" />
        <Typography variant="h6" color="primary">
          Document Management
        </Typography>
        <IconButton size="small" onClick={loadDocuments} disabled={isLoading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Upload documents (PDF, TXT, images) to enhance AI responses with your research content.
      </Typography>

      {/* Upload Section */}
      <Box sx={{ mb: 3 }}>
        <input
          accept=".pdf,.txt,.png,.jpg,.jpeg"
          style={{ display: 'none' }}
          id="document-upload"
          type="file"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        <label htmlFor="document-upload">
          <Button
            variant="contained"
            component="span"
            startIcon={<UploadIcon />}
            disabled={isUploading || !token}
            sx={{ mb: 2 }}
          >
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </label>

        {isUploading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
            <Typography variant="caption" color="text.secondary">
              Processing document and creating searchable index...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Status Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Document List */}
      <Typography variant="subtitle2" gutterBottom>
        Uploaded Documents ({documents.length})
      </Typography>

      {isLoading ? (
        <LinearProgress sx={{ mb: 2 }} />
      ) : documents.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          No documents uploaded yet. Upload documents to improve AI responses.
        </Typography>
      ) : (
        <List dense>
          {documents.map((doc) => (
            <ListItem key={doc.id} divider>
              <ListItemIcon>
                <DocumentIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={doc.filename}
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Chip
                      label={doc.file_type.split('/')[1]?.toUpperCase() || 'FILE'}
                      size="small"
                      color={getFileTypeColor(doc.file_type)}
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
        <Typography variant="caption" color="info.main">
          💡 Tip: Uploaded documents are automatically indexed and will be used to provide 
          more accurate and contextual responses in the AI chat and Q&A features.
        </Typography>
      </Box>
    </Paper>
  );
};

export default DocumentUpload;