import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import StatsCard from '@/components/ui/StatsCard';
import { MegaphoneIcon, LightBulbIcon, DocumentTextIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default async function FacultyDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'faculty') redirect('/login');

  const { count: announcementsCount } = await supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('created_by', user.id);
  const { count: suggestionsCount } = await supabase.from('suggestions').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div>
        <h1 className="text-3xl font-bold">Faculty Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage announcements and engage with student feedback.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatsCard title="Your Announcements" value={announcementsCount || 0} icon={<MegaphoneIcon className="w-6 h-6" />} color="primary" />
        <StatsCard title="Your Suggestions" value={suggestionsCount || 0} icon={<LightBulbIcon className="w-6 h-6" />} color="success" />
      </div>
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/announcements/new" className="btn-primary text-center">✍️ Post Announcement</Link>
          <Link href="/suggest" className="btn-secondary text-center">💡 Submit Suggestion</Link>
          <Link href="/transparency" className="border border-gray-300 text-center py-2 rounded-lg">📄 View Transparency</Link>
          <Link href="/events" className="border border-gray-300 text-center py-2 rounded-lg">⭐ Rate Events</Link>
        </div>
      </div>
    </div>
  );
}