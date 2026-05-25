'use client';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function DocumentPreview({ fileUrl, onClose }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
  const isPdf = fileUrl.endsWith('.pdf');
  const isVideo = /\.(mp4|webm|mov)$/i.test(fileUrl);
  const isOffice = /\.(docx?|xlsx?|pptx?)$/i.test(fileUrl);

  // Google Docs Viewer works for many office formats
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="relative max-w-4xl w-full bg-white rounded-lg overflow-hidden">
        <button onClick={onClose} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 z-10">
          <XMarkIcon className="w-6 h-6" />
        </button>
        <div className="p-4">
          {isImage && <img src={fileUrl} alt="Preview" className="max-w-full max-h-[80vh] mx-auto" />}
          {isPdf && <iframe src={fileUrl} className="w-full h-[80vh]" />}
          {isVideo && <video src={fileUrl} controls className="max-w-full max-h-[80vh] mx-auto" />}
          {isOffice && (
            <iframe
              src={googleViewerUrl}
              className="w-full h-[80vh]"
              title="Document Preview"
            />
          )}
          {!isImage && !isPdf && !isVideo && !isOffice && (
            <div className="text-center p-8">
              <p>Preview not available. <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">Download file</a></p>
            </div>
          )}
        </div>
        <div className="p-3 border-t border-gray-200 text-center text-sm text-gray-500">
          <a href={fileUrl} download className="text-blue-500 hover:underline">⬇️ Download original file</a>
        </div>
      </div>
    </div>
  );
}