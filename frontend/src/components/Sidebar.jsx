import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertCircle,
  Bell,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Home,
  X,
  Users,
  Wrench,
  DollarSign,
  Receipt,
  UserCheck,
  Shield,
  BarChart3,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const adminNav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/complaints', label: 'Complaints', icon: AlertCircle },
  { to: '/residents', label: 'Residents', icon: Users },
  { to: '/staff', label: 'Staff', icon: Wrench },
  { to: '/billing', label: 'Billing', icon: DollarSign },
  { to: '/visitors', label: 'Visitors', icon: UserCheck },
  { to: '/documents', label: 'Documents', icon: FolderOpen },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/notices', label: 'Notices', icon: Bell },
];

const residentNav = [
  { to: '/', label: 'My Complaints', icon: Home },
  { to: '/raise-complaint', label: 'Raise Complaint', icon: PlusCircle },
  { to: '/bills', label: 'My Bills', icon: Receipt },
  { to: '/my-visitors', label: 'My Visitors', icon: UserCheck },
  { to: '/notices', label: 'Notices', icon: Bell },
];

const securityNav = [
  { to: '/', label: 'Security Desk', icon: Shield },
  { to: '/notices', label: 'Notices', icon: Bell },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { auth, handleLogout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = auth?.user?.role === 'admin';
  const isSecurity = auth?.user?.role === 'security';
  const navItems = isSecurity ? securityNav : isAdmin ? adminNav : residentNav;

  const handleLogoutClick = () => {
    handleLogout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-surface-100">
        <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen?.(false)}>
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">ST</span>
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-surface-900 tracking-tight">
              SocietyTracker
            </span>
          )}
        </Link>
        <button
          onClick={() => setMobileOpen?.(false)}
          className="lg:hidden p-1.5 rounded-lg hover:bg-surface-100 text-surface-400"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen?.(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} className={isActive ? 'text-brand-600' : 'text-surface-400'} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="border-t border-surface-100 p-3">
        {!collapsed && auth?.user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-semibold text-surface-900 truncate">{auth.user.name}</p>
            <p className="text-xs text-surface-400 capitalize">{auth.user.role}</p>
          </div>
        )}
        <button
          onClick={handleLogoutClick}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-surface-500 hover:bg-danger-50 hover:text-danger transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle - desktop only */}
      <div className="hidden lg:block border-t border-surface-100 p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full px-3 py-2 rounded-lg text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen bg-white border-r border-surface-100 shadow-sidebar z-30 transition-all duration-300 ${
          collapsed ? 'w-[68px]' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-surface-900/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-elevated animate-slide-in">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
