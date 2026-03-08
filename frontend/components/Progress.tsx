import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { UserProfile, ProgressEntry } from '../types';
import { TrendingDown, Scale, Calendar, Plus, Activity, X, Smile, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const bmrDropIcon = '/nano_bmr.png';
const moodDropIcon = '/nano_mood.png';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ProgressProps {
  profile: UserProfile;
  token: string;
}

export const Progress: React.FC<ProgressProps> = ({ profile, token }) => {
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWeight, setNewWeight] = useState(profile?.weight?.toString() || '0');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feature 2: Manual Activity & Mood Log State
  const [activityDesc, setActivityDesc] = useState('');
  const [selectedMood, setSelectedMood] = useState('😃');
  const [activityLogs, setActivityLogs] = useState<{ desc: string, mood: string, time: string }[]>([]);

  const fetchProgress = async () => {
    try {
      // In our backend, we use /api/progress/:userId
      // We need the userId. It's in the profile object if we fetched it correctly.
      // For now, let's assume the token contains the userId or we can get it from the profile.
      const res = await fetch(`/api/progress/${(profile as any).id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProgress(data);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [profile, token]);

  const handleAddProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const heightM = profile.height / 100;
      const weight = parseFloat(newWeight);
      const bmi = weight / (heightM * heightM);

      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          weight,
          bmi: Math.round(bmi * 10) / 10,
          notes: newNotes,
          workout_completed: false
        })
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewNotes('');
        fetchProgress();
      }
    } catch (error) {
      console.error('Error adding progress:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const labels = progress.map(h => new Date(h.date).toLocaleDateString());

  const weightChartData = {
    labels,
    datasets: [
      {
        label: 'Weight (kg)',
        data: progress.map(h => h.weight),
        borderColor: '#13ecb2',
        backgroundColor: 'rgba(19, 236, 178, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const bmiChartData = {
    labels,
    datasets: [
      {
        label: 'BMI',
        data: progress.map(h => h.bmi),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#94a3b8',
        bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8', font: { size: 10 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 10 } },
      },
    },
  };

  const latestWeight = progress[progress.length - 1]?.weight || profile.weight;
  const startWeight = progress[0]?.weight || profile.weight;
  const diff = Math.round((latestWeight - startWeight) * 10) / 10;

  // Advanced BMR Calculation (Mifflin-St Jeor Equation)
  const heightCm = profile.height;
  const age = profile.age || 25; // Defaulting if not strictly provided
  const isMale = profile.gender === 'male';
  const bmr = Math.round((10 * latestWeight) + (6.25 * heightCm) - (5 * age) + (isMale ? 5 : -161));
  const tdee = Math.round(bmr * (profile.activityLevel === 'sedentary' ? 1.2 : profile.activityLevel === 'moderate' ? 1.55 : 1.725));

  const currentBmi = Math.round((latestWeight / Math.pow(heightCm / 100, 2)) * 10) / 10;
  let bmiCategory = 'Normal';
  if (currentBmi < 18.5) bmiCategory = 'Underweight';
  else if (currentBmi > 25) bmiCategory = 'Overweight';

  return (
    <div className="px-4 py-6 flex flex-col gap-6 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Progress Tracking</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-10 h-10 bg-primary/20 text-primary border border-primary/30 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Nano Banana BMR & BMI Dashboard */}
      <div className="grid grid-cols-2 gap-4">
        {/* BMI Gauge */}
        <div className="bg-surface-dark p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group shadow-xl hover:border-white/10 transition-colors">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <Scale className="w-3 h-3 text-primary" />
            </span>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Body Mass</span>
          </div>
          <p className="text-3xl font-bold text-white mb-1 tracking-tight">{currentBmi}</p>
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary">{bmiCategory}</span>
          </div>
        </div>

        {/* BMR Energy */}
        <div className="bg-surface-dark p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group shadow-xl hover:border-purple-500/20 transition-colors">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors"></div>
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <span className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Activity className="w-3 h-3 text-purple-400" />
            </span>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Metabolism</span>
          </div>
          <p className="text-3xl font-bold text-white mb-1 tracking-tight relative z-10">{bmr} <span className="text-xs text-slate-500">kcal</span></p>
          <div className="inline-flex items-center text-[10px] text-purple-400 font-bold uppercase tracking-widest relative z-10">
            TDEE: {tdee}
          </div>
        </div>
      </div>

      {/* Manual Activity & Mood Log */}
      <div className="bg-surface-dark p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden group shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent"></div>

        <div className="relative flex items-center justify-between mb-6">
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-[1.2rem] bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 shadow-lg p-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-yellow-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <img src={moodDropIcon} alt="Mood Logger" className="w-full h-full object-contain relative z-10 hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="text-lg font-bold text-white tracking-tight">Daily Reflection</h3>
              <p className="text-[10px] uppercase font-bold text-yellow-500 tracking-widest mt-0.5">Activity & Mood</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex justify-between items-center bg-background-dark/50 p-2 rounded-[2rem] border border-white/5">
            {['😡', '😟', '😐', '😃', '🤩'].map(emoji => (
              <button
                key={emoji}
                onClick={() => setSelectedMood(emoji)}
                className={`w-12 h-12 rounded-full text-2xl flex items-center justify-center transition-all ${selectedMood === emoji
                  ? 'bg-yellow-500/20 scale-110 border border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.3)]'
                  : 'hover:bg-white/5 hover:scale-105 opacity-60 hover:opacity-100'
                  }`}
              >
                {emoji}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (activityDesc.trim()) {
                setActivityLogs([{
                  desc: activityDesc,
                  mood: selectedMood,
                  time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                }, ...activityLogs]);
                setActivityDesc('');
              }
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={activityDesc}
              onChange={(e) => setActivityDesc(e.target.value)}
              placeholder="What did you do today?"
              className="flex-1 bg-background-dark border border-white/10 rounded-2xl py-3 px-4 text-white text-sm outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all placeholder:text-slate-600"
            />
            <button
              type="submit"
              disabled={!activityDesc.trim()}
              className="w-12 h-12 rounded-2xl bg-yellow-500 text-background-dark flex items-center justify-center disabled:opacity-50 hover:opacity-90 active:scale-95 transition-all shadow-lg"
            >
              <Send className="w-5 h-5 ml-1" />
            </button>
          </form>

          {activityLogs.length > 0 && (
            <div className="mt-2 flex flex-col gap-2 max-h-48 overflow-y-auto no-scrollbar mask-linear-bottom">
              {activityLogs.map((log, i) => (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i}
                  className="bg-background-dark/40 py-3 px-4 rounded-2xl border border-white/5 flex flex-col gap-1 hover:bg-background-dark/60 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{log.mood}</span>
                    <span className="text-[9px] uppercase tracking-widest font-bold text-slate-500">{log.time}</span>
                  </div>
                  <p className="text-sm text-slate-200 mt-1 pl-1 leading-snug">{log.desc}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-dark p-5 rounded-3xl border border-white/5 shadow-lg group hover:border-white/10 transition-colors">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Scale className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Current Weight</span>
          </div>
          <div className="text-2xl font-bold">{latestWeight} <span className="text-xs text-slate-500">kg</span></div>
        </div>
        <div className="bg-surface-dark p-5 rounded-3xl border border-white/5">
          <div className="flex items-center gap-2 text-orange-500 mb-2">
            <TrendingDown className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Change</span>
          </div>
          <div className="text-2xl font-bold">{diff > 0 ? `+${diff}` : diff} <span className="text-xs text-slate-500">kg</span></div>
        </div>
      </div>

      <div className="bg-surface-dark p-6 rounded-3xl border border-white/5">
        <h3 className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Weight Trend
        </h3>
        <div className="h-64">
          <Line data={weightChartData} options={chartOptions} />
        </div>
      </div>

      <div className="bg-surface-dark p-6 rounded-3xl border border-white/5">
        <h3 className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2">
          <Activity className="w-4 h-4" /> BMI Progress
        </h3>
        <div className="h-64">
          <Line data={bmiChartData} options={chartOptions} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-slate-400 px-2">History</h3>
        {progress.slice().reverse().map((entry) => (
          <div key={entry.id} className="bg-surface-dark p-4 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <Scale className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="font-bold text-white">{entry.weight} kg</p>
                <p className="text-[10px] text-slate-500">{new Date(entry.date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-primary font-bold">BMI: {entry.bmi}</p>
              {entry.notes && <p className="text-[10px] text-slate-500 italic">"{entry.notes}"</p>}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-dark w-full max-w-sm rounded-[2.5rem] border border-white/10 p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Log Progress</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddProgress} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Current Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={e => setNewWeight(e.target.value)}
                    className="w-full bg-background-dark border border-white/5 rounded-2xl p-4 text-white focus:border-primary/50 outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Notes (Optional)</label>
                  <textarea
                    value={newNotes}
                    onChange={e => setNewNotes(e.target.value)}
                    className="w-full bg-background-dark border border-white/5 rounded-2xl p-4 text-white focus:border-primary/50 outline-none h-24 resize-none"
                    placeholder="How are you feeling?"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-background-dark font-bold py-4 rounded-2xl shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Save Progress'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Developer Credit */}
      <div className="mt-8 mb-24 flex flex-col items-center justify-center gap-1 opacity-30">
        <p className="text-[8px] uppercase tracking-[0.2em] font-bold text-slate-500">Developed & Crafted by</p>
        <p className="text-[10px] font-bold text-primary tracking-widest">PRINCE KORI</p>
      </div>
    </div>
  );
};
