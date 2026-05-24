'use client';

import { useState } from 'react';
import Sidebar from './ui/Sidebar';
import Header from './ui/Header';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-6 md:p-8 animate-fadeInUp">{children}</main>
      </div>
    </div>
  );
}