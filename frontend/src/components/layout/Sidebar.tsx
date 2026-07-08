import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Server, CreditCard, User,
  LogOut, X, Terminal, Shield, ChevronRight,
  Zap
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface SidebarProps { open: boolean; onClose: () => void; }

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/servers', icon: Server, label: 'Mes Serveurs' },
  { to: '/credits', icon: CreditCard, label: 'Crédits' },
  { to: '/profile', icon: User, label: 'Profil' },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Déconnecté avec succès');
    navigate('/login');
  };

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-30 flex flex-col
          w-60 bg-gray-950 border-r border-gray-800
          transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-400 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-black" />
            </div>
            <div>
              <div className="text-sm font-bold text-green-400 glitch tracking-wider">KATASHIE</div>
              <div className="text-xs text-gray-500">BOT PANEL</div>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-gray-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-800 border border-green-400 flex items-center justify-center">
              <span className="text-green-400 text-xs font-bold">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-sm text-white truncate">{user?.username}</div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="text-yellow-400 font-bold">{user?.credits}</span>
                <span>crédits</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 overflow-y-auto">
          <div className="px-3 mb-2">
            <span className="text-xs text-gray-600 uppercase tracking-widest">Navigation</span>
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              onClick={() => window.innerWidth < 768 && onClose()}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              <ChevronRight className="w-3 h-3 opacity-40" />
            </NavLink>
          ))}

          {/* Admin link */}
          {user?.role === 'admin' && (
            <>
              <div className="px-3 mt-4 mb-2">
                <span className="text-xs text-gray-600 uppercase tracking-widest">Administration</span>
              </div>
              <NavLink
                to="/admin"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => window.innerWidth < 768 && onClose()}
              >
                <Shield className="w-4 h-4 flex-shrink-0 text-yellow-400" />
                <span className="flex-1 text-yellow-400">Admin Panel</span>
                <ChevronRight className="w-3 h-3 opacity-40" />
              </NavLink>
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-800">
          <button onClick={handleLogout} className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-20">
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>

        {/* Version */}
        <div className="px-4 py-2 text-xs text-gray-700 border-t border-gray-800">
          v1.0.0 — © 2025 KATASHIE
        </div>
      </aside>
    </>
  );
}
