'use client';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export default function NewTransparencyPost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('budget');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in.');
      setLoading(false);
      return;
    }

    let fileUrl = null;
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('transparency')
        .upload(fileName, file);
      if (uploadError) {
        toast.error('File upload failed: ' + uploadError.message);
        setLoading(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage
        .from('transparency')
        .getPublicUrl(fileName);
      fileUrl = publicUrl;
    }

    const { error: insertError } = await supabase
      .from('transparency_posts')
      .insert({
        title,
        content,
        category,
        file_url: fileUrl,
        published_at: new Date(),
        created_by: user.id,
      });

    if (insertError) {
      toast.error('Error posting document: ' + insertError.message);
    } else {
      toast.success('Document posted successfully!');
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
          <input
            className="w-full border p-2 rounded"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Content</label>
          <textarea
            rows="5"
            className="w-full border p-2 rounded"
            value={content}
            onChange={e => setContent(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            className="w-full border p-2 rounded"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="budget">Budget</option>
            <option value="minutes">Meeting Minutes</option>
            <option value="policy">Policy</option>
            <option value="procurement">Procurement</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Upload File (image, PDF, video, etc.)</label>
          <input
            type="file"
            accept="image/*,application/pdf,video/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={e => setFile(e.target.files[0])}
            className="w-full border p-2 rounded"
          />
          <p className="text-xs text-gray-500 mt-1">Optional. Supported: images, PDFs, videos, Word documents.</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Uploading...' : 'Add Post'}
        </button>
      </form>
    </div>
  );
}