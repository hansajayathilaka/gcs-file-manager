'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ShareableLink } from '@/types';

const SharedFilePage: React.FC = () => {
  const params = useParams();
  const token = params?.token as string;
  const [link, setLink] = useState<ShareableLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchLinkInfo = async () => {
      if (!token) {
        setError('Invalid link');
        setLoading(false);
        return;
      }

      try {
        // We'll create a separate endpoint just for getting link info without downloading
        const response = await fetch(`/api/share/info/${token}`);
        const data = await response.json();

        if (data.success) {
          setLink(data.link);
        } else {
          setError(data.error || 'Link not found');
        }
      } catch (err) {
        setError('Failed to load link information');
      } finally {
        setLoading(false);
      }
    };

    fetchLinkInfo();
  }, [token]);

  const handleDownload = async () => {
    if (!token) return;

    setDownloading(true);
    try {
      const response = await fetch(`/api/share/${token}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Download failed');
        return;
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = link?.fileName || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Refresh link info to update access count
      window.location.reload();
    } catch (err) {
      setError('Download failed');
    } finally {
      setDownloading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Access Denied</h3>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const expired = isExpired(link.expiresAt);
  const maxAccessReached = isMaxAccessReached(link);
  const canDownload = !expired && !link.isRevoked && !maxAccessReached;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="px-6 py-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100">
              <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Shared File</h3>
          </div>

          <div className="mt-6">
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-2">File Information</h4>
              <dl className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <dt className="font-medium">Name:</dt>
                  <dd className="text-gray-900">{link.fileName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Expires:</dt>
                  <dd className={expired ? 'text-red-600 font-medium' : 'text-gray-900'}>
                    {formatDate(link.expiresAt)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Downloads:</dt>
                  <dd className="text-gray-900">
                    {link.accessCount}
                    {link.maxAccess && ` / ${link.maxAccess}`}
                  </dd>
                </div>
                {link.description && (
                  <div className="flex justify-between">
                    <dt className="font-medium">Description:</dt>
                    <dd className="text-gray-900">{link.description}</dd>
                  </div>
                )}
              </dl>
            </div>

            {!canDownload && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">
                  {expired && 'This link has expired.'}
                  {link.isRevoked && 'This link has been revoked.'}
                  {maxAccessReached && 'This link has reached its maximum download limit.'}
                </p>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={handleDownload}
                disabled={!canDownload || downloading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white ${
                  canDownload && !downloading
                    ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {downloading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Downloading...
                  </>
                ) : (
                  'Download File'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedFilePage;