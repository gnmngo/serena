'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BellIcon, MagnifyingGlassIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import { createClient } from '@/utils/supabase/client';
import ConfirmDialog from './ConfirmDialog';

export default function Header({ onMenuClick }) {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('Guest');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, student_id')
          .eq('id', user.id)
          .single();
        if (profile?.full_name) setDisplayName(profile.full_name);
        else setDisplayName(profile?.student_id || user.email?.split('@')[0] || 'User');
        await fetchNotifications(user.id);
      } else {
        setDisplayName('Guest');
      }
    };
    getUser();
  }, []);

  async function fetchNotifications(userId) {
    const { data } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    setNotifications(data || []);
    setUnreadCount(data?.filter(n => !n.is_read).length || 0);
  }

  async function markAsRead(notificationId) {
    await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (user) await fetchNotifications(user.id);
  }

  async function markAllAsRead() {
    if (!user) return;
    await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('user_id', user.id);
    await fetchNotifications(user.id);
  }

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      const { data: announcements } = await supabase
        .from('announcements')
        .select('id, title')
        .ilike('title', `%${searchQuery}%`)
        .limit(5);
      const { data: transparency } = await supabase
        .from('transparency_posts')
        .select('id, title')
        .ilike('title', `%${searchQuery}%`)
        .limit(5);
      const { data: events } = await supabase
        .from('events')
        .select('id, title')
        .ilike('title', `%${searchQuery}%`)
        .limit(5);
      
      const suggestions = [
        ...(announcements?.map(a => ({ type: 'announcement', id: a.id, title: a.title, href: `/announcements#ann-${a.id}` })) || []),
        ...(transparency?.map(t => ({ type: 'transparency', id: t.id, title: t.title, href: `/transparency#doc-${t.id}` })) || []),
        ...(events?.map(e => ({ type: 'event', id: e.id, title: e.title, href: `/events#event-${e.id}` })) || []),
      ];
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSuggestionClick = (href) => {
    setShowSuggestions(false);
    setSearchQuery('');
    router.push(href);
    const hash = href.split('#')[1];
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pageTitle = pathname === '/' 
    ? 'Dashboard' 
    : pathname.split('/').pop()?.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()) || 'SERENA';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left section: menu button + page title (no logo) */}
        <div className="flex items-center gap-4">
          <button onClick={onMenuClick} className="lg:hidden text-gray-600 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-800 capitalize">{pageTitle}</h1>
            <p className="text-xs text-gray-500 hidden md:block">{pathname}</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex-1 max-w-md mx-4 relative" ref={searchRef}>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search announcements, documents, events..."
              className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
            />
          </div>
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              {searchSuggestions.map(s => (
                <div
                  key={`${s.type}-${s.id}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSuggestionClick(s.href)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 border-b last:border-0 cursor-pointer"
                >
                  <span className="text-gray-400 text-xs uppercase w-20">{s.type}</span>
                  <span className="truncate">{s.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right section: notifications + user menu */}
        <div className="flex items-center gap-4">
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 transition"
              aria-label="Notifications"
            >
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">Mark all read</button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
                  ) : (
                    notifications.map(notif => (
                      <Link
                        key={notif.id}
                        href={notif.link || '#'}
                        onClick={() => { markAsRead(notif.id); setShowNotifications(false); }}
                        className={`block p-3 border-b border-gray-100 hover:bg-gray-50 transition ${!notif.is_read ? 'bg-blue-50' : ''}`}
                      >
                        <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition" aria-label="User menu">
              <UserCircleIcon className="w-8 h-8 text-gray-600" />
              <span className="text-sm text-gray-700 hidden md:inline">{displayName}</span>
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 focus:outline-none z-50">
              <div className="p-2">
                <div className="px-3 py-2 text-sm text-gray-700 border-b truncate">{displayName}</div>
                <Menu.Item>
                  {({ active }) => (
                    <Link href="/profile" className={`${active && 'bg-gray-100'} w-full text-left px-3 py-2 text-sm rounded-md block`}>
                      Profile
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setShowLogoutModal(true)}
                      className={`${active && 'bg-gray-100'} w-full text-left px-3 py-2 text-sm rounded-md text-red-600`}
                    >
                      Logout
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        cancelText="Cancel"
        variant="primary"
      />
    </header>
  );
}