'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  UserIcon, 
  Cog6ToothIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

interface NavigationProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonHref?: string;
  showUserActions?: boolean;
  showHomeButton?: boolean;
}

export default function Navigation({ 
  title, 
  subtitle,
  showBackButton = false,
  backButtonText = "← Back",
  backButtonHref = "/",
  showUserActions = true,
  showHomeButton = false
}: NavigationProps) {
  const { user, userProfile, signOut } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <div className="flex items-center">
              {/* Navigation Buttons */}
              <div className="flex items-center space-x-2 mr-4">
                {showHomeButton && (
                  <Link
                    href="/"
                    className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100 flex items-center"
                    title="Home"
                  >
                    <HomeIcon className="h-4 w-4" />
                  </Link>
                )}
                {showBackButton && (
                  <Link
                    href={backButtonHref}
                    className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100 flex items-center"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm">{backButtonText}</span>
                  </Link>
                )}
              </div>
              
              {/* Title and Subtitle */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                )}
              </div>
            </div>
            
            {/* Admin Badge */}
            {userProfile && userProfile.role === 'admin' && (
              <div className="ml-4 flex items-center space-x-2">
                <div className="flex items-center px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                  <ShieldCheckIcon className="h-3 w-3 mr-1" />
                  Admin
                </div>
              </div>
            )}
          </div>
          
          {/* User Actions */}
          {showUserActions && user && userProfile && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {/* User Avatar and Info */}
                <div className="flex items-center">
                  {userProfile?.photoURL ? (
                    <img 
                      className="h-8 w-8 rounded-full object-cover border border-gray-200" 
                      src={userProfile.photoURL} 
                      alt={userProfile.displayName || userProfile.email}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ${userProfile?.photoURL ? 'hidden' : 'flex'}`}
                    style={{ display: userProfile?.photoURL ? 'none' : 'flex' }}
                  >
                    <span className="text-xs font-medium text-white">
                      {(userProfile?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-2">
                    <p className="text-sm font-medium text-gray-900">
                      {userProfile?.displayName || user.email}
                    </p>
                    {userProfile?.displayName && (
                      <p className="text-xs text-gray-500">{user.email}</p>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  {/* Profile Button */}
                  <Link
                    href="/profile"
                    className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100 transition-colors"
                    title="Profile Settings"
                  >
                    <Cog6ToothIcon className="h-5 w-5" />
                  </Link>
                  
                  {/* Admin Button */}
                  {userProfile?.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm hover:bg-indigo-700 transition-colors"
                    >
                      Admin
                    </Link>
                  )}
                  
                  {/* Sign Out Button */}
                  <button
                    onClick={signOut}
                    className="bg-gray-600 text-white px-3 py-1 rounded-md text-sm hover:bg-gray-700 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}