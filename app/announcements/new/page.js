'use client';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export default function NewAnnouncement() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaType, setMediaType] = useState('none');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      toast.error('You must be logged in to post announcements.');
      setLoading(false);
      return;
    }

    let mediaUrl = null;
    let finalMediaType = null;

    // Upload file if selected
    if (mediaFile && mediaType !== 'none') {
      const fileExt = mediaFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('announcements')
        .upload(filePath, mediaFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('File upload failed: ' + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('announcements')
        .getPublicUrl(filePath);

      mediaUrl = publicUrl;
      finalMediaType = mediaType;
    }

    // Insert announcement
    const { data: newAnnouncement, error: insertError } = await supabase
      .from('announcements')
      .insert({
        title,
        content,
        is_urgent: isUrgent,
        published_at: new Date(),
        created_by: user.id,
        media_url: mediaUrl,
        media_type: finalMediaType,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      toast.error('Database error: ' + insertError.message);
    } else {
      toast.success('Announcement posted successfully!');
      
      // --- Create notifications for all users (students, faculty, admin) ---
      // Fetch all users (profiles) to send notifications
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id');
      
      if (!profilesError && profiles && profiles.length > 0) {
        // Insert notifications in batches to avoid rate limiting
        const notifications = profiles.map(profile => ({
          user_id: profile.id,
          title: 'New Announcement',
          message: `${title} - ${content.substring(0, 80)}${content.length > 80 ? '...' : ''}`,
          type: 'announcement',
          link: '/announcements',
          created_at: new Date(),
        }));
        
        // Insert in chunks of 100
        const chunkSize = 100;
        for (let i = 0; i < notifications.length; i += chunkSize) {
          const chunk = notifications.slice(i, i + chunkSize);
          await supabase.from('user_notifications').insert(chunk);
        }
      }
      
      router.push('/announcements');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto animate-fadeInUp">
      <h1 className="text-3xl font-bold mb-6">Post Announcement</h1>
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-primary focus:border-primary"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
          <textarea
            rows="6"
            className="w-full border border-gray-300 rounded-lg p-2"
            value={content}
            onChange={e => setContent(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Add Media (image or video)</label>
          <select
            className="w-full border border-gray-300 rounded-lg p-2 mb-2"
            value={mediaType}
            onChange={e => setMediaType(e.target.value)}
          >
            <option value="none">None</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
          {mediaType !== 'none' && (
            <input
              type="file"
              accept={mediaType === 'image' ? 'image/*' : 'video/*'}
              onChange={e => setMediaFile(e.target.files[0])}
              className="w-full border border-gray-300 rounded-lg p-2"
              required
            />
          )}
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isUrgent}
            onChange={e => setIsUrgent(e.target.checked)}
          />
          <span className="text-sm text-gray-700">Mark as urgent (red border, priority)</span>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Posting...' : 'Post Announcement'}
        </button>
      </form>
    </div>
  );
}