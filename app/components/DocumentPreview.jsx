'use client';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function DocumentPreview({ fileUrl, fileType, onClose }) {
  const isImage = fileType.startsWith('image/');
  const isPdf = fileType === 'application/pdf';
  const isVideo = fileType.startsWith('video/');

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="relative max-w-4xl w-full bg-white rounded-lg overflow-hidden">
        <button onClick={onClose} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70">
          <XMarkIcon className="w-6 h-6" />
        </button>
        <div className="p-4">
          {isImage && <img src={fileUrl} alt="Preview" className="max-w-full max-h-[80vh] mx-auto" />}
          {isPdf && <iframe src={fileUrl} className="w-full h-[80vh]" />}
          {isVideo && <video src={fileUrl} controls className="max-w-full max-h-[80vh] mx-auto" />}
          {!isImage && !isPdf && !isVideo && (
            <div className="text-center p-8">
              <p>Preview not available. <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">Download</a></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}