import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar({ setMobileOpen }) {
  const { auth } = useAuth();

  const initials = auth?.user?.name
    ? auth.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <header className="h-16 bg-white border-b border-surface-100 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg hover:bg-surface-100 text-surface-500"
        >
          <Menu size={20} />
        </button>
        <div className="hidden lg:block" />
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />

        <div className="flex items-center gap-3 pl-3 border-l border-surface-100">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-surface-900 leading-tight">
              {auth?.user?.name}
            </p>
            <p className="text-xs text-surface-400 capitalize">{auth?.user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
