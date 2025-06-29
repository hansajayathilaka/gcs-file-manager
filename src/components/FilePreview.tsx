'use client';

import { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  ArrowDownTrayIcon, 
  DocumentTextIcon,
  PlayIcon,
  PhotoIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { FileTreeItem } from '@/types/fileSystem';

interface FilePreviewProps {
  isOpen: boolean;
  file: FileTreeItem | null;
  bucket: string;
  onClose: () => void;
  onDownload: (file: FileTreeItem) => void;
}

export default function FilePreview({
  isOpen,
  file,
  bucket,
  onClose,
  onDownload,
}: FilePreviewProps) {
  const { user } = useAuth();
  const [previewData, setPreviewData] = useState<{
    url?: string;
    content?: string;
    error?: string;
  }>({});
  const [loading, setLoading] = useState(false);
  const [additionalMetadata, setAdditionalMetadata] = useState<any>(null);

  useEffect(() => {
    if (isOpen && file && !file.isFolder) {
      loadPreview();
      loadAdditionalMetadata();
    } else {
      setPreviewData({});
      setAdditionalMetadata(null);
    }
  }, [isOpen, file]);

  const loadPreview = async () => {
    if (!file) return;
    
    setLoading(true);
    setPreviewData({});

    try {
      const fileType = getFileType(file.name);
      
      // Use the new preview API
      if (!user) throw new Error('Not authenticated');
      
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Not authenticated');
      
      const token = await currentUser.getIdToken();
      const headers = { 'Authorization': `Bearer ${token}` };

      if (fileType.category === 'image' || fileType.category === 'video' || fileType.category === 'audio') {
        // For media files, get a download URL for preview
        const url = new URL('/api/preview', window.location.origin);
        url.searchParams.append('bucket', bucket);
        url.searchParams.append('file', file.storedPath || file.path);
        url.searchParams.append('type', 'content');

        const response = await fetch(url.toString(), { headers });
        const data = await response.json();
        
        if (data.success && data.downloadUrl) {
          // Fetch the actual file using the download URL with auth headers
          const fileResponse = await fetch(data.downloadUrl, { headers });
          if (fileResponse.ok) {
            const blob = await fileResponse.blob();
            const objectUrl = URL.createObjectURL(blob);
            setPreviewData({ url: objectUrl });
          } else {
            throw new Error('Failed to fetch file content');
          }
        } else {
          throw new Error('Failed to get download URL');
        }
      } else if (fileType.category === 'text' && file.size && file.size < 1024 * 1024) { // Only preview text files < 1MB
        // For text files, fetch content using the preview API
        const url = new URL('/api/preview', window.location.origin);
        url.searchParams.append('bucket', bucket);
        url.searchParams.append('file', file.storedPath || file.path);
        url.searchParams.append('type', 'content');

        const response = await fetch(url.toString(), { headers });
        const data = await response.json();
        
        if (data.success && data.content) {
          setPreviewData({ content: data.content });
        } else {
          throw new Error('Failed to get text content');
        }
      } else {
        // For other files, just show metadata
        setPreviewData({});
      }
    } catch (error) {
      console.error('Error loading preview:', error);
      setPreviewData({ error: 'Failed to load preview' });
    } finally {
      setLoading(false);
    }
  };

  const loadAdditionalMetadata = async () => {
    if (!file || !user) return;
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      const token = await currentUser.getIdToken();
      const headers = { 'Authorization': `Bearer ${token}` };

      const url = new URL('/api/preview', window.location.origin);
      url.searchParams.append('bucket', bucket);
      url.searchParams.append('file', file.storedPath || file.path);
      url.searchParams.append('type', 'metadata');

      const response = await fetch(url.toString(), { headers });
      const data = await response.json();
      
      if (data.success && data.metadata) {
        setAdditionalMetadata(data.metadata);
      }
    } catch (error) {
      console.error('Error loading additional metadata:', error);
    }
  };

  const getFileType = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'];
    const videoTypes = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v'];
    const audioTypes = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'];
    const textTypes = ['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'ts', 'jsx', 'tsx', 'yml', 'yaml', 'csv', 'log'];
    const documentTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    const codeTypes = ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'swift'];

    if (imageTypes.includes(extension)) {
      return { category: 'image', type: extension, description: 'Image file' };
    } else if (videoTypes.includes(extension)) {
      return { category: 'video', type: extension, description: 'Video file' };
    } else if (audioTypes.includes(extension)) {
      return { category: 'audio', type: extension, description: 'Audio file' };
    } else if (textTypes.includes(extension) || codeTypes.includes(extension)) {
      return { category: 'text', type: extension, description: codeTypes.includes(extension) ? 'Code file' : 'Text file' };
    } else if (documentTypes.includes(extension)) {
      return { category: 'document', type: extension, description: 'Document file' };
    } else {
      return { category: 'other', type: extension, description: 'File' };
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderPreview = () => {
    if (!file) return null;

    const fileType = getFileType(file.name);

    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    if (previewData.error) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <DocumentIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>{previewData.error}</p>
          </div>
        </div>
      );
    }

    if (fileType.category === 'image' && previewData.url) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-50 rounded">
          <img 
            src={previewData.url} 
            alt={file.name}
            className="max-w-full max-h-full object-contain rounded"
          />
        </div>
      );
    }

    if (fileType.category === 'video' && previewData.url) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-50 rounded">
          <video 
            src={previewData.url} 
            controls 
            className="max-w-full max-h-full rounded"
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (fileType.category === 'audio' && previewData.url) {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded p-4">
          <div className="text-center mb-3">
            <PlayIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 truncate">{file.name}</p>
          </div>
          <audio 
            src={previewData.url} 
            controls 
            className="w-full"
            preload="metadata"
          >
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    if (fileType.category === 'text' && previewData.content) {
      return (
        <div className="h-full bg-gray-50 rounded p-3 overflow-hidden">
          <pre className="text-xs overflow-auto h-full whitespace-pre-wrap font-mono">
            {previewData.content}
          </pre>
        </div>
      );
    }

    // Default preview for unsupported files
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded">
        <div className="text-center text-gray-500">
          <DocumentIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-medium">{fileType.description}</p>
          <p className="text-xs">Preview not available</p>
        </div>
      </div>
    );
  };

  if (!isOpen || !file) return null;

  const fileType = getFileType(file.name);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className="flex-shrink-0">
            {fileType.category === 'image' && <PhotoIcon className="h-5 w-5 text-green-500" />}
            {fileType.category === 'video' && <PlayIcon className="h-5 w-5 text-blue-500" />}
            {fileType.category === 'audio' && <PlayIcon className="h-5 w-5 text-purple-500" />}
            {fileType.category === 'text' && <DocumentTextIcon className="h-5 w-5 text-orange-500" />}
            {(fileType.category === 'document' || fileType.category === 'other') && <DocumentIcon className="h-5 w-5 text-gray-500" />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-gray-900 truncate">
              {file.originalName || file.name}
            </h2>
            <p className="text-xs text-gray-500">{fileType.description}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 focus:outline-none flex-shrink-0"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Content - Split Layout */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Preview Area */}
        <div className="p-4 border-b border-gray-200">
          <div className="h-48 overflow-hidden">
            {renderPreview()}
          </div>
        </div>

        {/* Metadata Section */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-900 mb-3">File Details</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700">Name</label>
              <p className="mt-1 text-xs text-gray-900 break-all">{file.originalName || file.name}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700">Type</label>
              <p className="mt-1 text-xs text-gray-900">{fileType.type.toUpperCase()} {fileType.description}</p>
            </div>

            {file.size && (
              <div>
                <label className="block text-xs font-medium text-gray-700">Size</label>
                <p className="mt-1 text-xs text-gray-900">{formatFileSize(file.size)}</p>
              </div>
            )}

            {file.modified && (
              <div>
                <label className="block text-xs font-medium text-gray-700">Last Modified</label>
                <p className="mt-1 text-xs text-gray-900">{formatDate(file.modified)}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700">Location</label>
              <p className="mt-1 text-xs text-gray-900 break-all">
                {bucket}/{file.path}
              </p>
            </div>

            {file.storedPath && file.storedPath !== file.path && (
              <div>
                <label className="block text-xs font-medium text-gray-700">Stored As</label>
                <p className="mt-1 text-xs text-gray-600 break-all">{file.storedPath}</p>
              </div>
            )}

            {file.contentType && (
              <div>
                <label className="block text-xs font-medium text-gray-700">MIME Type</label>
                <p className="mt-1 text-xs text-gray-900">{file.contentType}</p>
              </div>
            )}

            {previewData.url && (
              <div>
                <label className="block text-xs font-medium text-gray-700">Preview</label>
                <p className="mt-1 text-xs text-gray-600">Loaded successfully</p>
              </div>
            )}

            {/* Additional metadata from GCS */}
            {additionalMetadata && (
              <>
                {additionalMetadata.timeCreated && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-xs text-gray-900">{formatDate(additionalMetadata.timeCreated)}</p>
                  </div>
                )}

                {additionalMetadata.md5Hash && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">MD5 Hash</label>
                    <p className="mt-1 text-xs text-gray-600 font-mono break-all">{additionalMetadata.md5Hash}</p>
                  </div>
                )}

                {additionalMetadata.generation && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Generation</label>
                    <p className="mt-1 text-xs text-gray-900">{additionalMetadata.generation}</p>
                  </div>
                )}

                {additionalMetadata.customMetadata && Object.keys(additionalMetadata.customMetadata).length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Custom Metadata</label>
                    <div className="mt-1 space-y-1">
                      {Object.entries(additionalMetadata.customMetadata).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          <span className="font-medium text-gray-600">{key}:</span>
                          <span className="text-gray-900 ml-1">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 space-y-2">
            <button
              onClick={() => onDownload(file)}
              className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Download File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
