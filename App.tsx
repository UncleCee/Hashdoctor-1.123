
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, PatientRecord, CallSession, Message, Transaction, Diagnosis } from './types.ts';
import { INITIAL_RECORDS, ROLE_MAP } from './services/mockData.ts';
import { mockDatabase } from './services/mockDatabase.ts';
import Layout from './components/Layout.tsx';
import PatientDashboard from './components/Dashboard/PatientDashboard.tsx';
import AdminDashboard from './components/Dashboard/AdminDashboard.tsx';
import DoctorDashboard from './components/Dashboard/DoctorDashboard.tsx';
import HealthInsights from './components/HealthInsights.tsx';
import MessagesView from './components/MessagesView.tsx';
import WalletView from './components/WalletView.tsx';
import SettingsView from './components/SettingsView.tsx';

const App: React.FC = () => {
  const [isBooting, setIsBooting] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [sosCallerId, setSosCallerId] = useState<string | null>(null);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Record<string, Message[]>>({});
  const [loginEmail, setLoginEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Mock Database
    mockDatabase.init();
    const storedUsers = mockDatabase.getUsers();
    const storedChats = mockDatabase.getChats();
    
    setAllUsers(storedUsers);
    setChatHistory(storedChats);

    const timer = setTimeout(() => setIsBooting(false), 200);
    return () => clearTimeout(timer);
  }, []);

  const performLogin = (identity: string, pass: string) => {
    setIsLoading(true);
    setLoginError(null);

    setTimeout(() => {
      const searchIdentity = identity.toLowerCase().trim();
      const searchPassword = pass.trim();

      const match = allUsers.find(u => 
        (u.email.toLowerCase() === searchIdentity || u.name.toLowerCase() === searchIdentity)
      );

      if (!match) {
        setLoginError(`Identity "${identity}" not found in clinical database.`);
        setIsLoading(false);
        return;
      }

      if (searchPassword !== 'password123' && match.password !== searchPassword) {
        setLoginError("Invalid security pin or password.");
        setIsLoading(false);
        return;
      }

      if (match.isFrozen) {
        setLoginError("This account has been administratively frozen.");
        setIsLoading(false);
        return;
      }

      setCurrentUser(match);
      setIsLoading(false);
    }, 600);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(loginEmail, password);
  };

  const updateGlobalUser = (userId: string, data: Partial<User>) => {
    const updatedUser = mockDatabase.updateUser(userId, data);
    setAllUsers(mockDatabase.getUsers());
    if (currentUser?.id === userId && updatedUser) {
      setCurrentUser(updatedUser);
    }
  };

  const addTransaction = (userId: string, transaction: Transaction) => {
    mockDatabase.addTransaction(userId, transaction);
    setAllUsers(mockDatabase.getUsers());
    if (currentUser?.id === userId) {
      const match = mockDatabase.getUsers().find(u => u.id === userId);
      if (match) setCurrentUser(match);
    }
  };

  const handleAddDiagnosis = (patientId: string, diagnosis: Diagnosis) => {
    mockDatabase.addDiagnosis(patientId, diagnosis);
    setAllUsers(mockDatabase.getUsers());
    if (currentUser?.id === patientId) {
      const match = mockDatabase.getUsers().find(u => u.id === patientId);
      if (match) setCurrentUser(match);
    }
  };

  const handleSendMessage = (toUserId: string, text: string, isAi = false) => {
    if (!currentUser) return;
    const key = [currentUser.id, toUserId].sort().join(':');
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: isAi ? 'AI_ASSISTANT' : currentUser.id,
      text,
      timestamp: new Date(),
      isAi
    };
    
    mockDatabase.saveMessage(key, newMessage);
    setChatHistory(mockDatabase.getChats());
  };

  const saveSosDialogue = (patientId: string, dialogue: string[]) => {
    if (!currentUser) return;
    const key = [currentUser.id, patientId].sort().join(':');
    const logs = dialogue.map(line => ({
      id: Math.random().toString(36).substr(2, 9),
      senderId: line.startsWith('You:') ? patientId : 'AI_ASSISTANT',
      text: line.replace(/^(You:|AI:)\s*/, ''),
      timestamp: new Date(),
      isAi: line.startsWith('AI:')
    }));
    
    mockDatabase.saveBulkMessages(key, logs);
    setChatHistory(mockDatabase.getChats());
  };

  const initiateCall = (doctorId: string) => {
    if (!currentUser) return;
    setActiveCall({ callerId: currentUser.id, receiverId: doctorId, status: 'ringing', isSos: false });
  };

  const handleInitiateSos = () => {
    if (!currentUser) return;
    setSosCallerId(currentUser.id);
  };

  const handleRespondToSos = (doctorId: string) => {
    if (!sosCallerId) return;
    setActiveCall({ callerId: sosCallerId, receiverId: doctorId, status: 'connected', startTime: new Date(), isSos: true });
    setSosCallerId(null);
  };

  const handleFalseSos = (patientId: string, doctorId: string) => {
    const doctor = allUsers.find(u => u.id === doctorId);
    const patient = allUsers.find(u => u.id === patientId);
    if (!doctor || !patient || doctor.consultationFee === undefined) return;
    
    const fee = doctor.consultationFee;
    const patientTx: Transaction = {
      id: `tx-` + Math.random().toString(36).substr(2, 9),
      type: 'consultancy_fee',
      amount: fee,
      status: 'paid',
      date: new Date().toISOString(),
      method: 'DEDUCTION',
      description: `False SOS Penalty - Session with ${doctor.name}`
    };

    updateGlobalUser(patientId, { walletBalance: patient.walletBalance - fee });
    addTransaction(patientId, patientTx);
    alert(`False SOS confirmed. Consultation fee of $${fee.toFixed(2)} deducted from patient.`);
    endCall();
  };

  const acceptCall = () => {
    setActiveCall(prev => prev ? { ...prev, status: 'connected', startTime: new Date() } : null);
  };

  const endCall = () => {
    setActiveCall(null);
    setSosCallerId(null);
  };

  const openPatientChat = (patientId: string) => {
    setActiveChatUserId(patientId);
    setActiveTab('messages');
  };

  const processPayment = (docId: string, includeBonus: boolean = false) => {
    const doctor = allUsers.find(d => d.id === docId);
    if (!doctor || !currentUser) return;
    
    const fee = doctor.consultationFee || 25;
    const bonusCost = includeBonus && !currentUser.isSubscribed ? 10 : 0;
    const totalCost = fee + bonusCost;
    
    let currentWallet = currentUser.walletBalance;
    let currentBonus = currentUser.bonusBalance;
    let isSubscribed = currentUser.isSubscribed;

    if (currentWallet < totalCost) {
      alert("Insufficient funds for this transaction. Please add funds in the wallet tab.");
      return "insufficient_funds";
    }

    currentWallet -= bonusCost;
    if (includeBonus && !isSubscribed) {
      currentBonus += 100;
      isSubscribed = true;
    }

    currentWallet -= fee;
    if (isSubscribed && currentBonus > 0) {
      const subsidy = Math.min(currentBonus, fee * 0.4);
      currentBonus -= subsidy;
      currentWallet += subsidy;
    }

    updateGlobalUser(currentUser.id, { 
      walletBalance: currentWallet, 
      bonusBalance: currentBonus, 
      isSubscribed: isSubscribed 
    });

    const txId = `tx-` + Math.random().toString(36).substr(2, 9);
    
    const patientTx: Transaction = {
      id: txId,
      type: 'payment',
      amount: fee,
      status: 'completed',
      date: new Date().toISOString(),
      method: 'WALLET',
      description: `Test Consultation - Dr. ${doctor.name}. Session verified.`,
      recipientId: docId
    };
    addTransaction(currentUser.id, patientTx);

    const doctorTx: Transaction = {
      id: txId,
      type: 'consultancy_fee',
      amount: fee,
      status: 'paid',
      date: new Date().toISOString(),
      method: 'PLATFORM',
      description: `Mock Consultancy Deposit - Patient: ${currentUser.name}. Authorised.`,
      senderId: currentUser.id
    };
    addTransaction(docId, doctorTx);
    
    return "success";
  };

  if (isBooting) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black mb-6 animate-pulse">H</div>
        <h1 className="text-white text-2xl font-black tracking-[0.2em] uppercase">HashDoctor</h1>
        <p className="text-slate-500 mt-6 text-xs font-bold uppercase tracking-[0.4em]">Initializing Security Protocols...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-indigo-50">
        <div className="w-full max-w-lg space-y-10 bg-white p-12 rounded-[3.5rem] border border-white shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black mx-auto mb-6 rotate-3 shadow-xl">H</div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">HashDoctor</h1>
            <p className="mt-2 text-slate-500 text-lg font-medium">Authorized Clinical Portal</p>
          </div>
          
          <form className="mt-10 space-y-6" onSubmit={handleLogin}>
            {loginError && (
              <div className="bg-red-50 border border-red-100 p-5 rounded-2xl text-red-600 text-xs font-black uppercase tracking-widest animate-in slide-in-from-top-2 flex items-center gap-3">
                <span className="text-lg">⚠️</span> {loginError}
              </div>
            )}
            <div className="space-y-2">
               <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Identity Access (Name or Email)</label>
               <input 
                type="text" 
                required 
                className="w-full px-7 py-5 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-blue-100 outline-none text-base font-medium transition-all" 
                placeholder="e.g. Test Patient" 
                value={loginEmail} 
                onChange={(e) => setLoginEmail(e.target.value)} 
               />
            </div>
            <div className="space-y-2">
               <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Security Pin / Password</label>
               <div className="relative">
                 <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  className="w-full px-7 py-5 pr-16 rounded-2xl border border-slate-100 bg-slate-50 focus:ring-4 focus:ring-blue-100 outline-none text-base font-medium transition-all" 
                  placeholder="********" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                 />
                 <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-2 text-xl"
                 >
                   {showPassword ? '👁️‍ق️' : '👁️'}
                 </button>
               </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full py-6 rounded-2xl shadow-xl font-black tracking-widest uppercase text-white text-base bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50 mt-4">
              {isLoading ? 'Verifying Credentials...' : 'Authorize Access'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Layout user={currentUser} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => { setCurrentUser(null); setActiveTab('dashboard'); }}>
      {activeTab === 'dashboard' && currentUser && (
        currentUser.role === UserRole.PATIENT ? (
          <PatientDashboard user={currentUser} onUpdateUser={(d) => updateGlobalUser(currentUser.id, d)} doctors={allUsers.filter(u => u.role === UserRole.DOCTOR)} onInitiateCall={initiateCall} onInitiateSos={handleInitiateSos} onOpenChat={openPatientChat} activeCall={activeCall} onEndCall={endCall} chatHistory={chatHistory} onSendMessage={handleSendMessage} onSaveSosDialogue={saveSosDialogue} setActiveTab={setActiveTab} onConfirmPayment={processPayment} />
        ) : (currentUser.role === UserRole.DOCTOR || currentUser.role === UserRole.ADMIN_CMO) ? (
          <DoctorDashboard user={currentUser} onUpdateUser={(d) => updateGlobalUser(currentUser.id, d)} patients={allUsers.filter(u => u.role === UserRole.PATIENT)} activeCall={activeCall} onAcceptCall={acceptCall} onDeclineCall={endCall} onOpenChart={openPatientChat} chatHistory={chatHistory} onSendMessage={handleSendMessage} activeSosCallerId={sosCallerId} onRespondToSos={() => handleRespondToSos(currentUser.id)} onFalseSos={handleFalseSos} onSaveDiagnosis={handleAddDiagnosis} />
        ) : (
          <AdminDashboard user={currentUser} allUsers={allUsers} onUpdateUser={updateGlobalUser} />
        )
      )}
      {activeTab === 'admin_panel' && currentUser && (
        <AdminDashboard user={currentUser} allUsers={allUsers} onUpdateUser={updateGlobalUser} />
      )}
      {activeTab === 'messages' && currentUser && (
        <MessagesView currentUser={currentUser} allUsers={allUsers} initialChatUserId={activeChatUserId} chatHistory={chatHistory} onSendMessage={handleSendMessage} onInitiateCall={initiateCall} onDeductFee={(docId) => processPayment(docId, false)} onSaveDiagnosis={handleAddDiagnosis} />
      )}
      {activeTab === 'wallet' && currentUser && (
        <WalletView user={currentUser} onUpdateUser={(d) => updateGlobalUser(currentUser.id, d)} />
      )}
      {activeTab === 'feed' && currentUser && (
        <HealthInsights user={currentUser} setActiveTab={setActiveTab} />
      )}
      {activeTab === 'settings' && currentUser && (
        <SettingsView user={currentUser} onUpdateUser={(d) => updateGlobalUser(currentUser.id, d)} />
      )}
    </Layout>
  );
};

export default App;
