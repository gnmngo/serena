'use client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function ActivityFeed({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No recent activity
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {activities.map((act, idx) => (
        <div key={idx} className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{act.user?.charAt(0) || 'S'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-sm">{act.message}</p>
            <p className="text-xs text-muted-foreground">{act.timeAgo}</p>
          </div>
        </div>
      ))}
    </div>
  );
}