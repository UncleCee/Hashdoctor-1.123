
import React, { useState, useMemo } from 'react';
import { User, UserRole } from '../../types.ts';

interface AdminDashboardProps {
  user: User;
  allUsers: User[];
  onUpdateUser: (userId: string, data: Partial<User>) => void;
}

type AdminPanel = 'OVERVIEW' | 'USERS' | 'FINANCE' | 'SYSTEM';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, allUsers, onUpdateUser }) => {
  const [activePanel, setActivePanel] = useState<AdminPanel>('OVERVIEW');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ 
    name: '', 
    email: '', 
    role: UserRole.PATIENT, 
    balance: 0,
    password: '',
    idCardNumber: '',
    bankName: '',
    accountNumber: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  const stats = useMemo(() => [
    { label: "Active Patients", value: allUsers.filter(u => u.role === UserRole.PATIENT && !u.isFrozen).length.toString(), trend: "+12%", icon: "👥" },
    { label: "Total Staff", value: allUsers.filter(u => u.role !== UserRole.PATIENT).length.toString(), trend: "+5%", icon: "🩺" },
    { label: "Revenue (USD)", value: `$${allUsers.reduce((acc, u) => acc + u.walletBalance, 0).toFixed(0)}`, trend: "+25%", icon: "📈" },
    { label: "System Uptime", value: "99.98%", trend: "Stable", icon: "⚡" }
  ], [allUsers]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allUsers, searchQuery]);

  const handleEditClick = (u: User) => {
    setEditingUser(u);
    setEditForm({ 
      name: u.name, 
      email: u.email, 
      role: u.role, 
      balance: u.walletBalance,
      password: u.password || 'password123',
      idCardNumber: u.idCardNumber || '',
      bankName: u.bankAccount?.bankName || '',
      accountNumber: u.bankAccount?.accountNumber || ''
    });
  };

  const handleSave = () => {
    if (editingUser) {
      onUpdateUser(editingUser.id, { 
        name: editForm.name, 
        email: editForm.email, 
        role: editForm.role, 
        walletBalance: editForm.balance,
        password: editForm.password,
        idCardNumber: editForm.idCardNumber,
        bankAccount: {
          bankName: editForm.bankName,
          accountNumber: editForm.accountNumber,
          accountName: editForm.name
        }
      });
      setEditingUser(null);
    }
  };

  const toggleFreeze = (u: User) => {
    onUpdateUser(u.id, { isFrozen: !u.isFrozen });
  };

  const isCeo = user.role === UserRole.ADMIN_CEO;

  const panels = [
    { id: 'OVERVIEW', name: 'Overview', icon: '📊' },
    { id: 'USERS', name: 'Users', icon: '👥' },
    { id: 'FINANCE', name: 'Financials', icon: '💰' },
    { id: 'SYSTEM', name: 'System', icon: '⚙️' }
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-slate-800 text-white text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Administrative HQ</span>
            <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">• {user.role.replace('_', ' ')}</span>
          </div>
          <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">HashDoctor Command</h2>
        </div>
        
        {/* Panel Switcher */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl md:rounded-[1.8rem] border border-slate-200">
          {panels.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePanel(p.id as AdminPanel)}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${activePanel === p.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <span className="mr-2 hidden sm:inline">{p.icon}</span>{p.name}
            </button>
          ))}
        </div>
      </header>

      {/* --- OVERVIEW PANEL --- */}
      {activePanel === 'OVERVIEW' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="absolute -top-4 -right-4 text-6xl opacity-[0.03] group-hover:scale-110 transition-transform">{s.icon}</div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">{s.label}</p>
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-black text-slate-900">{s.value}</span>
                  <span className={`text-[10px] font-black mb-1.5 px-2 py-0.5 rounded-full ${s.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{s.trend}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm">
               <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-8">Platform Traffic Monitor</h3>
               <div className="h-64 flex items-end gap-2">
                  {[40, 70, 45, 90, 65, 80, 55, 100, 75, 85, 60, 95].map((h, i) => (
                    <div key={i} className="flex-1 bg-slate-50 rounded-t-xl relative group">
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-blue-600/10 group-hover:bg-blue-600/20 transition-all rounded-t-xl" 
                        style={{ height: `${h}%` }}
                      ></div>
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-blue-600 transition-all rounded-t-xl opacity-0 group-hover:opacity-100" 
                        style={{ height: `${h/2}%` }}
                      ></div>
                    </div>
                  ))}
               </div>
               <div className="flex justify-between mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <span>00:00</span>
                  <span>Peak Ops</span>
                  <span>23:59</span>
               </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
               <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl">🔒</div>
                  <h3 className="text-lg font-black tracking-tight mb-2">Security Audit</h3>
                  <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6">All administrative actions are being logged via encrypted blockchain hash.</p>
                  <div className="space-y-3">
                    {['User u-928 Update', 'Wallet Sync S-102', 'Login: Admin_CEO'].map((log, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        <span className="text-[10px] font-bold uppercase text-slate-300">{log}</span>
                      </div>
                    ))}
                  </div>
               </div>
               <div className="bg-emerald-600 text-white p-8 rounded-[2.5rem] shadow-xl shadow-emerald-100">
                  <h3 className="text-lg font-black tracking-tight mb-2">Settlement Ready</h3>
                  <p className="text-emerald-100 text-xs font-medium mb-6">14 Physician payouts pending verification.</p>
                  <button onClick={() => setActivePanel('FINANCE')} className="w-full bg-white text-emerald-600 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-50 transition-all">Go to Ledger</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- USERS PANEL --- */}
      {activePanel === 'USERS' && (
        <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-xl animate-in slide-in-from-bottom-4">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">User Governance</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Authorized Node Control</p>
            </div>
            <div className="relative w-full sm:w-80">
              <input 
                type="text" 
                placeholder="Search Identity or Email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-inner"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Role</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ledger Balance</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Security Ops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${u.isFrozen ? 'bg-red-50/20 opacity-70' : ''}`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <img src={u.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-md shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-800 truncate">{u.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${u.role === UserRole.PATIENT ? 'bg-blue-100 text-blue-700' : 'bg-slate-900 text-white'}`}>
                        {u.role.replace('ADMIN_', '')}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-black text-slate-800 text-sm">${u.walletBalance.toFixed(2)}</p>
                      <p className="text-[9px] text-emerald-600 font-bold uppercase">Escrow Locked</p>
                    </td>
                    <td className="px-8 py-6 text-right space-x-4">
                      <button onClick={() => handleEditClick(u)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Override</button>
                      <button 
                        onClick={() => toggleFreeze(u)}
                        className={`text-[10px] font-black uppercase tracking-widest hover:underline ${u.isFrozen ? 'text-emerald-600' : 'text-red-600'}`}
                      >
                        {u.isFrozen ? 'Authorize' : 'Freeze'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- FINANCE PANEL --- */}
      {activePanel === 'FINANCE' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Revenue Pool</h3>
                  <span className="text-emerald-600 font-black text-sm">+$4,290.00 This Week</span>
               </div>
               <div className="space-y-6">
                  {[
                    { label: 'Patient Subscriptions', value: 2400, color: 'bg-blue-600' },
                    { label: 'Consultation Fees', value: 1200, color: 'bg-emerald-600' },
                    { label: 'Admin Overrides', value: 690, color: 'bg-slate-800' }
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase">
                        <span>{item.label}</span>
                        <span>${item.value.toFixed(2)}</span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color}`} style={{ width: `${(item.value / 4290) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-8">
               <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Settlement Queue</h3>
               <div className="space-y-4">
                  {allUsers.filter(u => u.role === UserRole.DOCTOR).slice(0, 3).map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <img src={doc.avatar} className="w-10 h-10 rounded-full grayscale" alt="" />
                        <div>
                          <p className="text-xs font-black text-slate-800">{doc.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Pending Payout</p>
                        </div>
                      </div>
                      <button className="bg-white border border-slate-200 text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">Verify</button>
                    </div>
                  ))}
               </div>
               <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest">Batch settlement runs every Friday at 18:00 UTC.</p>
            </div>
          </div>
        </div>
      )}

      {/* --- SYSTEM PANEL --- */}
      {activePanel === 'SYSTEM' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'API Latency', value: '42ms', status: 'Healthy' },
                { label: 'DB Connections', value: '18/100', status: 'Optimal' },
                { label: 'AI Worker Load', value: '24%', status: 'Available' }
              ].map((m, i) => (
                <div key={i} className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{m.label}</p>
                   <div className="flex items-end justify-between">
                      <span className="text-2xl font-black text-white">{m.value}</span>
                      <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-2 py-1 rounded">{m.status}</span>
                   </div>
                </div>
              ))}
           </div>
           
           <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-8">System Audit Trail</h3>
              <div className="space-y-2">
                 {[
                   { user: 'Admin_CEO', action: 'Modified Payout Protocol', time: '2 mins ago' },
                   { user: 'System_Node', action: 'Daily Wallet Backup Completed', time: '1 hour ago' },
                   { user: 'Admin_Manager', action: 'Frozen User u-102 (Unverified ID)', time: '4 hours ago' },
                   { user: 'AI_Liaison', action: 'Emergency SOS Signal Triggered - Node 4', time: '8 hours ago' }
                 ].map((audit, i) => (
                   <div key={i} className="flex items-center justify-between py-4 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <div>
                          <p className="text-xs font-black text-slate-800">{audit.action}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Operator: {audit.user}</p>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">{audit.time}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Governance Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-8 md:p-12 shadow-2xl space-y-8 overflow-y-auto max-h-[90vh] border border-white">
            <header className="text-center">
               <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner">👤</div>
               <h3 className="text-2xl font-black text-slate-800 tracking-tight">Identity Override</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Administrative Governance Protocol</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none font-bold text-sm shadow-inner" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registry Email</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none font-bold text-sm shadow-inner" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gov ID Verify</label>
                <input type="text" value={editForm.idCardNumber} onChange={e => setEditForm({...editForm, idCardNumber: e.target.value})} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none font-bold text-sm shadow-inner" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Wallet Credit ($)</label>
                <input type="number" value={editForm.balance} onChange={e => setEditForm({...editForm, balance: Number(e.target.value)})} className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none font-bold text-sm shadow-inner" />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={handleSave} className="flex-1 bg-slate-900 text-white py-5 rounded-[1.8rem] font-black uppercase tracking-widest text-xs shadow-xl hover:bg-slate-800 transition-all active:scale-95">Commit Updates</button>
              <button onClick={() => setEditingUser(null)} className="px-10 py-5 rounded-[1.8rem] font-black uppercase tracking-widest text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
