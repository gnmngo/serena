'use client';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function NewTransparencyPost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('budget');
  const [fileUrl, setFileUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('transparency_posts').insert({
      title, content, category, file_url: fileUrl || null, published_at: new Date(), created_by: user?.id
    });
    if (error) toast.error('Error posting document');
    else {
      toast.success('Transparency post added');
      router.push('/transparency');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto animate-fadeInUp">
      <h1 className="text-3xl font-bold mb-6">Add Transparency Post</h1>
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input className="w-full border p-2 rounded" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Content</label>
          <textarea rows="5" className="w-full border p-2 rounded" value={content} onChange={e => setContent(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select className="w-full border p-2 rounded" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="budget">Budget</option><option value="minutes">Meeting Minutes</option><option value="policy">Policy</option><option value="procurement">Procurement</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">File URL (optional)</label>
          <input className="w-full border p-2 rounded" placeholder="https://..." value={fileUrl} onChange={e => setFileUrl(e.target.value)} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Submitting...' : 'Add Post'}</button>
      </form>
    </div>
  );
}