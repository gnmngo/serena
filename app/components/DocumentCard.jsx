'use client';
import { useState } from 'react';
import DocumentPreview from './DocumentPreview';

export default function DocumentCard({ post, isAdmin, deletePost }) {
  const [showPreview, setShowPreview] = useState(false);
  const fileUrl = post.file_url;
  const fileType = fileUrl ? (fileUrl.endsWith('.pdf') ? 'application/pdf' : (fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image/jpeg' : '')) : '';

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this document?')) {
      const formData = new FormData();
      formData.append('id', post.id);
      deletePost(formData);
    }
  };

  return (
    <div id={`doc-${post.id}`} className="card p-5">
      <div className="flex justify-between items-start flex-wrap gap-2">
        <h3 className="font-semibold text-lg">{post.title}</h3>
        <span className="badge badge-category">{post.category}</span>
      </div>
      <p className="text-gray-600 text-sm mt-2">{post.content}</p>
      <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
        <span>{new Date(post.published_at).toLocaleDateString()}</span>
        {fileUrl && (
          <div className="flex gap-2">
            <button onClick={() => setShowPreview(true)} className="text-blue-500 hover:underline flex items-center gap-1">
              👁️ Preview
            </button>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
              ⬇️ Download
            </a>
          </div>
        )}
      </div>
      {isAdmin && (
        <div className="mt-3">
          <button onClick={handleDelete} className="text-xs text-red-500 hover:underline">Delete</button>
        </div>
      )}
      {showPreview && fileUrl && (
        <DocumentPreview fileUrl={fileUrl} fileType={fileType} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}