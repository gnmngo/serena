'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/transparency', label: 'Transparency' },
    { href: '/announcements', label: 'Announcements' },
    { href: '/suggest', label: 'Suggest' },
    { href: '/events', label: 'Events' },
    { href: '/suggestions-board', label: 'Ideas' },
  ];

  return (
    <nav className="shadow-md sticky top-0 z-50" style={{ backgroundColor: '#343434' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-white">SERENA</Link>
          <div className="hidden md:flex space-x-8">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className={`text-white hover:text-gray-300 transition ${pathname === link.href ? 'border-b-2 border-white' : ''}`}>
                {link.label}
              </Link>
            ))}
            {user ? (
              <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }} className="text-white hover:text-gray-300">
                Logout
              </button>
            ) : (
              <Link href="/login" className="text-white hover:text-gray-300">Login</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}