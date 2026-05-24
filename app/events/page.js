'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import toast from 'react-hot-toast';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [role, setRole] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: '' });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchEvents();
    getUserRole();
  }, []);

  async function getUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setRole(profile?.role);
    }
  }

  async function fetchEvents() {
    const { data } = await supabase
      .from('events')
      .select('*, event_evaluations(rating)')
      .order('event_date', { ascending: false });
    setEvents(data || []);
    setLoading(false);
  }

  async function deleteEvent(id) {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) toast.error('Error deleting event');
    else {
      toast.success('Event deleted');
      fetchEvents();
    }
  }

  if (loading) return <div className="p-8 text-center">Loading events...</div>;
  if (!events.length) return <EmptyState icon="⭐" title="No events found" description="Check back later for upcoming events you can rate." />;

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Events & Feedback</h1>
        {role === 'admin' && <Link href="/events/new" className="btn-primary">+ Create Event</Link>}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {events.map(event => {
          const ratings = event.event_evaluations.filter(e => e.rating).map(e => e.rating);
          const avg = ratings.length ? (ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1) : null;
          return (
            <div key={event.id} className="card p-5 flex flex-col justify-between relative">
              {role === 'admin' && (
                <button
                  onClick={() => setDeleteModal({ open: true, id: event.id, title: event.title })}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-700"
                  aria-label="Delete event"
                >
                  🗑️
                </button>
              )}
              <div>
                <h2 className="text-xl font-semibold">{event.title}</h2>
                <p className="text-xs text-gray-400 mt-1">{new Date(event.event_date).toLocaleDateString()} • {event.venue || 'Venue TBA'}</p>
                <p className="text-gray-600 text-sm mt-2">{event.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  {avg ? (
                    <>
                      <span className="text-yellow-500 text-lg">⭐ {avg}</span>
                      <span className="text-xs text-gray-400">({ratings.length} reviews)</span>
                    </>
                  ) : <span className="text-xs text-gray-400">Not yet rated</span>}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <Link href={`/events/${event.id}/evaluate`} className="text-primary text-sm font-medium hover:underline">Rate this event →</Link>
              </div>
            </div>
          );
        })}
      </div>
      <ConfirmDialog
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, title: '' })}
        onConfirm={() => deleteEvent(deleteModal.id)}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteModal.title}"? All associated ratings will also be removed.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}