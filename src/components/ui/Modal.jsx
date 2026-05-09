'use client';

import React, { useEffect } from 'react';
import Button from './Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  actions = [],
  size = 'md',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md transition-all"
        onClick={onClose}
      />
      <div className={`relative bg-white rounded-[2rem] shadow-2xl ${sizeClasses[size]} w-full mx-auto max-h-[90vh] overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {children}
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'secondary'}
                size="md"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: require('prop-types').bool.isRequired,
  onClose: require('prop-types').func.isRequired,
  title: require('prop-types').string.isRequired,
  children: require('prop-types').node,
  actions: require('prop-types').arrayOf(
    require('prop-types').shape({
      label: require('prop-types').string.isRequired,
      onClick: require('prop-types').func.isRequired,
      variant: require('prop-types').oneOf(['primary', 'secondary', 'outline', 'danger']),
    })
  ),
  size: require('prop-types').oneOf(['sm', 'md', 'lg', 'xl', '2xl', '4xl', '6xl']),
};

export default Modal;
