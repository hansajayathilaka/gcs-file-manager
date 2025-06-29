'use client';

import { useState } from 'react';
import { CircleStackIcon, FolderIcon } from '@heroicons/react/24/outline';

interface BucketSidebarProps {
  buckets: string[];
  selectedBucket: string | null;
  onBucketSelect: (bucket: string) => void;
  loading?: boolean;
}

export default function BucketSidebar({ 
  buckets, 
  selectedBucket, 
  onBucketSelect, 
  loading = false 
}: BucketSidebarProps) {
  const [collapsedBuckets, setCollapsedBuckets] = useState<Set<string>>(new Set());

  const toggleBucket = (bucket: string) => {
    const newCollapsed = new Set(collapsedBuckets);
    if (newCollapsed.has(bucket)) {
      newCollapsed.delete(bucket);
    } else {
      newCollapsed.add(bucket);
    }
    setCollapsedBuckets(newCollapsed);
  };

  if (loading) {
    return (
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Storage Buckets</h2>
      </div>
      
      <div className="p-2">
        {buckets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FolderIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No buckets available</p>
          </div>
        ) : (
          <div className="space-y-1">
            {buckets.map((bucket) => (
              <div key={bucket} className="block">
                <button
                  onClick={() => {
                    onBucketSelect(bucket);
                    toggleBucket(bucket);
                  }}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                    selectedBucket === bucket
                      ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <CircleStackIcon className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="truncate">{bucket}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
