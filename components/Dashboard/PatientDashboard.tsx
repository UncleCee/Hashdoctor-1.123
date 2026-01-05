
import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { User, CallSession, Message, UserRole } from '../../types.ts';
import { createPcmBlob, decode, decodeAudioData, generateSpeech, HASH_DOCTOR_KNOWLEDGE } from '../../services/geminiService.ts';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

interface PatientDashboardProps {
  user: User;
  onUpdateUser: (data: Partial<User>) => void;
  doctors: User[];
  onInitiateCall: (doctorId: string) => void;
  onInitiateSos: () => void;
  onOpenChat: (doctorId: string) => void;
  activeCall: CallSession | null;
  onEndCall: () => void;
  chatHistory: Record<string, Message[]>;
  onSendMessage: (toUserId: string, text: string) => void;
  onSaveSosDialogue: (patientId: string, dialogue: string[]) => void;
  setActiveTab: (tab: string) => void;
  onConfirmPayment: (docId: string, includeBonus: boolean) => "success" | "insufficient_funds" | undefined;
}

const DoctorIcon = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full fill-slate-800">
    <path d="M50 12c-6.6 0-12 5.4-12 12s5.4 12 12 12 12-5.4 12-12-5.4-12-12-12zm-28 58c0-11 9-20 20-20h16c11 0 20 9 20 20v18H22V70zm28-15c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8 3.6-8 8-8z" />
    <path d="M50 85c-1.1 0-2-.9-2-2V73c0-1.1.9-2 2-2s2 .9 2 2v10c0 1.1-.9 2-2 2z" className="fill-blue-500" />
    <path d="M30 65c-2.2 0-4 1.8-4 4v10M70 65c2.2 0 4 1.8 4 4v10" className="stroke-slate-400 fill-none stroke-2" />
  </svg>
);

