'use client';

import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  ClipboardDocumentIcon, 
  CheckIcon, 
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { ShareableLink, ShareableLinkListResponse } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { getFirebaseAuth } from '@/lib/firebase';
import ConfirmationModal from './ConfirmationModal';

interface ShareLinksManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShareLinksManager: React.FC<ShareLinksManagerProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotifications();
  const [links, setLinks] = useState<ShareableLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedLinks, setCopiedLinks] = useState<Set<string>>(new Set());
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [linkToRevoke, setLinkToRevoke] = useState<string | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLinks();
    }
  }, [isOpen]);

  const loadLinks = async () => {
    if (!user) {
      console.log('ShareLinksManager: No user available');
      return;
    }

    console.log('ShareLinksManager: Loading links for user:', user.uid);
    setLoading(true);
    try {
      const currentUser = getFirebaseAuth().currentUser;
      if (!currentUser) {
        console.log('ShareLinksManager: No current user from auth');
        return;
      }

      const token = await currentUser.getIdToken();
      console.log('ShareLinksManager: Fetching from /api/share/list');
      
      const response = await fetch('/api/share/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('ShareLinksManager: Response status:', response.status);
      const data: ShareableLinkListResponse = await response.json();
      console.log('ShareLinksManager: Response data:', data);

      if (data.success) {
        console.log('ShareLinksManager: Setting links:', data.links.length, 'links');
        setLinks(data.links);
      } else {
        console.error('Failed to load share links:', data.error);
      }
    } catch (error) {
      console.error('Error loading share links:', error);
    } finally {
      setLoading(false);
    }
  };

  const initiateRevoke = (linkId: string) => {
    setLinkToRevoke(linkId);
    setRevokeConfirmOpen(true);
  };

  const handleRevoke = async () => {
    if (!user || !linkToRevoke) return;
    
    setRevokeLoading(true);

    try {
      const currentUser = getFirebaseAuth().currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken();
      const response = await fetch('/api/share/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ linkId: linkToRevoke }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the list
        await loadLinks();
        showSuccess('Link revoked successfully', '');
        setRevokeConfirmOpen(false);
        setLinkToRevoke(null);
      } else {
        showError('Failed to revoke link', data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error revoking link:', error);
      showError('Failed to revoke link', 'Please try again.');
    } finally {
      setRevokeLoading(false);
    }
  };

  const handleCopyLink = async (token: string) => {
    const shareUrl = `${window.location.origin}/share/${token}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLinks(prev => new Set(prev).add(token));
      setTimeout(() => {
        setCopiedLinks(prev => {
          const newSet = new Set(prev);
          newSet.delete(token);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedLinks(prev => new Set(prev).add(token));
      setTimeout(() => {
        setCopiedLinks(prev => {
          const newSet = new Set(prev);
          newSet.delete(token);
          return newSet;
        });
      }, 2000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  const isMaxAccessReached = (link: ShareableLink) => {
    return link.maxAccess ? link.accessCount >= link.maxAccess : false;
  };

  const getStatus = (link: ShareableLink) => {
    if (link.isRevoked) return { text: 'Revoked', color: 'text-red-600' };
    if (isExpired(link.expiresAt)) return { text: 'Expired', color: 'text-orange-600' };
    if (isMaxAccessReached(link)) return { text: 'Max Access Reached', color: 'text-orange-600' };
    return { text: 'Active', color: 'text-green-600' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Manage Share Links
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(80vh-140px)]">

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-8">
              <EyeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No share links</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven&apos;t created any shareable links yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Downloads
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {links.map((link) => {
                      const status = getStatus(link);
                      const isCopied = copiedLinks.has(link.token);
                      
                      return (
                        <tr key={link.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {link.fileName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {link.bucketName}
                              </div>
                              {link.description && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {link.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(link.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(link.expiresAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {link.accessCount}
                            {link.maxAccess && ` / ${link.maxAccess}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${status.color}`}>
                              {status.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {!link.isRevoked && (
                              <button
                                onClick={() => handleCopyLink(link.token)}
                                className={`${
                                  isCopied
                                    ? 'text-green-600 hover:text-green-800'
                                    : 'text-indigo-600 hover:text-indigo-800'
                                }`}
                                title="Copy share link"
                              >
                                {isCopied ? (
                                  <CheckIcon className="h-4 w-4" />
                                ) : (
                                  <ClipboardDocumentIcon className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            {!link.isRevoked && (
                              <button
                                onClick={() => initiateRevoke(link.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Revoke link"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={revokeConfirmOpen}
        onClose={() => {
          setRevokeConfirmOpen(false);
          setLinkToRevoke(null);
        }}
        onConfirm={handleRevoke}
        title="Revoke Share Link"
        message="Are you sure you want to revoke this share link? This action cannot be undone and the link will no longer be accessible."
        confirmText="Revoke"
        cancelText="Cancel"
        type="danger"
        isLoading={revokeLoading}
      />
    </div>
  );
};

export default ShareLinksManager;