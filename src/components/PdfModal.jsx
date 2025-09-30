'use client';

import { X } from "lucide-react";

export default function PdfModal({ fileUrl, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white w-[80vw] h-[90vh] rounded-lg overflow-hidden shadow-lg">
        <button
          onClick={onClose}
          className="absolute cursor-pointer top-2 right-2 text-gray-600 hover:text-red-600 p-2 z-10"
        >
          <X className="w-6 h-6" />
        </button>
        <iframe
          src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
          className="w-full h-full"
          title="PDF Viewer"
          allowFullScreen
        />
      </div>
    </div>
  );
}
