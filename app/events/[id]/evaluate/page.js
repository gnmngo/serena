'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import toast from 'react-hot-toast';

export default function EvaluateEvent({ params }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams.id;

  const [rating, setRating] = useState(0);
  const [likedMost, setLikedMost] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [event, setEvent] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchEvent() {
      const { data } = await supabase.from('events').select('*').eq('id', eventId).single();
      setEvent(data);
    }
    fetchEvent();
  }, [eventId]);

  async function handleSubmit(e) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please login to submit evaluation.');
      router.push('/login');
      return;
    }
    const { error } = await supabase.from('event_evaluations').insert({
      event_id: eventId,
      user_id: user.id,
      rating,
      liked_most: likedMost,
      improvement_suggestions: suggestions,
      would_recommend: wouldRecommend,
      is_anonymous: isAnonymous,
    });
    if (error) toast.error('Error submitting evaluation.');
    else {
      toast.success('Thank you for your feedback!');
      setSubmitted(true);
      setTimeout(() => router.push('/events'), 2000);
    }
  }

  if (!event) return <div className="p-8 text-center">Loading...</div>;
  if (submitted) return <div className="text-center p-8 text-green-600 text-lg">✅ Your feedback has been recorded. Redirecting...</div>;

  return (
    <div className="max-w-2xl mx-auto animate-fadeInUp">
      <h1 className="text-2xl font-bold mb-2">Rate & Evaluate: {event.title}</h1>
      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div>
          <label className="block font-medium mb-2">Rating (1-5 stars)</label>
          <div className="flex gap-2">
            {[1,2,3,4,5].map(star => (
              <button type="button" key={star} onClick={() => setRating(star)} className={`text-3xl transition ${rating >= star ? 'text-yellow-500' : 'text-gray-300'}`}>★</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">What did you like most?</label>
          <textarea className="w-full border p-2 rounded" rows="3" value={likedMost} onChange={e => setLikedMost(e.target.value)} required />
        </div>
        <div>
          <label className="block font-medium mb-1">Suggestions for improvement</label>
          <textarea className="w-full border p-2 rounded" rows="3" value={suggestions} onChange={e => setSuggestions(e.target.value)} required />
        </div>
        <div>
          <label className="block font-medium mb-2">Would you recommend this event?</label>
          <div className="flex gap-4">
            <label><input type="radio" name="rec" onChange={() => setWouldRecommend(true)} /> Yes</label>
            <label><input type="radio" name="rec" onChange={() => setWouldRecommend(false)} /> No</label>
          </div>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isAnonymous} onChange={() => setIsAnonymous(!isAnonymous)} />
          Submit anonymously
        </label>
        <button type="submit" className="btn-primary w-full">Submit Evaluation</button>
      </form>
    </div>
  );
}