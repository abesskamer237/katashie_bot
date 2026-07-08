import { Outlet, NavLink } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Users, CreditCard, Server,
  Package, ScrollText, Bell, ArrowLeft, Terminal, Shield, Menu, X
} from 'lucide-react';

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/admin/users', icon: Users, label: 'Utilisateurs' },
  { to: '/admin/payments', icon: CreditCard, label: 'Paiements' },
  { to: '/admin/servers', icon: Server, label: 'Serveurs' },
  { to: '/admin/packs', icon: Package, label: 'Packs crédits' },
  { to: '/admin/logs', icon: ScrollText, label: 'Journaux' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
];

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-900 bg-grid overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed md:relative inset-y-0 left-0 z-30 w-64 bg-gray-950 border-r border-yellow-400/30 flex flex-col transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-sm tracking-wider">ADMIN PANEL</span>
            </div>
            <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-gray-600 flex items-center gap-1">
            <Terminal className="w-3 h-3" /> KATASHIE BOT — v1.0.0
          </div>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {adminNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm font-mono transition-all border-l-2 ${isActive ? 'text-yellow-400 border-yellow-400 bg-yellow-400/5' : 'text-gray-500 border-transparent hover:text-white hover:bg-gray-800'}`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <NavLink to="/dashboard" className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
            <ArrowLeft className="w-3 h-3" /> Retour au panel
          </NavLink>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
        <div className="max-w-7xl mx-auto animate-fade-in">
          <div className="md:hidden flex items-center justify-between mb-4">
            <button onClick={() => setSidebarOpen(true)} className="flex items-center gap-2 rounded border border-gray-700 bg-gray-950/80 px-3 py-2 text-sm text-gray-300">
              <Menu className="w-4 h-4" /> Menu admin
            </button>
            <div className="text-xs text-gray-500">KATASHIE</div>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
