
import React, { useState, useMemo } from 'react';
import { User, Message, UserRole } from '../types.ts';

interface MessagesViewProps {
  currentUser: User;
  allUsers: User[];
  initialChatUserId?: string | null;
  chatHistory: Record<string, Message[]>;
}

const MessagesView: React.FC<MessagesViewProps> = ({ 
  currentUser, 
  allUsers, 
  initialChatUserId, 
  chatHistory
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(initialChatUserId || null);
  
  const contacts = useMemo(() => allUsers.filter(u => {
    const key = [currentUser.id, u.id].sort().join(':');
    return chatHistory[key] && chatHistory[key].length > 0;
  }), [allUsers, chatHistory, currentUser.id]);

  const selectedUser = useMemo(() => contacts.find(u => u.id === selectedUserId), [contacts, selectedUserId]);

  const activeMessages = useMemo(() => {
    if (!selectedUserId) return [];
    const key = [currentUser.id, selectedUserId].sort().join(':');
    return chatHistory[key] || [];
  }, [chatHistory, currentUser.id, selectedUserId]);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-14rem)] bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl relative">
      <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50/30 shrink-0 ${selectedUserId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Consultation Logs</h3>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Historical Records Only</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs font-black uppercase opacity-50">No Historical Records</div>
          ) : (
            contacts.map(contact => (
              <button key={contact.id} onClick={() => setSelectedUserId(contact.id)} className={`w-full p-4 flex items-center gap-3 transition-colors border-b border-slate-50 ${selectedUserId === contact.id ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}>
                <div className="w-10 h-10 rounded-full border border-slate-100 shadow-sm bg-slate-100 flex items-center justify-center text-lg">👤</div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{contact.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{contact.role.replace('ADMIN_', '')}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {selectedUser ? (
        <div className="flex-1 flex flex-col bg-white">
          <div className="p-6 border-b border-slate-100 bg-slate-50/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedUserId(null)} className="md:hidden text-2xl font-black">←</button>
              <h4 className="font-black text-slate-800 uppercase tracking-tight">Record: {selectedUser.name}</h4>
            </div>
            <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full">Archive View</span>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl text-amber-700 text-[10px] font-black uppercase tracking-widest text-center mb-6">
              You are viewing an archived consultation log.
            </div>
            {activeMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-5 rounded-2xl shadow-sm ${msg.senderId === currentUser.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-tl-none'}`}>
                  <p className="text-sm md:text-base font-bold leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/20 opacity-50">
          <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-4xl shadow-xl mb-8">📚</div>
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Clinical Archives</h3>
        </div>
      )}
    </div>
  );
};

export default MessagesView;
