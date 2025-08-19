'use client';

import React from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-blue-400" />;
      default:
        return <ExclamationCircleIcon className="h-6 w-6 text-red-400" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-red-50 border-red-200';
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-red-800';
    }
  };

  const getButtonColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-500 hover:text-green-600';
      case 'warning':
        return 'text-yellow-500 hover:text-yellow-600';
      case 'info':
        return 'text-blue-500 hover:text-blue-600';
      default:
        return 'text-red-500 hover:text-red-600';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`border rounded-lg p-4 shadow-lg transition-all duration-300 ease-in-out ${getBgColor(notification.type)}`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon(notification.type)}
            </div>
            <div className="ml-3 flex-1">
              <h3 className={`text-sm font-medium ${getTextColor(notification.type)}`}>
                {notification.title}
              </h3>
              <p className={`mt-1 text-sm ${getTextColor(notification.type)} opacity-90`}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className={`ml-2 flex-shrink-0 ${getButtonColor(notification.type)} transition-colors`}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}