
import React, { useState } from 'react';
import { User, UserRole, Transaction } from '../types.ts';

interface WalletViewProps {
  user: User;
  onUpdateUser: (data: Partial<User>) => void;
}

type DepositStep = 'amount' | 'method' | 'card_entry' | 'processing' | 'success';

const WalletView: React.FC<WalletViewProps> = ({ user, onUpdateUser }) => {
  const [isDonating, setIsDonating] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositStep, setDepositStep] = useState<DepositStep>('amount');
  const [depositAmount, setDepositAmount] = useState<string>("100");
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [feeInput, setFeeInput] = useState(user.consultationFee?.toString() || "25");
  
  // Mock Card State
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: user.name
  });

  const handleActivateBonus = () => {
    if (user.walletBalance < 10) {
      alert("Insufficient funds in Main Balance to unlock bonus. Please deposit at least $10.00 first.");
      return;
    }
    
    setIsDonating(true);
    setTimeout(() => {
      onUpdateUser({ 
        isSubscribed: true,
        walletBalance: user.walletBalance - 10,
        bonusBalance: user.bonusBalance + 100
      });
      setIsDonating(false);
      alert("Signup Bonus activated! You now have a $100.00 Clinical Subsidy pool. 40% of every future session fee will be refunded back to your wallet from company earnings until the pool is empty.");
    }, 1500);
  };

  const handleUpdateFee = () => {
    const feeValue = parseFloat(feeInput);
    if (!isNaN(feeValue) && feeValue >= 0) {
      onUpdateUser({ consultationFee: feeValue });
      alert("Practice consultation fee updated!");
    }
  };

  const startDepositFlow = () => {
    setDepositStep('amount');
    setShowDepositModal(true);
  };

  const proceedToMethods = () => {
    if (parseFloat(depositAmount) <= 0 || isNaN(parseFloat(depositAmount))) {
      alert("Please enter a valid deposit amount.");
      return;
    }
    setDepositStep('method');
  };

  const selectMethod = (method: string) => {
    setSelectedMethod(method);
    if (method === 'KORAPAY' || method === 'STRIPE') {
      setDepositStep('card_entry');
    } else {
      handleFinalizeDeposit(method);
    }
  };

  const handleFinalizeDeposit = (method: string) => {
    setDepositStep('processing');
    
    // Simulate Gateway Response
    setTimeout(() => {
      const amount = parseFloat(depositAmount);
      const newTransaction: Transaction = {
        id: `tx-dep-${Math.random().toString(36).substr(2, 9)}`,
        type: 'deposit',
        amount: amount,
        status: 'completed',
        date: new Date().toISOString(),
        method: method,
        description: `Wallet Funding via ${method}`
      };

      onUpdateUser({
        walletBalance: user.walletBalance + amount,
        transactions: [newTransaction, ...user.transactions]
      });
      
      setDepositStep('success');
    }, 3000);
  };

  const hasDonated = user.isSubscribed;
  const isPatient = user.role === UserRole.PATIENT;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20 relative">
      <header>
        <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Financial Portal</span>
        <h2 className="text-3xl font-black text-slate-900 mt-1">HashWallet</h2>
        <p className="text-slate-500 font-medium">Manage your clinical funds, company-funded bonuses, and settlement status.</p>
      </header>

      {showDepositModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-md p-8 md:p-14 shadow-2xl space-y-8 border border-white relative overflow-hidden">
            
            {depositStep === 'amount' && (
              <div className="space-y-8 animate-in zoom-in-95">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">💰</div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Fund Wallet</h3>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Enter amount to deposit (USD)</p>
                </div>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-300">$</span>
                  <input 
                    type="number" 
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full pl-12 pr-8 py-8 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-4xl font-black text-slate-900 outline-none focus:border-blue-500 transition-all text-center"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['25', '50', '100', '250', '500', '1000'].map(val => (
                    <button key={val} onClick={() => setDepositAmount(val)} className={`py-3 rounded-xl font-black text-xs border transition-all ${depositAmount === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200'}`}>${val}</button>
                  ))}
                </div>
                <button onClick={proceedToMethods} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-black transition-all">Proceed to Payment</button>
              </div>
            )}

            {depositStep === 'method' && (
              <div className="space-y-8 animate-in slide-in-from-right-4">
                <div className="text-center">
                  <p className="text-blue-600 font-black text-3xl mb-2">${parseFloat(depositAmount).toFixed(2)}</p>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Select Gateway</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: 'KORAPAY', label: 'Korapay (Card/Bank/Mobile)', icon: '💳' },
                    { id: 'BANK', label: 'Direct Bank Transfer', icon: '🏦' },
                    { id: 'CRYPTO', label: 'USDT / Bitcoin (Lightning)', icon: '⚡' },
                    { id: 'STRIPE', label: 'International Card (Stripe)', icon: '🌍' }
                  ].map((method) => (
                    <button 
                      key={method.id}
                      onClick={() => selectMethod(method.id)}
                      className="w-full p-6 rounded-2xl border border-slate-100 bg-white hover:bg-blue-50 hover:border-blue-100 transition-all flex items-center justify-between group shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{method.icon}</span>
                        <span className="text-sm font-black text-slate-800 uppercase tracking-widest">{method.label}</span>
                      </div>
                      <span className="text-slate-300 group-hover:text-blue-500 transition-colors">→</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setDepositStep('amount')} className="w-full text-xs font-black text-slate-400 uppercase tracking-widest">Back</button>
              </div>
            )}

            {depositStep === 'card_entry' && (
              <div className="space-y-8 animate-in zoom-in-95">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-4">💳</div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Secure Card Entry</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Paying via {selectedMethod}</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Card Number</label>
                    <input 
                      type="text" 
                      placeholder="4242 4242 4242 4242"
                      value={cardDetails.number}
                      onChange={e => setCardDetails({...cardDetails, number: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl font-mono text-lg outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry (MM/YY)</label>
                      <input 
                        type="text" 
                        placeholder="12/28"
                        value={cardDetails.expiry}
                        onChange={e => setCardDetails({...cardDetails, expiry: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl font-mono text-lg outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">CVV</label>
                      <input 
                        type="password" 
                        placeholder="123"
                        value={cardDetails.cvv}
                        onChange={e => setCardDetails({...cardDetails, cvv: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl font-mono text-lg outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cardholder Name</label>
                    <input 
                      type="text" 
                      value={cardDetails.name}
                      onChange={e => setCardDetails({...cardDetails, name: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => handleFinalizeDeposit(selectedMethod)}
                    className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all"
                  >
                    Authorize ${parseFloat(depositAmount).toFixed(2)}
                  </button>
                  <button onClick={() => setDepositStep('method')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Change Method</button>
                </div>
              </div>
            )}

            {depositStep === 'processing' && (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in">
                <div className="relative">
                  <div className="w-24 h-24 border-8 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-2xl">🔒</div>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Contacting {selectedMethod}</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-3">Authorizing secure transaction node...</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 w-full">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Internal Hash ID</p>
                  <p className="text-xs font-mono text-slate-600 break-all">HD-DEP-{Math.random().toString(36).substr(2, 12).toUpperCase()}</p>
                </div>
              </div>
            )}

            {depositStep === 'success' && (
              <div className="py-10 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95">
                <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center text-5xl shadow-xl shadow-emerald-100 animate-bounce">✓</div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Deposit Success</h3>
                  <p className="text-slate-500 text-sm font-bold mt-4">
                    <strong className="text-slate-900">${parseFloat(depositAmount).toFixed(2)}</strong> has been credited to your Main Balance.
                  </p>
                </div>
                <button 
                  onClick={() => setShowDepositModal(false)}
                  className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-emerald-700 transition-all"
                >
                  Return to Wallet
                </button>
              </div>
            )}

            {!['processing', 'success'].includes(depositStep) && (
              <button 
                onClick={() => setShowDepositModal(false)}
                className="w-full py-4 text-xs font-black text-slate-300 uppercase tracking-[0.4em] hover:text-slate-500 transition-colors"
              >
                Cancel Transaction
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 text-7xl">💰</div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Main Balance</p>
            <h3 className="text-6xl font-black text-slate-900 tracking-tighter">${user.walletBalance.toFixed(2)}</h3>
          </div>
          <div className="flex gap-4">
             <button 
               onClick={startDepositFlow}
               className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-100"
             >
               Deposit
             </button>
             <button className="flex-1 bg-slate-50 text-slate-600 py-5 rounded-2xl font-black uppercase tracking-widest text-xs border border-slate-100 hover:bg-slate-100">Withdraw</button>
          </div>
        </div>

        {/* Promotions Section */}
        {isPatient && (
          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-8 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Promotions</h3>
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">Company Funded</span>
            </div>

            <div className={`p-8 rounded-[2.5rem] border-2 transition-all duration-500 ${hasDonated ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-5">
                <h4 className={`text-sm font-black uppercase tracking-widest ${hasDonated ? 'text-emerald-900' : 'text-slate-800'}`}>Signup Bonus</h4>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${hasDonated ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-100 text-amber-700 animate-pulse'}`}>
                  {hasDonated ? 'ACTIVE' : 'LOCKED'}
                </span>
              </div>
              
              <div className="mb-8">
                <h3 className={`text-4xl font-black ${hasDonated ? 'text-emerald-600' : 'text-slate-400'}`}>${user.bonusBalance.toFixed(2)}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Subsidy Pool</p>
              </div>
              
              {!hasDonated ? (
                <div className="space-y-5">
                  <p className="text-[11px] text-slate-500 font-bold leading-relaxed uppercase tracking-tight">
                    Deposit $10.00 to unlock a <strong>$100.00 Bonus</strong>.
                  </p>
                  <button 
                    onClick={handleActivateBonus}
                    disabled={isDonating || user.walletBalance < 10}
                    className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isDonating ? 'Activating...' : 'Unlock $100.00 Bonus'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4 text-emerald-800 bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
                  <span className="text-2xl">✨</span>
                  <p className="text-[10px] font-black uppercase tracking-widest leading-tight">40% Session Rebate Active</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!isPatient && (
          <div className="bg-slate-900 text-white p-12 rounded-[3.5rem] shadow-2xl space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10 text-8xl">🩺</div>
            <div>
              <h3 className="text-2xl font-black tracking-tight uppercase tracking-[0.2em]">Clinical Earnings</h3>
              <p className="text-slate-400 text-sm font-bold uppercase mt-2 tracking-tight">Fees held in 24hr escrow.</p>
            </div>
            
            <div className="pt-8 border-t border-white/10 space-y-6">
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">Practice Settings</h4>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Session Fee ($)</label>
                  <input 
                    type="number" 
                    value={feeInput}
                    onChange={(e) => setFeeInput(e.target.value)}
                    className="w-full px-6 py-4 bg-white/5 rounded-2xl text-xl font-black border border-white/10 focus:outline-none focus:ring-4 focus:ring-blue-600 text-white"
                  />
                </div>
                <button onClick={handleUpdateFee} className="bg-blue-600 hover:bg-blue-700 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-900/40">Update</button>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed italic tracking-tight">
                * Note: You must manually end sessions (15 min typical).
              </p>
            </div>

            <div className="pt-6 space-y-4">
               <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                  <span>Awaiting Authorisation</span>
                  <span className="text-blue-400 text-sm">${user.transactions.filter(t => t.status === 'connected' || t.status === 'awaiting_authorisation').reduce((acc, t) => acc + t.amount, 0).toFixed(2)}</span>
               </div>
               <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-2/3 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg">Financial History</h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Ledger</span>
        </div>
        
        {isPatient && (
          <div className="px-8 py-4 bg-blue-50/50 border-b border-blue-100">
            <p className="text-[11px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-3">
              <span className="text-xl">ℹ️</span> 
              Notice: 24h Clinical Dispute Window Active.
            </p>
          </div>
        )}

        <div className="divide-y divide-slate-100">
           {user.transactions.length === 0 ? (
             <div className="p-16 text-center text-slate-300 font-black uppercase text-xs tracking-[0.4em]">Empty Ledger Node</div>
           ) : (
             user.transactions.map((tx) => (
               <div key={tx.id} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                 <div className="flex items-center gap-6">
                   <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-2xl shadow-inner ${tx.status === 'paid' || tx.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : tx.status === 'disputed' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                     {tx.status === 'paid' || tx.status === 'completed' ? '✅' : tx.status === 'disputed' ? '⚖️' : '⏳'}
                   </div>
                   <div>
                     <p className="text-base font-black text-slate-800">{tx.description}</p>
                     <div className="flex items-center gap-3 mt-2">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                          tx.status === 'awaiting_authorisation' ? 'bg-amber-100 text-amber-700' : 
                          tx.status === 'connected' ? 'bg-blue-100 text-blue-700' :
                          tx.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                          tx.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {tx.status.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(tx.date).toLocaleDateString()}</span>
                     </div>
                   </div>
                 </div>
                 <div className="text-right">
                    <p className={`font-black text-lg ${tx.type === 'deposit' || tx.type === 'consultancy_fee' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {tx.type === 'payment' ? `-$${tx.amount.toFixed(2)}` : `+$${tx.amount.toFixed(2)}`}
                    </p>
                 </div>
               </div>
             ))
           )}
           <div className="p-10 text-center border-t border-slate-100 bg-slate-50/30">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Verified Node End</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default WalletView;
