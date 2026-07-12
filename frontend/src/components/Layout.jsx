import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-50">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div
        className={`transition-all duration-300 ${
          collapsed ? 'lg:ml-[68px]' : 'lg:ml-64'
        }`}
      >
        <Navbar setMobileOpen={setMobileOpen} />
        <main className="p-4 lg:p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
