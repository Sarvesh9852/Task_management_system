import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Zap,
  Settings,
} from "lucide-react";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
  { to: "/tasks", icon: CheckSquare, label: "My Tasks" },
  { to: "/team", icon: Users, label: "Team" },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gray-900 border-r border-gray-800
        flex flex-col transition-transform duration-300 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-800">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">
            ProjectFlow
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${
                  isActive
                    ? "bg-brand-500/15 text-brand-400 border border-brand-500/20"
                    : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                }
              `}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          {isAdmin && (
            <div className="pt-4 mt-2 border-t border-gray-800">
              <p className="px-3 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Admin
              </p>
              <NavLink
                to="/team"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-all"
              >
                <Settings size={18} />
                Manage Users
              </NavLink>
            </div>
          )}
        </nav>

        {/* User profile */}
        <div className="px-3 pb-4 border-t border-gray-800 pt-3">
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-800 transition-colors text-left"
            >
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "U")}&background=6366f1&color=fff&size=128`;
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-100 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate capitalize">
                  {user?.role}
                </p>
              </div>
              <ChevronDown
                size={14}
                className={`text-gray-500 transition-transform ${profileOpen ? "rotate-180" : ""}`}
              />
            </button>

            {profileOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-xl animate-slide-up z-10">
                <NavLink
                  to="/profile"
                  onClick={() => {
                    setProfileOpen(false);
                    setSidebarOpen(false);
                  }}
                  className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <User size={15} /> Profile Settings
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-gray-700 transition-colors border-t border-gray-700"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-4 h-16 px-4 bg-gray-900 border-b border-gray-800 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-white"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-500 rounded-md flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-white">ProjectFlow</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
