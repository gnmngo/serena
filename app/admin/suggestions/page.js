'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function ManageSuggestions() {
  const [suggestions, setSuggestions] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: '' });
  const supabase = createClient();

  useEffect(() => { fetchSuggestions(); }, []);

  async function fetchSuggestions() {
    const { data } = await supabase.from('suggestions').select('*').order('created_at', { ascending: false });
    setSuggestions(data || []);
  }

  async function updateStatus(id, status, response = '') {
    const { error } = await supabase
      .from('suggestions')
      .update({ status, admin_response: response, updated_at: new Date() })
      .eq('id', id);
    if (error) {
      toast.error('Error updating status');
    } else {
      toast.success(`Suggestion marked as ${status}`);
      fetchSuggestions();

      // --- Add notification for the suggestion author ---
      const { data: suggestion } = await supabase
        .from('suggestions')
        .select('user_id, title')
        .eq('id', id)
        .single();
      if (suggestion && suggestion.user_id) {
        await supabase.from('user_notifications').insert({
          user_id: suggestion.user_id,
          title: `Suggestion ${status}`,
          message: `Your suggestion "${suggestion.title.substring(0, 50)}" has been ${status}.`,
          type: 'suggestion',
          link: '/suggestions-board',
          is_read: false,
        });
      }
    }
  }

  async function deleteSuggestion(id) {
    const { error } = await supabase.from('suggestions').delete().eq('id', id);
    if (error) toast.error('Error deleting suggestion');
    else {
      toast.success('Suggestion deleted');
      fetchSuggestions();
    }
  }

  if (!suggestions.length) return <EmptyState icon="📋" title="No suggestions" description="Students haven't submitted any suggestions yet." />;

  return (
    <div className="space-y-6 animate-fadeInUp">
      <h1 className="text-3xl font-bold">Manage Suggestions</h1>
      <div className="space-y-4">
        {suggestions.map(s => (
          <div key={s.id} className="card p-5">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <h2 className="text-xl font-semibold">{s.title}</h2>
              <span className="badge bg-gray-100 text-gray-800">{s.status}</span>
            </div>
            <p className="text-gray-600 mt-2">{s.description}</p>
            <p className="text-xs text-gray-400 mt-1">Category: {s.category} | Submitted: {new Date(s.created_at).toLocaleDateString()}</p>
            {s.admin_response && <div className="mt-3 p-2 bg-gray-50 rounded"><strong>Response:</strong> {s.admin_response}</div>}
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => updateStatus(s.id, 'accepted')} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Accept</button>
              <button onClick={() => updateStatus(s.id, 'declined')} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Decline</button>
              <button onClick={() => updateStatus(s.id, 'review')} className="bg-yellow-600 text-white px-3 py-1 rounded text-sm">Review</button>
              <button onClick={() => updateStatus(s.id, 'implemented')} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Implemented</button>
              <button onClick={() => setDeleteModal({ open: true, id: s.id, title: s.title })} className="bg-gray-600 text-white px-3 py-1 rounded text-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>
      <ConfirmDialog
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, title: '' })}
        onConfirm={() => deleteSuggestion(deleteModal.id)}
        title="Delete Suggestion"
        message={`Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}