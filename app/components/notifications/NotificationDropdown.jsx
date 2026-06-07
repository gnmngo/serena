'use client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { CheckCheck, BellRing } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationDropdown({ notifications, onMarkAsRead, onMarkAllAsRead, onClose }) {
  const hasUnread = notifications.some(n => !n.is_read);

  return (
    <div className="flex flex-col max-h-[500px]">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">Notifications</span>
        </div>
        {hasUnread && (
          <Button variant="ghost" size="sm" onClick={onMarkAllAsRead}>
            <CheckCheck className="h-3 w-3 mr-1" /> Mark all read
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No notifications</div>
        ) : (
          <div className="divide-y">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer ${!notif.is_read ? 'bg-blue-50' : ''}`}
                onClick={() => {
                  onMarkAsRead(notif.id);
                  if (notif.link) window.location.href = notif.link;
                  onClose();
                }}
              >
                <p className="text-sm font-medium">{notif.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      {notifications.length > 0 && (
        <div className="border-t p-2 text-center">
          <Link href="/notifications" className="text-xs text-primary hover:underline" onClick={onClose}>
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}