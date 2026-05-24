import { createClient } from '@/utils/supabase/server';

export default async function SuggestionsBoard() {
  const supabase = await createClient();
  const { data: suggestions } = await supabase
    .from('suggestions')
    .select('*')
    .in('status', ['accepted', 'implemented', 'review'])
    .order('upvotes', { ascending: false });

  const statusColor = {
    accepted: 'bg-green-100 text-green-800',
    implemented: 'bg-blue-100 text-blue-800',
    review: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <h1 className="text-2xl font-bold">Public Suggestions</h1>
      {!suggestions?.length && <p className="text-gray-500">No approved suggestions yet.</p>}
      <div className="grid gap-4">
        {suggestions?.map(s => (
          <div key={s.id} className="card p-5">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <h2 className="text-lg font-semibold">{s.title}</h2>
              <span className={`badge ${statusColor[s.status] || 'bg-gray-100'}`}>{s.status}</span>
            </div>
            <p className="text-gray-600 text-sm mt-2">{s.description}</p>
            <div className="flex justify-between items-center mt-3 text-sm text-gray-500">
              <span>👍 {s.upvotes || 0} votes</span>
              <span className="text-xs">Category: {s.category}</span>
            </div>
            {s.admin_response && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm border-l-4 border-[#343434]">
                <strong className="text-xs">Council response:</strong>
                <p className="mt-1">{s.admin_response}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}