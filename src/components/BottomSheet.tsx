'use client';

import { ReactNode } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 lg:hidden max-h-[90vh] overflow-y-auto transition-all duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle + Title */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 rounded-t-2xl">
          {/* Visual handle indicator */}
          <div className="flex justify-center mb-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-2xl text-gray-500 hover:text-gray-700 leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-4 pb-8">{children}</div>
      </div>
    </>
  );
}
