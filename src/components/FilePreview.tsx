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
    previewAvailable?: boolean;
  }>({});
  const [loading, setLoading] = useState(false);
  const [additionalMetadata, setAdditionalMetadata] = useState<any>(null);

  useEffect(() => {
    if (isOpen && file && !file.isFolder) {
      loadPreview();
      loadAdditionalMetadata();
    } else {
      // Clean up any object URLs
      if (previewData.url && previewData.url.startsWith('blob:')) {
        URL.revokeObjectURL(previewData.url);
      }
      setPreviewData({});
      setAdditionalMetadata(null);
    }

    // Cleanup function
    return () => {
      if (previewData.url && previewData.url.startsWith('blob:')) {
        URL.revokeObjectURL(previewData.url);
      }
    };
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

      if (fileType.category === 'image' || fileType.category === 'audio') {
        // For images and audio, get a download URL for preview (these are typically smaller)
        const url = new URL('/api/preview', window.location.origin);
        url.searchParams.append('bucket', bucket);
        url.searchParams.append('file', file.storedPath || file.path);
        url.searchParams.append('type', 'content');

        const response = await fetch(url.toString(), { headers });
        const data = await response.json();
        
        if (data.success) {
          if (data.previewAvailable && data.downloadUrl) {
            // Fetch the actual file using the download URL with auth headers
            const fileResponse = await fetch(data.downloadUrl, { headers });
            if (fileResponse.ok) {
              const blob = await fileResponse.blob();
              const objectUrl = URL.createObjectURL(blob);
              setPreviewData({ url: objectUrl, previewAvailable: true });
            } else {
              throw new Error('Failed to fetch file content');
            }
          } else {
            setPreviewData({ previewAvailable: false, error: 'Preview not available for this file type' });
          }
        } else {
          throw new Error('Failed to get download URL');
        }
      } else if (fileType.category === 'video') {
        // For videos, use a streaming URL with auth token
        try {
          if (!user) throw new Error('Not authenticated');
          
          const currentUser = auth.currentUser;
          if (!currentUser) throw new Error('Not authenticated');
          
          const token = await currentUser.getIdToken();
          
          // Create streaming URL with token as query parameter
          const streamUrl = `/api/stream?bucket=${encodeURIComponent(bucket)}&file=${encodeURIComponent(file.storedPath || file.path)}&token=${encodeURIComponent(token)}`;
          
          // Use the streaming URL directly - no blob creation needed
          setPreviewData({ url: streamUrl, previewAvailable: true });
        } catch (error) {
          console.error('Error setting up video stream:', error);
          setPreviewData({ previewAvailable: false, error: 'Video streaming not available' });
        }
      } else if (fileType.category === 'text' && file.size && file.size < 1024 * 1024) { // Only preview text files < 1MB
        // For text files, fetch content using the preview API
        const url = new URL('/api/preview', window.location.origin);
        url.searchParams.append('bucket', bucket);
        url.searchParams.append('file', file.storedPath || file.path);
        url.searchParams.append('type', 'content');

        const response = await fetch(url.toString(), { headers });
        const data = await response.json();
        
        if (data.success) {
          if (data.previewAvailable && data.content) {
            setPreviewData({ content: data.content, previewAvailable: true });
          } else {
            setPreviewData({ previewAvailable: false, error: 'Text preview not available' });
          }
        } else {
          throw new Error('Failed to get text content');
        }
      } else {
        // For other files, check if preview is available via API
        const url = new URL('/api/preview', window.location.origin);
        url.searchParams.append('bucket', bucket);
        url.searchParams.append('file', file.storedPath || file.path);
        url.searchParams.append('type', 'content');

        const response = await fetch(url.toString(), { headers });
        const data = await response.json();
        
        if (data.success) {
          setPreviewData({ previewAvailable: data.previewAvailable || false });
        } else {
          setPreviewData({ previewAvailable: false });
        }
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

    if (previewData.error || ('previewAvailable' in previewData && previewData.previewAvailable === false)) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-600">
          <div className="text-center">
            <DocumentIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-sm font-medium text-gray-800">
              {previewData.error || 'Preview not available'}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {'previewAvailable' in previewData && previewData.previewAvailable === false
                ? 'This file type is not supported for preview' 
                : 'Unable to load preview content'
              }
            </p>
          </div>
        </div>
      );
    }

    // Check if preview is available or if we have content to show
    const hasPreviewContent = previewData.url || previewData.content;
    const isPreviewExplicitlyUnavailable = 'previewAvailable' in previewData && previewData.previewAvailable === false;
    
    if (isPreviewExplicitlyUnavailable || (!hasPreviewContent && !loading && previewData.previewAvailable !== true)) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-50 rounded">
          <div className="text-center text-gray-600">
            <DocumentIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-800">{fileType.description}</p>
            <p className="text-xs text-gray-600">Preview not supported</p>
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
      // Show warning for large video files
      const isLargeFile = file.size && file.size > 100 * 1024 * 1024; // 100MB
      
      return (
        <div className="h-full flex flex-col bg-gray-50 rounded">
          {isLargeFile && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-t p-2 text-xs text-yellow-800">
              <span className="font-medium">Large file:</span> Video is streaming - playback will start as data loads
            </div>
          )}
          <div className="flex-1 flex items-center justify-center">
            <video 
              src={previewData.url} 
              controls 
              className="max-w-full max-h-full rounded"
              preload="metadata"
              crossOrigin="anonymous"
              style={{ maxHeight: '100%', maxWidth: '100%' }}
              onLoadStart={() => console.log('Video loading started')}
              onCanPlay={() => console.log('Video can start playing')}
              onError={(e) => {
                console.error('Video error:', e);
                setPreviewData(prev => ({ ...prev, error: 'Video playback failed' }));
              }}
              onWaiting={() => console.log('Video buffering...')}
              onPlaying={() => console.log('Video playing')}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      );
    }

    if (fileType.category === 'audio' && previewData.url) {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded p-4">
          <div className="text-center mb-3">
            <PlayIcon className="h-12 w-12 mx-auto text-gray-500 mb-2" />
            <p className="text-sm text-gray-800 truncate font-medium">{file.name}</p>
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
        <div className="h-full bg-white border border-gray-300 rounded p-4 overflow-hidden">
          <pre className="text-sm text-gray-800 overflow-auto h-full whitespace-pre-wrap font-mono leading-relaxed bg-gray-50 p-3 rounded border">
            {previewData.content}
          </pre>
        </div>
      );
    }

    // Default preview for unsupported files
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded">
        <div className="text-center text-gray-600">
          <DocumentIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium text-gray-800">{fileType.description}</p>
          <p className="text-xs text-gray-600">Preview not available</p>
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
              {file.name}
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
              <label className="block text-xs font-semibold text-gray-800">Name</label>
              <p className="mt-1 text-sm text-gray-800 break-all font-medium">{file.name}</p>
            </div>

            {file.originalName && file.originalName !== file.name && (
              <div>
                <label className="block text-xs font-semibold text-gray-800">Original Name</label>
                <p className="mt-1 text-sm text-gray-500 break-all">{file.originalName}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-800">Type</label>
              <p className="mt-1 text-sm text-gray-800 font-medium">{fileType.type.toUpperCase()} {fileType.description}</p>
            </div>

            {file.size && (
              <div>
                <label className="block text-xs font-semibold text-gray-800">Size</label>
                <p className="mt-1 text-sm text-gray-800 font-medium">{formatFileSize(file.size)}</p>
              </div>
            )}

            {file.modified && (
              <div>
                <label className="block text-xs font-semibold text-gray-800">Last Modified</label>
                <p className="mt-1 text-sm text-gray-800 font-medium">{formatDate(file.modified)}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-800">Location</label>
              <p className="mt-1 text-sm text-gray-800 break-all font-medium">
                {bucket}/{file.path}
              </p>
            </div>

            {file.storedPath && file.storedPath !== file.path && (
              <div>
                <label className="block text-xs font-semibold text-gray-800">Stored As</label>
                <p className="mt-1 text-sm text-gray-700 break-all">{file.storedPath}</p>
              </div>
            )}

            {file.contentType && (
              <div>
                <label className="block text-xs font-semibold text-gray-800">MIME Type</label>
                <p className="mt-1 text-sm text-gray-800 font-medium">{file.contentType}</p>
              </div>
            )}

            {(previewData.url || previewData.content || previewData.previewAvailable !== undefined) && (
              <div>
                <label className="block text-xs font-semibold text-gray-800">Preview Status</label>
                <p className="mt-1 text-sm text-gray-700 font-medium">
                  {'previewAvailable' in previewData && previewData.previewAvailable === false
                    ? 'Not available for this file type'
                    : fileType.category === 'video' 
                      ? 'Streaming enabled' 
                      : 'Loaded successfully'
                  }
                </p>
              </div>
            )}

            {/* Additional metadata from GCS */}
            {additionalMetadata && (
              <>
                {additionalMetadata.timeCreated && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-800">Created</label>
                    <p className="mt-1 text-sm text-gray-800 font-medium">{formatDate(additionalMetadata.timeCreated)}</p>
                  </div>
                )}

                {additionalMetadata.md5Hash && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-800">MD5 Hash</label>
                    <p className="mt-1 text-sm text-gray-700 font-mono break-all bg-gray-100 p-2 rounded">{additionalMetadata.md5Hash}</p>
                  </div>
                )}

                {additionalMetadata.generation && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-800">Generation</label>
                    <p className="mt-1 text-sm text-gray-800 font-medium">{additionalMetadata.generation}</p>
                  </div>
                )}

                {additionalMetadata.customMetadata && Object.keys(additionalMetadata.customMetadata).length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-800">Custom Metadata</label>
                    <div className="mt-1 space-y-1">
                      {Object.entries(additionalMetadata.customMetadata).map(([key, value]) => (
                        <div key={key} className="text-sm bg-gray-50 p-2 rounded">
                          <span className="font-semibold text-gray-800">{key}:</span>
                          <span className="text-gray-800 ml-1 font-medium">{String(value)}</span>
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
              className="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
