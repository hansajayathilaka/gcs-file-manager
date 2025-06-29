'use client';

import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { BreadcrumbItem } from '@/types/fileSystem';

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (path: string) => void;
  bucket: string;
}

export default function Breadcrumb({ items, onNavigate, bucket }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-4">
      <button
        onClick={() => onNavigate('')}
        className="flex items-center hover:text-gray-700 transition-colors"
      >
        <HomeIcon className="h-4 w-4 mr-1" />
        <span className="font-medium text-indigo-600">{bucket}</span>
      </button>
      
      {items.map((item, index) => (
        <div key={item.path} className="flex items-center">
          <ChevronRightIcon className="h-4 w-4 mx-1 text-gray-400" />
          {index === items.length - 1 ? (
            <span className="text-gray-900 font-medium">{item.name}</span>
          ) : (
            <button
              onClick={() => onNavigate(item.path)}
              className="hover:text-gray-700 transition-colors"
            >
              {item.name}
            </button>
          )}
        </div>
      ))}
    </nav>
  );
}