const PatientDashboard: React.FC<PatientDashboardProps> = ({ 
  user, onUpdateUser, doctors, onInitiateCall, onInitiateSos, onOpenChat, activeCall, onEndCall, chatHistory, onSendMessage, onSaveSosDialogue, setActiveTab, onConfirmPayment
}) => {
  const [isIvrActive, setIsIvrActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isAiPreparingAudio, setIsAiPreparingAudio] = useState(false);
  const [transcriptionHistory, setTranscriptionHistory] = useState<string[]>([]);
  const [currentAIResponse, setCurrentAIResponse] = useState("");
  const [aiTextInput, setAiTextInput] = useState("");
  const [callTextInput, setCallTextInput] = useState("");
  const [isSosActive, setIsSosActive] = useState(false);
  
  const [pendingPaymentDoctorId, setPendingPaymentDoctorId] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success' | 'insufficient'>('details');

  const nextStartTimeRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const chatRef = useRef<any>(null); 
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const aiScrollRef = useRef<HTMLDivElement>(null);
  const callScrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  
  const aiBufferRef = useRef("");
  const userBufferRef = useRef("");

  const isConnected = activeCall?.callerId === user.id && activeCall.status === 'connected';
  const currentCallDoc = doctors.find(d => d.id === activeCall?.receiverId);

  const activeMessages = useMemo(() => {
    if (!currentCallDoc) return [];
    const key = [user.id, currentCallDoc.id].sort().join(':');
    return chatHistory[key] || [];
  }, [chatHistory, user.id, currentCallDoc]);

  useLayoutEffect(() => {
    if (aiScrollRef.current) aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
    if (callScrollRef.current) callScrollRef.current.scrollTop = callScrollRef.current.scrollHeight;
  }, [transcriptionHistory, currentAIResponse, activeMessages]);

  useEffect(() => {
    if (isConnected && !isIvrActive && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event: any) => {
        if (event.results[event.results.length - 1].isFinal && currentCallDoc) {
          onSendMessage(currentCallDoc.id, `[Voice Transcript]: ${event.results[event.results.length - 1][0].transcript}`);
        }
      };
      recognitionRef.current.start();
    } else recognitionRef.current?.stop();
    return () => recognitionRef.current?.stop();
  }, [isConnected, isIvrActive, currentCallDoc]);

  const setupAudioContext = (sampleRate: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate, latencyHint: 'interactive' });
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 2.25;
      gainNode.connect(audioContextRef.current.destination);
      gainNodeRef.current = gainNode;
    }
    return audioContextRef.current;
  };

  const startIvr = async () => {
    if (isConnecting) return;
    for (const source of sourcesRef.current) { try { source.stop(); } catch(e) {} }
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const ctx = setupAudioContext(24000);
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000, latencyHint: 'interactive' });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const currentSessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false); setIsIvrActive(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(2048, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then(session => session.sendRealtimeInput({ media: pcmBlob }));
              }
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const serverContent = msg.serverContent;
            if (!serverContent) return;
            if (serverContent.modelTurn) setIsAiPreparingAudio(true);
            if (serverContent.outputTranscription) {
              aiBufferRef.current += serverContent.outputTranscription.text;
              setCurrentAIResponse(aiBufferRef.current);
              setIsAiThinking(false);
            }
            if (serverContent.turnComplete) {
              const a = aiBufferRef.current.trim();
              if (a) setTranscriptionHistory(prev => [...prev, `AI: ${a}`]);
              aiBufferRef.current = ""; setCurrentAIResponse("");
              setIsAiThinking(false); setIsAiPreparingAudio(false);
            }
            const base64Audio = serverContent.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current && gainNodeRef.current) {
              const ctx = audioContextRef.current;
              if (nextStartTimeRef.current < ctx.currentTime) nextStartTimeRef.current = ctx.currentTime + 0.05;
              const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer; source.connect(gainNodeRef.current);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: `You are the Multilingual AI Assistant for HashDoctor. ${HASH_DOCTOR_KNOWLEDGE}`,
        }
      });
      sessionPromiseRef.current = currentSessionPromise;
    } catch (e) { setIsConnecting(false); sessionPromiseRef.current = null; }
  };

  const handleSendAiText = async () => {
    if (!aiTextInput.trim()) return;
    const text = aiTextInput.trim();
    setTranscriptionHistory(prev => [...prev, `You: ${text}`]);
    setAiTextInput("");
    setIsAiThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      if (!chatRef.current) chatRef.current = ai.chats.create({ model: 'gemini-3-flash-preview', config: { systemInstruction: `You are the Multilingual AI Assistant for HashDoctor. ${HASH_DOCTOR_KNOWLEDGE}` } });
      const response = await chatRef.current.sendMessageStream({ message: text });
      let fullResponseText = "";
      for await (const chunk of response) {
        fullResponseText += chunk.text;
        setCurrentAIResponse(fullResponseText);
        setIsAiThinking(false);
      }
      setTranscriptionHistory(prev => [...prev, `AI: ${fullResponseText}`]);
      setCurrentAIResponse("");
    } catch (e) { setIsAiThinking(false); chatRef.current = null; }
  };

  const handleSendCallText = () => {
    if (!callTextInput.trim() || !currentCallDoc) return;
    onSendMessage(currentCallDoc.id, callTextInput);
    setCallTextInput("");
  };

  const handleActionClick = (docId: string) => {
    const doc = doctors.find(d => d.id === docId);
    if (!doc?.isOnline) { alert("Specialist is offline."); return; }
    const lastPayment = user.transactions
      .filter(t => t.type === 'payment' && t.recipientId === docId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const isSessionActive = lastPayment && (Date.now() - new Date(lastPayment.date).getTime() < 15 * 60 * 1000);
    if (user.isSubscribed || isSessionActive) onInitiateCall(docId);
    else { setPaymentStep('details'); setPendingPaymentDoctorId(docId); }
  };

  const processLocalPayment = () => {
    if (!pendingPaymentDoctorId) return;
    setPaymentStep('processing');
    setTimeout(() => {
      const result = onConfirmPayment(pendingPaymentDoctorId, false);
      if (result === "success") {
        setPaymentStep('success');
        setTimeout(() => { setPendingPaymentDoctorId(null); handleActionClick(pendingPaymentDoctorId!); }, 1500);
      } else setPaymentStep('insufficient');
    }, 2000);
  };

  const doctor = doctors.find(d => d.id === pendingPaymentDoctorId);

  return (
    <div className="space-y-6 md:space-y-10 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">Patient Dashboard</h2>
          <p className="text-slate-500 font-bold text-sm">Wallet: <span className="text-blue-600">${user.walletBalance.toFixed(2)}</span></p>
        </div>
        <button onClick={() => { if(isSosActive) { setIsSosActive(false); onEndCall(); } else { setIsSosActive(true); onInitiateSos(); startIvr(); } }} className={`w-full md:w-auto px-12 py-5 rounded-2xl font-black text-base transition-all ${isSosActive ? 'bg-red-600 text-white animate-pulse' : 'bg-red-50 text-red-600 shadow-red-100 uppercase'}`}>SOS EMERGENCY</button>
      </header>

      {pendingPaymentDoctorId && (
        <div className="fixed inset-0 z-[300] bg-slate-900/98 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 md:p-14 text-center shadow-2xl overflow-y-auto max-h-[95vh]">
              {paymentStep === 'details' && (
                <div className="space-y-8 animate-in zoom-in-95">
                  <h3 className="text-2xl md:text-4xl font-black text-slate-900">Link Fee Authorization</h3>
                  <p className="text-slate-500 text-lg">Establishing clinical link with <span className="text-blue-600 font-black">{doctor?.name}</span>. Fee: ${doctor?.consultationFee?.toFixed(2)}</p>
                  <button onClick={processLocalPayment} className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl">Confirm & Pay</button>
                  <button onClick={() => setPendingPaymentDoctorId(null)} className="text-xs font-black text-slate-400 uppercase">Cancel</button>
                </div>
              )}
              {paymentStep === 'processing' && <div className="py-20 animate-spin text-4xl">🔐</div>}
              {paymentStep === 'success' && <div className="py-20 text-emerald-500 font-black text-2xl animate-bounce">Approved ✓</div>}
           </div>
        </div>
      )}

      {isConnected && (
        <div className="fixed inset-0 z-[200] bg-slate-900/98 backdrop-blur-2xl flex flex-col p-4 md:p-10 text-white">
          <div className="flex-1 flex flex-col md:flex-row gap-8 max-w-7xl mx-auto w-full h-full overflow-hidden">
             <div className="w-full md:w-1/2 flex flex-col items-center justify-center space-y-8 bg-white/5 rounded-[3rem] p-10 border border-white/10">
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-blue-500/30 p-8 bg-white/5 shadow-2xl relative flex items-center justify-center text-8xl">🩺</div>
                <div className="text-center">
                  <h3 className="text-4xl md:text-6xl font-black tracking-tight">{currentCallDoc?.name}</h3>
                  <p className="text-blue-400 font-black uppercase tracking-[0.4em] text-sm mt-4">Clinical Link Active</p>
                </div>
                <button onClick={onEndCall} className="w-24 h-24 bg-red-600 text-white rounded-full flex items-center justify-center text-4xl shadow-2xl hover:scale-110 active:scale-95 transition-all">✕</button>
             </div>
             <div className="flex-1 flex flex-col bg-white rounded-[3rem] overflow-hidden text-slate-900">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                   <h4 className="font-black text-slate-400 uppercase tracking-widest text-xs">Session Transcript Log</h4>
                   <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                </div>
                <div ref={callScrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/10">
                   {activeMessages.map((msg) => (
                     <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-5 rounded-2xl shadow-sm ${msg.senderId === user.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'}`}>
                          <p className="text-base font-bold leading-relaxed">{msg.text}</p>
                        </div>
                     </div>
                   ))}
                </div>
                <div className="p-6 border-t border-slate-100 bg-white flex gap-4 shrink-0">
                   <input type="text" value={callTextInput} onChange={(e) => setCallTextInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendCallText()} placeholder="Type clinical detail..." className="flex-1 px-8 py-4 rounded-full bg-slate-50 border border-slate-200 outline-none font-bold" />
                   <button onClick={handleSendCallText} className="bg-blue-600 text-white px-10 rounded-full font-black uppercase text-xs">Send</button>
                </div>
             </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col h-[600px] md:h-[750px] bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-2xl relative">
          <div className="p-6 border-b border-slate-100 bg-blue-50/30 flex items-center gap-6 shrink-0">
             <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg">AI</div>
             <div>
                <h3 className="font-black text-slate-800 text-xl leading-tight uppercase tracking-tight">AI Medical Assistant</h3>
                <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mt-1">Live Evaluation Protocol</p>
             </div>
          </div>
          <div ref={aiScrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/10">
             {transcriptionHistory.map((t, i) => (
               <div key={i} className={`flex ${t.startsWith('You:') ? 'justify-end' : 'justify-start'}`}>
                 <div className={`p-6 rounded-[2.5rem] max-w-[85%] text-2xl font-black shadow-lg border ${t.startsWith('You:') ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' : 'bg-white border-slate-100 text-slate-900 rounded-tl-none'}`}>
                   {t.replace(/^(You:|AI:)\s*/, '')}
                 </div>
               </div>
             ))}
             {currentAIResponse && (
               <div className="flex justify-start">
                 <div className="bg-white border-2 border-blue-200 p-8 rounded-[3rem] max-w-[92%] text-2xl font-black text-slate-900 shadow-2xl rounded-tl-none">
                    {currentAIResponse}<span className="inline-block w-3 h-8 bg-blue-600 animate-pulse ml-3 align-middle"></span>
                 </div>
               </div>
             )}
          </div>
          <div className="p-8 border-t border-slate-100 bg-white space-y-6">
             <div className="flex gap-4">
                <input type="text" value={aiTextInput} onChange={(e) => setAiTextInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendAiText()} placeholder="Type symptom or query..." className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-8 py-5 font-bold outline-none focus:ring-4 focus:ring-blue-100" />
                <button onClick={handleSendAiText} className="bg-blue-600 text-white px-12 rounded-full font-black uppercase tracking-widest text-xs">Submit</button>
             </div>
             <button onClick={startIvr} disabled={isConnecting || isIvrActive} className={`w-full py-6 rounded-full font-black uppercase tracking-widest text-xs transition-all ${isIvrActive ? 'bg-red-50 text-red-600' : 'bg-blue-600 text-white shadow-blue-100'}`}>
                {isConnecting ? 'Linking...' : isIvrActive ? 'Session Active' : 'Start Voice Consultation'}
             </button>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
           <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
              <h3 className="font-black text-slate-800 mb-8 uppercase tracking-[0.4em] text-xs border-b border-slate-50 pb-6">Specialist Directory</h3>
              <div className="space-y-6">
                 {doctors.map((doc, idx) => (
                   <div key={idx} className="flex items-center justify-between p-6 rounded-[2rem] border border-slate-50 bg-white hover:bg-slate-50/50 transition-all group">
                     <div className="flex items-center gap-5 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-16 h-16 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform flex items-center justify-center text-3xl">🩺</div>
                          <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white ${doc.isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-black text-slate-800 truncate">{doc.name}</p>
                          <p className="text-[10px] text-blue-600 font-black uppercase truncate tracking-widest mt-1">{doc.specialization}</p>
                        </div>
                     </div>
                     <button onClick={() => handleActionClick(doc.id)} className={`p-5 rounded-2xl shadow-lg transition-all text-2xl ${doc.isOnline ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>📞</button>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
