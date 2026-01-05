import React, { useState, useEffect } from 'react';
import { User, PatientRecord } from '../types.ts';
import { inferHealthInsights, inferFeedUpdates } from '../services/geminiService.ts';

interface HealthInsightsProps {
  user: User;
  setActiveTab: (tab: string) => void;
}

const HealthInsights: React.FC<HealthInsightsProps> = ({ user, setActiveTab }) => {
  const [insights, setInsights] = useState<any>(null);
  const [feed, setFeed] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFeedLoading, setIsFeedLoading] = useState(false);

  useEffect(() => {
    const loadFeed = async () => {
      setIsFeedLoading(true);
      const location = user.location || "your region";
      const age = user.medicalRecord?.age || 30;
      const result = await inferFeedUpdates(location, age);
      if (result) {
        setFeed(result);
      }
      setIsFeedLoading(false);
    };
    loadFeed();
  }, [user.location, user.medicalRecord?.age]);

  const generateReport = async () => {
    if (!user.medicalRecord || user.medicalRecord.age === 0) {
      alert("Please complete your medical profile in the Dashboard first!");
      return;
    }
    
    setIsLoading(true);
    const result = await inferHealthInsights(user.medicalRecord);
    if (result) {
      setInsights(result);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-5xl mx-auto pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Advanced Diagnostics</span>
          <h2 className="text-3xl font-black text-slate-900 mt-1">Health Insights (Infer)</h2>
          <p className="text-slate-500 font-medium">AI analysis based on your stored medical information.</p>
        </div>
        <button 
          onClick={generateReport}
          disabled={isLoading}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading ? 'Analyzing Bio-Data...' : 'Generate New Insight'}
        </button>
      </header>

      {!insights && !isLoading && (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-16 text-center space-y-6">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-4xl mx-auto">🧬</div>
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-bold text-slate-800">Ready for Analysis</h3>
            <p className="text-slate-500 mt-2">Click the button above to "infer" health predictions and custom wellness plans from your medical record.</p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-[2rem]"></div>
            ))}
          </div>
          <div className="h-64 bg-slate-50 animate-pulse rounded-[2.5rem]"></div>
        </div>
      )}

      {insights && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Wellness Score */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Wellness Score</p>
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-50" />
                  <circle 
                    cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" 
                    strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * insights.wellnessScore / 100)}
                    className="text-emerald-500 transition-all duration-1000" 
                  />
                </svg>
                <span className="absolute text-4xl font-black text-slate-800">{insights.wellnessScore}</span>
              </div>
              <p className="mt-4 font-bold text-slate-700">{insights.healthStatus}</p>
            </div>

            {/* Red Flags */}
            <div className="md:col-span-2 bg-red-50 p-8 rounded-[2.5rem] border border-red-100 flex flex-col justify-center">
               <div className="flex items-center gap-3 mb-4">
                 <span className="w-8 h-8 bg-red-600 text-white rounded-lg flex items-center justify-center text-sm">⚠️</span>
                 <h3 className="font-black text-red-900 uppercase tracking-widest text-xs">Medical Watchlist</h3>
               </div>
               <div className="space-y-3">
                 {insights.redFlags.map((flag: string, i: number) => (
                   <div key={i} className="flex gap-3 items-start">
                     <span className="text-red-400 font-bold mt-0.5">•</span>
                     <p className="text-red-800 font-medium text-sm leading-relaxed">{flag}</p>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Lifestyle */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl">🏃‍♂️</div>
                <h3 className="text-xl font-black text-slate-800">Lifestyle Prescription</h3>
              </div>
              <ul className="space-y-4">
                {insights.lifestylePrescription.map((item: string, i: number) => (
                  <li key={i} className="flex gap-4 items-start group">
                    <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</span>
                    <p className="text-slate-600 font-medium text-sm leading-relaxed">{item}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Nutrition */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center text-2xl">🥗</div>
                <h3 className="text-xl font-black text-slate-800">Nutrition Guide</h3>
              </div>
              <ul className="space-y-4">
                {insights.nutritionGuide.map((item: string, i: number) => (
                  <li key={i} className="flex gap-4 items-start">
                    <span className="w-6 h-6 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</span>
                    <p className="text-slate-600 font-medium text-sm leading-relaxed">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10 text-8xl">🩺</div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black tracking-tight">AI Recommended Next Steps</h3>
              <p className="text-slate-400 font-medium mt-2 leading-relaxed text-lg max-w-2xl">{insights.nextSteps}</p>
              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setActiveTab('messages')}
                  className="bg-white text-slate-900 px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all"
                >
                  Book Specialist Visit
                </button>
                <button className="bg-slate-800 text-slate-400 px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-all">Export Report (PDF)</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- PERMANENT DYNAMIC FEED --- */}
      <section className="pt-12 border-t border-slate-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Dynamic Health Feed</h3>
            <p className="text-slate-600 font-medium text-base">Real-time regional and demographic updates.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Live Node</span>
          </div>
        </div>

        {isFeedLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-[2.5rem]"></div>
            ))}
          </div>
        )}

        {feed && !isFeedLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Location Based Feed */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2 px-2">
                <span className="text-xl">📍</span>
                <h4 className="font-black text-slate-400 uppercase tracking-widest text-sm">Regional Alerts: {user.location || "Your Area"}</h4>
              </div>
              <div className="space-y-4">
                {feed.locationFeed.map((item: any, i: number) => (
                  <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-black text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{item.title}</h5>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${
                        item.severity === 'high' ? 'bg-red-100 text-red-600' : 
                        item.severity === 'medium' ? 'bg-amber-100 text-amber-600' : 
                        'bg-blue-100 text-blue-600'
                      }`}>{item.severity} Risk</span>
                    </div>
                    <p className="text-slate-500 text-base font-medium leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Age Based Feed */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2 px-2">
                <span className="text-xl">📅</span>
                <h4 className="font-black text-slate-400 uppercase tracking-widest text-sm">Demographic Updates: {user.medicalRecord?.age || 30}Yrs</h4>
              </div>
              <div className="space-y-4">
                {feed.ageFeed.map((item: any, i: number) => (
                  <div key={i} className="bg-slate-900 p-8 rounded-[2rem] text-white border border-white/5 shadow-xl hover:bg-slate-800 transition-all group">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-black text-[13px] uppercase tracking-widest text-blue-400">{item.category}</h5>
                      <span className="text-[18px] opacity-60">✨</span>
                    </div>
                    <h6 className="font-bold text-lg mb-2">{item.title}</h6>
                    <p className="text-slate-400 text-base font-medium leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default HealthInsights;