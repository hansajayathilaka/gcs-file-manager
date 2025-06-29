'use client';

import { useState } from 'react';

interface BucketConfigProps {
  allowedBuckets: string[];
  onBucketsUpdate: (buckets: string[]) => void;
}

export default function BucketConfig({ allowedBuckets, onBucketsUpdate }: BucketConfigProps) {
  const [newBucket, setNewBucket] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleAddBucket = () => {
    if (newBucket.trim() && !allowedBuckets.includes(newBucket.trim())) {
      onBucketsUpdate([...allowedBuckets, newBucket.trim()]);
      setNewBucket('');
    }
  };

  const handleRemoveBucket = (bucketToRemove: string) => {
    onBucketsUpdate(allowedBuckets.filter(bucket => bucket !== bucketToRemove));
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Bucket Configuration</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-indigo-600 hover:text-indigo-500"
        >
          {isEditing ? 'Done' : 'Edit'}
        </button>
      </div>

      {isEditing && (
        <div className="mb-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newBucket}
              onChange={(e) => setNewBucket(e.target.value)}
              placeholder="Enter bucket name"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleAddBucket()}
            />
            <button
              onClick={handleAddBucket}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Add GCS bucket names that users can access
          </p>
        </div>
      )}

      <div className="space-y-2">
        {allowedBuckets.length === 0 ? (
          <p className="text-gray-500 text-sm">No buckets configured. Add buckets to get started.</p>
        ) : (
          allowedBuckets.map((bucket) => (
            <div
              key={bucket}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <span className="text-sm font-medium text-gray-900">{bucket}</span>
              {isEditing && (
                <button
                  onClick={() => handleRemoveBucket(bucket)}
                  className="text-red-600 hover:text-red-500 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
