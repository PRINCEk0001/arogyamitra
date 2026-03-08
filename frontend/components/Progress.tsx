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
import { TrendingDown, Scale, Calendar, Plus, Activity, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

  return (
    <div className="px-4 py-6 flex flex-col gap-6 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Progress Tracking</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-10 h-10 bg-primary text-background-dark rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-dark p-5 rounded-3xl border border-white/5">
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
