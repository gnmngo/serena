'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import DocumentPreview from './DocumentPreview';
import ConfirmDialog from '@/components/ui/ConfirmDialog';  // Fixed path
import toast from 'react-hot-toast';

export default function DocumentCard({ post, isAdmin }) {
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase
      .from('transparency_posts')
      .delete()
      .eq('id', post.id);
    if (error) {
      toast.error('Delete failed: ' + error.message);
    } else {
      toast.success('Document deleted');
      router.refresh();
    }
    setDeleting(false);
    setShowDeleteModal(false);
  };

  return (
    <>
      <div id={`doc-${post.id}`} className="card p-5">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <h3 className="font-semibold text-lg">{post.title}</h3>
          <span className="badge badge-category">{post.category}</span>
        </div>
        <p className="text-gray-600 text-sm mt-2">{post.content}</p>
        <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
          <span>{new Date(post.published_at).toLocaleDateString()}</span>
          {post.file_url && (
            <div className="flex gap-2">
              <button onClick={() => setShowPreview(true)} className="text-blue-500 hover:underline flex items-center gap-1">
                👁️ Preview
              </button>
              <a href={post.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                ⬇️ Download
              </a>
            </div>
          )}
        </div>
        {isAdmin && (
          <div className="mt-3">
            <button onClick={() => setShowDeleteModal(true)} className="text-xs text-red-500 hover:underline" disabled={deleting}>
              Delete
            </button>
          </div>
        )}
      </div>
      {showPreview && post.file_url && (
        <DocumentPreview fileUrl={post.file_url} fileType="" onClose={() => setShowPreview(false)} />
      )}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Document"
        message={`Are you sure you want to delete "${post.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}