import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import StatsCard from '@/components/ui/StatsCard';
import { LightBulbIcon, StarIcon, DocumentTextIcon, MegaphoneIcon } from '@heroicons/react/24/outline';

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'student') redirect('/login');

  // Fetch stats
  const { count: suggestionsCount } = await supabase.from('suggestions').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
  const { count: evaluationsCount } = await supabase.from('event_evaluations').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
  const { data: recentAnnouncements } = await supabase.from('announcements').select('*').order('published_at', { ascending: false }).limit(3);

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div>
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user.email?.split('@')[0]}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Your Suggestions" value={suggestionsCount || 0} icon={<LightBulbIcon className="w-6 h-6" />} color="primary" />
        <StatsCard title="Events Rated" value={evaluationsCount || 0} icon={<StarIcon className="w-6 h-6" />} color="success" />
        <StatsCard title="Active Events" value="3" icon={<MegaphoneIcon className="w-6 h-6" />} color="warning" />
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/suggest" className="btn-primary text-center">💡 Submit a Suggestion</Link>
          <Link href="/events" className="btn-secondary text-center">⭐ Rate an Event</Link>
          <Link href="/transparency" className="border border-gray-300 text-center py-2 rounded-lg hover:bg-gray-50">📄 View Transparency</Link>
          <Link href="/announcements" className="border border-gray-300 text-center py-2 rounded-lg hover:bg-gray-50">📢 Read Announcements</Link>
        </div>
      </div>

      {/* Recent Announcements */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-3">Recent Announcements</h2>
        {!recentAnnouncements?.length && <p className="text-gray-500">No announcements yet.</p>}
        <div className="space-y-3">
          {recentAnnouncements?.map(ann => (
            <div key={ann.id} className="border-b pb-2 last:border-0">
              <div className="flex justify-between items-start">
                <p className="font-medium">{ann.title}</p>
                {ann.is_urgent && <span className="badge badge-danger text-xs">Urgent</span>}
              </div>
              <p className="text-sm text-gray-500 line-clamp-1">{ann.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}