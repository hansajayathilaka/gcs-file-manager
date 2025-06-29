import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';

export const useAllowedBuckets = () => {
  const { user } = useAuth();
  const [allowedBuckets, setAllowedBuckets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    if (!user) return {};
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return {};
      
      const token = await currentUser.getIdToken();
      return {
        'Authorization': `Bearer ${token}`,
      };
    } catch (error) {
      console.error('Error getting auth token:', error);
      return {};
    }
  }, [user]);

  const fetchAllowedBuckets = useCallback(async () => {
    if (!user) {
      setAllowedBuckets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const headers = await getAuthHeaders();
      const response = await fetch('/api/allowed-buckets', {
        headers,
      });

      const data = await response.json();
      
      if (data.success) {
        setAllowedBuckets(data.buckets);
      } else {
        setError(data.error || 'Failed to fetch allowed buckets');
        setAllowedBuckets([]);
      }
    } catch (err) {
      setError('Failed to fetch allowed buckets');
      setAllowedBuckets([]);
      console.error('Error fetching allowed buckets:', err);
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders]);

  useEffect(() => {
    fetchAllowedBuckets();
  }, [fetchAllowedBuckets]);

  return {
    allowedBuckets,
    loading,
    error,
    refetch: fetchAllowedBuckets,
  };
};
