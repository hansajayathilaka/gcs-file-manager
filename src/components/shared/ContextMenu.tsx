'use client';

import { useState, useEffect, useRef } from 'react';
import {
  DocumentDuplicateIcon,
  ScissorsIcon,
  ClipboardDocumentIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';

interface ContextMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  items: ContextMenuItem[];
}

export default function ContextMenu({ isOpen, position, onClose, items }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          onClose();
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-48"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {items.map((item, index) => (
        <div key={index}>
          {item.separator && <div className="border-t border-gray-100 my-1" />}
          <button
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            disabled={item.disabled}
            className={`
              w-full px-3 py-2 text-left text-sm flex items-center space-x-3 hover:bg-gray-50 
              ${item.disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'}
            `}
          >
            <span className="flex-shrink-0 w-4 h-4">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}

export { DocumentDuplicateIcon, ScissorsIcon, ClipboardDocumentIcon, PencilIcon, TrashIcon, ArrowDownTrayIcon, ShareIcon };