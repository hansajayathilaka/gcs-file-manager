'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile, ManagedBucket, AdminUserListResponse } from '@/types';
import UserManagement from './admin/UserManagement';
import BucketManagement from './admin/BucketManagement';
import Navigation from '@/components/shared/Navigation';
import { 
  UserGroupIcon, 
  FolderIcon, 
  ChartBarIcon,
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';

interface TabConfig {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
}

const AdminDashboard: React.FC = () => {
  const { user, userProfile, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [buckets, setBuckets] = useState<ManagedBucket[]>([]);

  // Redirect if not admin
  useEffect(() => {
    if (!hasRole('admin')) {
      window.location.href = '/';
      return;
    }
    setLoading(false);
  }, [userProfile, hasRole]);

  const tabs: TabConfig[] = [
    {
      id: 'users',
      name: 'User Management',
      icon: UserGroupIcon,
      component: UserManagement,
    },
    {
      id: 'buckets',
      name: 'Bucket Management',
      icon: FolderIcon,
      component: BucketManagement,
    },
  ];

  if (loading || !userProfile || !hasRole('admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || UserManagement;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        title="Admin Dashboard" 
        subtitle="Manage users, buckets, and permissions"
        showBackButton={true}
        backButtonText="File Manager"
        backButtonHref="/"
        showUserActions={true}
      />

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="mt-8 px-4">
            <ul className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <li key={tab.id}>
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;