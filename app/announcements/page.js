'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import EmptyState from '@/components/ui/EmptyState';
import { Heart } from 'lucide-react';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: '' });
  const [reactions, setReactions] = useState({});
  const [reactionCounts, setReactionCounts] = useState({});
  const supabase = createClient();

  useEffect(() => {
    fetchAnnouncements();
    getUser();
  }, []);

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setRole(profile?.role);
    }
  }

  async function fetchAnnouncements() {
    const { data: announcementsData } = await supabase
      .from('announcements')
      .select('*')
      .order('published_at', { ascending: false });
    setAnnouncements(announcementsData || []);

    if (announcementsData?.length) {
      const { data: counts } = await supabase
        .from('announcement_reactions')
        .select('announcement_id')
        .in('announcement_id', announcementsData.map(a => a.id));
      const countMap = {};
      counts?.forEach(c => { countMap[c.announcement_id] = (countMap[c.announcement_id] || 0) + 1; });
      setReactionCounts(countMap);

      if (userId) {
        const { data: userReactions } = await supabase
          .from('announcement_reactions')
          .select('announcement_id')
          .eq('user_id', userId)
          .in('announcement_id', announcementsData.map(a => a.id));
        const userReactedMap = {};
        userReactions?.forEach(r => { userReactedMap[r.announcement_id] = true; });
        setReactions(userReactedMap);
      }
    }
  }

  async function toggleReaction(announcementId) {
    if (!userId) {
      toast.error('Please login to react to announcements.');
      return;
    }
    const hasReacted = reactions[announcementId];
    if (hasReacted) {
      const { error } = await supabase
        .from('announcement_reactions')
        .delete()
        .eq('announcement_id', announcementId)
        .eq('user_id', userId);
      if (error) toast.error('Error removing reaction');
      else {
        setReactions(prev => ({ ...prev, [announcementId]: false }));
        setReactionCounts(prev => ({ ...prev, [announcementId]: (prev[announcementId] || 1) - 1 }));
      }
    } else {
      const { error } = await supabase
        .from('announcement_reactions')
        .insert({ announcement_id: announcementId, user_id: userId, reaction_type: 'heart' });
      if (error) toast.error('Error adding reaction');
      else {
        setReactions(prev => ({ ...prev, [announcementId]: true }));
        setReactionCounts(prev => ({ ...prev, [announcementId]: (prev[announcementId] || 0) + 1 }));
      }
    }
  }

  async function deleteAnnouncement(id) {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) toast.error('Delete failed');
    else {
      toast.success('Announcement deleted');
      fetchAnnouncements();
    }
  }

  const canPost = role === 'admin' || role === 'faculty';

  if (!announcements.length) {
    return (
      <div>
        <div className="flex justify-end mb-4">{canPost && <Link href="/announcements/new" className="btn-primary">+ Post Announcement</Link>}</div>
        <EmptyState icon="📢" title="No announcements yet" description="Check back later for updates from the Student Council." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold">Announcements</h1>
        {canPost && <Link href="/announcements/new" className="btn-primary">+ Post Announcement</Link>}
      </div>
      <div className="space-y-6">
        {announcements.map(ann => (
          <div key={ann.id} id={`ann-${ann.id}`} className={`card p-5 border-l-8 ${ann.is_urgent ? 'border-l-red-500' : 'border-l-transparent'}`}>
            <div className="flex justify-between items-start flex-wrap gap-2">
              <h2 className="text-xl font-semibold">{ann.title}</h2>
              {ann.is_urgent && <span className="badge badge-danger">Urgent</span>}
            </div>
            <p className="text-gray-600 mt-2">{ann.content}</p>
            {ann.media_url && (
              <div className="mt-4">
                {ann.media_type === 'image' && <img src={ann.media_url} alt="Announcement media" className="rounded-lg max-h-80" />}
                {ann.media_type === 'video' && <video controls className="rounded-lg max-h-80"><source src={ann.media_url} /></video>}
              </div>
            )}
            <div className="flex justify-between items-center mt-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleReaction(ann.id)}
                  className={`flex items-center gap-1 transition ${reactions[ann.id] ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                >
                  <Heart size={18} fill={reactions[ann.id] ? 'currentColor' : 'none'} />
                  <span className="text-sm">{reactionCounts[ann.id] || 0}</span>
                </button>
                <p className="text-xs text-gray-400">{new Date(ann.published_at).toLocaleDateString()}</p>
              </div>
              {canPost && (
                <button onClick={() => setDeleteModal({ open: true, id: ann.id, title: ann.title })} className="text-xs text-red-500 hover:underline">
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <ConfirmDialog
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, title: '' })}
        onConfirm={() => deleteAnnouncement(deleteModal.id)}
        title="Delete Announcement"
        message={`Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}