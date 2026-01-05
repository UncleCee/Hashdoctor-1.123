
import React, { useState } from 'react';
import { UserRole, User } from '../types.ts';

interface LayoutProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ user, activeTab, setActiveTab, children, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: '🏠', roles: Object.values(UserRole) },
    { id: 'admin_panel', name: 'Admin Panel', icon: '🛡️', roles: [UserRole.ADMIN_CEO, UserRole.ADMIN_MANAGER, UserRole.ADMIN_CSO, UserRole.ADMIN_CMO] },
    { id: 'messages', name: 'Messages', icon: '💬', roles: Object.values(UserRole) },
    { id: 'feed', name: 'Health Insights', icon: '🧬', roles: [UserRole.PATIENT] },
    { id: 'wallet', name: 'Wallet', icon: '💰', roles: [UserRole.PATIENT, UserRole.DOCTOR] },
    { id: 'settings', name: 'Settings', icon: '⚙️', roles: Object.values(UserRole) },
  ];

  const filteredNav = user ? navigation.filter(item => item.roles.includes(user.role)) : [];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 overflow-x-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-80 bg-white border-r border-slate-200 shadow-sm shrink-0 fixed h-full z-30">
        <div className="p-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-100">H</div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">HashDoctor</h1>
        </div>
        
        <nav className="flex-1 px-6 space-y-3 mt-4 overflow-y-auto">
          {filteredNav.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-5 px-6 py-5 rounded-2xl text-lg font-black transition-all duration-300 ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-xl translate-x-1' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-3xl">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        {user && (
          <div className="p-8 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-5 p-4 bg-slate-50 rounded-[2rem] border border-slate-100 relative">
              <div className="relative">
                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full ring-4 ring-white shadow-md" />
                <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${user.isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{user.role.replace('_', ' ')}</p>
              </div>
              <button onClick={onLogout} className="text-slate-400 hover:text-red-600 transition-colors p-3 text-2xl" title="Logout">
                🚪
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div 
            className="w-80 h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-10 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl">H</div>
                <h2 className="font-black text-slate-900 text-2xl">HashDoctor</h2>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="text-slate-900 text-3xl font-black">✕</button>
            </div>
            <nav className="flex-1 p-6 space-y-3 overflow-y-auto">
              {filteredNav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-5 px-6 py-6 rounded-2xl text-xl font-black transition-all ${
                    activeTab === item.id 
                      ? 'bg-blue-600 text-white shadow-2xl scale-105' 
                      : 'text-slate-700'
                  }`}
                >
                  <span className="text-4xl">{item.icon}</span>
                  {item.name}
                </button>
              ))}
            </nav>
            <div className="p-10 border-t border-slate-100">
               <button onClick={onLogout} className="w-full py-6 rounded-3xl border-2 border-slate-100 text-sm font-black uppercase tracking-[0.2em] text-slate-600 flex items-center justify-center gap-4 hover:bg-slate-50">
                 🚪 SIGN OUT
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-80 w-full">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-6 bg-white border-b border-slate-200 sticky top-0 z-50 shadow-md">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-4 group active:scale-95 transition-transform"
          >
             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl group-hover:shadow-2xl transition-shadow">H</div>
             <span className="font-black text-slate-900 text-2xl tracking-tighter">HashDoctor</span>
          </button>
          {user && (
            <div className="relative">
              <img src={user.avatar} className="w-12 h-12 rounded-full border-2 border-white shadow-md" alt="" />
              <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${user.isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
            </div>
          )}
        </header>

        <main className="flex-1 p-8 md:p-14 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
