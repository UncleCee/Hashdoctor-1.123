
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, CallSession, Message, Diagnosis } from '../../types.ts';
import { GoogleGenAI, Type } from "@google/genai";

interface DoctorDashboardProps {
  user: User;
  onUpdateUser: (data: Partial<User>) => void;
  patients: User[];
  activeCall: CallSession | null;
  onAcceptCall: () => void;
  onDeclineCall: () => void;
  onOpenChart: (patientId: string) => void;
  chatHistory: Record<string, Message[]>;
  onSendMessage: (toUserId: string, text: string) => void;
  activeSosCallerId: string | null;
  onRespondToSos: () => void;
  onFalseSos: (patientId: string, doctorId: string) => void;
  onSaveDiagnosis?: (patientId: string, diagnosis: Diagnosis) => void;
}

const CallTimer = ({ startTime }: { startTime: Date }) => {
  const [elapsed, setElapsed] = useState("00:00");
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const diff = Math.floor((now - start) / 1000);
      const m = Math.floor(diff / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setElapsed(`${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  return <span className="font-mono font-black text-3xl md:text-5xl text-emerald-400">{elapsed}</span>;
};

const DiagnosisForm: React.FC<{ 
  patient: User; 
  onSave: (diagnosis: Diagnosis) => void; 
  onClose: () => void;
  doctor: User;
  transcript: string;
}> = ({ patient, onSave, onClose, doctor, transcript }) => {
  const [condition, setCondition] = useState('');
  const [notes, setNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  const handleSmartExtract = async () => {
    if (!transcript) { alert("Session log is empty."); return; }
    setIsExtracting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this medical consultation log and extract the primary condition, detailed clinical notes, and suggested prescriptions. Log: "${transcript}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              condition: { type: Type.STRING },
              notes: { type: Type.STRING },
              prescription: { type: Type.STRING }
            },
            required: ['condition', 'notes', 'prescription']
          }
        }
      });
      const data = JSON.parse(response.text || "{}");
      setCondition(data.condition || '');
      setNotes(data.notes || '');
      setPrescription(data.prescription || '');
    } catch (e) { console.error(e); }
    setIsExtracting(false);
  };

  const handleSave = () => {
    if (!condition.trim()) { alert("Condition is required."); return; }
    onSave({ id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(), doctorId: doctor.id, doctorName: doctor.name, condition, notes, prescription });
    onClose();
  };

  return (
    <div className="bg-white rounded-[3rem] p-8 md:p-10 shadow-xl space-y-6 animate-in slide-in-from-bottom-4 relative overflow-hidden">
      <header className="flex items-center justify-between border-b border-slate-50 pb-4">
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Clinical Assessment</h3>
        <button onClick={handleSmartExtract} disabled={isExtracting} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all">
          {isExtracting ? 'AI Analyzing...' : '✨ Smart Auto-Fill'}
        </button>
      </header>
      <div className="space-y-4">
        <input type="text" value={condition} onChange={e => setCondition(e.target.value)} className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 outline-none font-bold" placeholder="Condition Name" />
        <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 outline-none text-sm" placeholder="Detailed Notes..." />
        <input type="text" value={prescription} onChange={e => setPrescription(e.target.value)} className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 outline-none text-sm" placeholder="Prescription Instructions" />
      </div>
      <button onClick={handleSave} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-emerald-700 transition-all">Commit to Registry</button>
      <p className="text-[8px] text-slate-400 text-center uppercase tracking-widest">Complex medical data can be sent via authorized clinical email.</p>
    </div>
  );
};

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ 
  user, onUpdateUser, patients, activeCall, onAcceptCall, onDeclineCall, onOpenChart, chatHistory, onSendMessage, activeSosCallerId, onRespondToSos, onFalseSos, onSaveDiagnosis
}) => {
  const [callInput, setCallInput] = useState("");
  const [activeCallTab, setActiveCallTab] = useState<'logs' | 'diagnosis'>('logs');
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const isConnected = activeCall?.receiverId === user.id && activeCall.status === 'connected';
  const caller = patients.find(p => p.id === activeCall?.callerId);

  const activeMessages = useMemo(() => {
    if (!caller) return [];
    const key = [user.id, caller.id].sort().join(':');
    return chatHistory[key] || [];
  }, [chatHistory, user.id, caller]);

  const transcriptSummary = useMemo(() => activeMessages.map(m => `[${m.senderId === user.id ? 'Dr' : 'Patient'}]: ${m.text}`).join('\n'), [activeMessages, user.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeMessages]);

  useEffect(() => {
    if (isConnected && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.onresult = (event: any) => {
        if (event.results[event.results.length - 1].isFinal && caller) {
          onSendMessage(caller.id, `[Voice transcript]: ${event.results[event.results.length - 1][0].transcript}`);
        }
      };
      recognitionRef.current.start();
    } else recognitionRef.current?.stop();
    return () => recognitionRef.current?.stop();
  }, [isConnected, caller]);

  const handleSendCallMessage = () => {
    if (!callInput.trim() || !caller) return;
    onSendMessage(caller.id, callInput);
    setCallInput("");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-blue-600 text-white text-[11px] font-black px-3 py-1 rounded uppercase tracking-widest">Clinical Console</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Doctor Overview</h2>
        </div>
      </header>

      {isConnected && (
        <div className="fixed inset-0 z-[200] bg-slate-900/98 backdrop-blur-3xl flex items-center justify-center p-6 lg:p-16 animate-in fade-in">
          <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 h-full max-h-[900px]">
            <div className="flex flex-col items-center justify-center space-y-12 bg-white/5 rounded-[4rem] p-14 border border-white/5 shadow-2xl relative">
              <div className="w-40 h-40 rounded-full border-4 border-white/10 mx-auto flex items-center justify-center text-7xl bg-white/5 shadow-2xl">👤</div>
              <h3 className="text-5xl md:text-7xl font-black text-white tracking-tight">{caller?.name}</h3>
              {activeCall?.startTime && <CallTimer startTime={activeCall.startTime} />}
              <button onClick={onDeclineCall} className="w-full bg-red-600 text-white py-7 rounded-[2rem] font-black uppercase text-sm shadow-xl active:scale-95">End Link</button>
            </div>
            <div className="flex flex-col bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                <div className="flex bg-slate-200/50 p-1.5 rounded-2xl">
                   <button onClick={() => setActiveCallTab('logs')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeCallTab === 'logs' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Session Logs</button>
                   <button onClick={() => setActiveCallTab('diagnosis')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeCallTab === 'diagnosis' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Diagnosis</button>
                </div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 bg-slate-50/10">
                {activeCallTab === 'logs' ? (
                  <div className="space-y-6">
                    {activeMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-5 rounded-2xl shadow-sm ${msg.senderId === user.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'}`}>
                          <p className="text-base font-bold leading-relaxed">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <DiagnosisForm patient={caller!} doctor={user} transcript={transcriptSummary} onSave={(diag) => { onSaveDiagnosis?.(caller!.id, diag); setActiveCallTab('logs'); }} onClose={() => setActiveCallTab('logs')} />
                )}
              </div>
              {activeCallTab === 'logs' && (
                <div className="p-8 border-t border-slate-100 bg-white flex gap-4 shrink-0">
                  <input type="text" value={callInput} onChange={(e) => setCallInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendCallMessage()} placeholder="Type clinical note or chat..." className="flex-1 px-8 py-5 rounded-[2rem] bg-slate-50 border border-slate-200 outline-none font-bold focus:ring-4 focus:ring-blue-100" />
                  <button onClick={handleSendCallMessage} className="bg-blue-600 text-white px-10 rounded-[2rem] font-black uppercase text-xs">Send</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        <div className="lg:col-span-8 bg-white rounded-[3rem] border border-slate-200 p-10 md:p-14 shadow-sm">
          <h3 className="font-black text-slate-800 mb-10 uppercase tracking-[0.5em] text-xs border-b border-slate-50 pb-8">Practice Registry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {patients.filter(p => chatHistory[[user.id, p.id].sort().join(':')]?.length > 0).map((p, idx) => (
               <div key={idx} className="p-8 rounded-[2.5rem] border border-slate-100 bg-slate-50/20 flex items-center justify-between group">
                 <div className="flex items-center gap-6">
                   <div className="w-16 h-16 rounded-full border-4 border-white shadow-md flex items-center justify-center text-2xl bg-white">👤</div>
                   <div>
                     <p className="text-xl font-black text-slate-800">{p.name}</p>
                     <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-1">ID: #{p.id.slice(-4)}</p>
                   </div>
                 </div>
                 <button onClick={() => onOpenChart(p.id)} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">📋</button>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
