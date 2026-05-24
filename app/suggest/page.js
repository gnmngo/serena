'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function SuggestPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // UI refinement #7
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    const { error: submitError } = await supabase.from('suggestions').insert({
      title,
      description,
      category,
      is_anonymous: isAnonymous,
      user_id: user?.id || null,
      status: 'pending'
    });

    setLoading(false);
    if (submitError) {
      setError('Failed to submit. Please try again.');
      console.error(submitError);
    } else {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setTitle('');
        setDescription('');
      }, 4000);
    }
  }

  if (submitted) {
    return (
      <div className="text-center p-8">
        <div className="bg-green-100 text-green-700 p-4 rounded-xl inline-block">
          ✅ Suggestion submitted! It will be reviewed by the council.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Submit a Suggestion</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#343434]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows="5"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#343434]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#343434]"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="academic">Academic</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="event">Event</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            <label htmlFor="anonymous" className="text-sm text-gray-600">Submit anonymously (your name will not be shown)</label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#343434] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#1a1a1a] transition disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Suggestion'}
          </button>
        </form>
      </div>
    </div>
  );
}