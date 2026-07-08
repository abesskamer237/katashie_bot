import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, Server,
  Package, ScrollText, Bell, ArrowLeft, Terminal, Shield
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
  return (
    <div className="flex h-screen bg-gray-900 bg-grid overflow-hidden">
      {/* Admin Sidebar */}
      <aside className="w-60 bg-gray-950 border-r border-yellow-400 border-opacity-30 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-bold text-sm tracking-wider">ADMIN PANEL</span>
          </div>
          <div className="text-xs text-gray-600 flex items-center gap-1">
            <Terminal className="w-3 h-3" /> KATASHIE BOT — v1.0.0
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {adminNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm font-mono transition-all
                border-l-2 ${isActive ? 'text-yellow-400 border-yellow-400 bg-yellow-400 bg-opacity-5' : 'text-gray-500 border-transparent hover:text-white hover:bg-gray-800'}`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Back to app */}
        <div className="p-3 border-t border-gray-800">
          <NavLink to="/dashboard" className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors">
            <ArrowLeft className="w-3 h-3" /> Retour au panel
          </NavLink>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
