
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { mockDatabase } from '../services/mockDatabase.ts';

interface SettingsViewProps {
  user: User;
  onUpdateUser: (data: Partial<User>) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    password: user.password || 'password123',
    idCardNumber: user.idCardNumber || '',
    age: user.medicalRecord?.age || 0,
    ailments: user.medicalRecord?.ailments.join(', ') || '',
    conditions: user.medicalRecord?.conditions.join(', ') || '',
    bankName: user.bankAccount?.bankName || '',
    accountNumber: user.bankAccount?.accountNumber || '',
    accountName: user.bankAccount?.accountName || user.name,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    setTimeout(() => {
      onUpdateUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        idCardNumber: formData.idCardNumber,
        medicalRecord: {
          ...user.medicalRecord,
          age: Number(formData.age),
          ailments: formData.ailments.split(',').map(s => s.trim()).filter(Boolean),
          conditions: formData.conditions.split(',').map(s => s.trim()).filter(Boolean),
          lastCheckup: user.medicalRecord?.lastCheckup || new Date().toISOString()
        } as any,
        bankAccount: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountName: formData.accountName,
        }
      });
      setIsSaving(false);
      alert("Security Profile Updated Successfully");
    }, 1000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const success = mockDatabase.importSnapshot(event.target?.result as string);
      if (success) {
        alert("Database successfully imported. Refreshing platform...");
        window.location.reload();
      } else {
        alert("Import failed. Invalid snapshot file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">User Governance</span>
        <h2 className="text-3xl font-black text-slate-900 mt-1">Authorized Profile Settings</h2>
        <p className="text-slate-500 font-medium">Update your identity, clinical history, and migration status.</p>
      </header>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Core Identity */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
            <span className="text-xl">👤</span>
            <h3 className="font-bold text-slate-800">Identity & Security</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-blue-100 font-medium" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-blue-100 font-medium" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Password</label>
              <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-blue-100 font-medium" />
            </div>
          </div>
        </section>

        {/* Data Portability Section */}
        <section className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 text-6xl">📤</div>
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <h3 className="font-black uppercase tracking-widest text-sm">Data Migration & Portability</h3>
          </div>
          <p className="text-slate-400 text-xs font-bold leading-relaxed uppercase">Prepare this instance for transfer. You can export the current clinical state as a JSON snapshot and import it on a different account or device.</p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              type="button"
              onClick={() => mockDatabase.exportFullSnapshot()}
              className="px-8 py-4 bg-blue-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/40"
            >Export Database Snapshot</button>
            
            <label className="px-8 py-4 bg-slate-800 border border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] cursor-pointer hover:bg-slate-700 transition-all">
              Import Database Snapshot
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>

            <button 
              type="button"
              onClick={() => { if(confirm("Wipe all local data? This cannot be undone.")) mockDatabase.resetDatabase(); }}
              className="px-8 py-4 bg-red-600/20 text-red-400 border border-red-400/20 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-600 hover:text-white transition-all"
            >Factory Reset (Wipe Data)</button>
          </div>
        </section>

        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={isSaving}
            className="bg-blue-600 text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? 'Synching Security Profile...' : 'Authorize Profile Update'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsView;
