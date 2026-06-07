'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
  Home, FileText, Megaphone, Users, Star, Lightbulb,
  Edit3, Settings, DollarSign, LogOut, UserCircle,
  Wallet, TrendingUp, Calendar, MessageSquare, PieChart, Activity
} from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

export default function Sidebar({ isOpen, onClose }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, student_id')
          .eq('id', user.id)
          .single();
        setRole(profile?.role || 'student');
        if (profile?.full_name) setDisplayName(profile.full_name);
        else setDisplayName(profile?.student_id || user.email?.split('@')[0]);
      }
    };
    getUser();
  }, []);

  const commonNav = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Transparency', href: '/transparency', icon: FileText },
    { name: 'Announcements', href: '/announcements', icon: Megaphone },
    { name: 'Public Ideas', href: '/suggestions-board', icon: Users },
    { name: 'Events', href: '/events', icon: Calendar },
  ];

  const studentNav = [
    { name: 'Suggest', href: '/suggest', icon: Lightbulb },
    { name: 'Budget Requests', href: '/budget-requests', icon: DollarSign },
  ];

  const facultyNav = [
    { name: 'Suggest', href: '/suggest', icon: Lightbulb },
    { name: 'Post Announcement', href: '/announcements/new', icon: Edit3 },
  ];

  const adminNav = [
    { name: 'Admin Dashboard', href: '/admin/dashboard', icon: PieChart },
    { name: 'Manage Suggestions', href: '/admin/suggestions', icon: MessageSquare },
    { name: 'Budget Requests', href: '/admin/budget-requests', icon: Wallet },
    { name: 'Budget Transactions', href: '/admin/budget', icon: TrendingUp },
    { name: 'Activity Logs', href: '/admin/activity-logs', icon: Activity },
    { name: 'Post Announcement', href: '/announcements/new', icon: Edit3 },
    { name: 'Add Document', href: '/transparency/new', icon: FileText },
  ];

  let navItems = [...commonNav];
  if (role === 'student') navItems = [...commonNav, ...studentNav];
  else if (role === 'faculty') navItems = [...commonNav, ...facultyNav];
  else if (role === 'admin') navItems = [...commonNav, ...adminNav];

  const sidebarClasses = `
    fixed top-0 left-0 z-50 w-64 h-full 
    bg-gradient-to-b from-[#343434] to-[#1f1f1f] text-white shadow-2xl
    transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    lg:translate-x-0
    overflow-y-auto
  `;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />}
      <aside className={sidebarClasses}>
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-gray-700 flex flex-col items-center">
            <Link href="/" className="flex flex-col items-center">
              <Image src="/white-serena-logo.png" alt="SERENA" width={80} height={80} className="object-contain" />
              <span className="text-white font-bold text-xl mt-2 tracking-tight">SERENA</span>
            </Link>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-white/20 text-white border-l-4 border-white'
                      : 'hover:bg-white/10 text-gray-200 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-700">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <UserCircle size={36} className="text-gray-300" />
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{displayName}</p>
                    <p className="text-xs text-gray-400 capitalize">{role}</p>
                  </div>
                </div>
                <Link href="/profile" onClick={onClose} className="w-full flex items-center gap-2 text-sm text-gray-300 hover:text-white transition">
                  <UserCircle size={16} /> Profile
                </Link>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="w-full flex items-center gap-2 text-sm text-gray-300 hover:text-white transition"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            ) : (
              <Link href="/login" className="block text-center text-sm text-gray-300 hover:text-white">
                Login
              </Link>
            )}
          </div>
        </div>
      </aside>

      <ConfirmDialog
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmText="Logout"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}