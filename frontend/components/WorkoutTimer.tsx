import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WorkoutTimerProps {
  initialMinutes?: number;
  onComplete?: () => void;
}

export const WorkoutTimer: React.FC<WorkoutTimerProps> = ({ initialMinutes = 30, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && !isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsActive(false);
      if (onComplete) onComplete();
      // Play a simple beep or notification
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play();
      } catch (e) {
        console.error("Audio play failed", e);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused, timeLeft, onComplete]);

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(initialMinutes * 60);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / (initialMinutes * 60)) * 100;

  return (
    <div className="bg-surface-dark p-6 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/10">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Workout Timer</h4>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Stay on track</p>
          </div>
        </div>
        {timeLeft === 0 && (
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            className="flex items-center gap-2 text-primary"
          >
            <Bell className="w-4 h-4 animate-bounce" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Done!</span>
          </motion.div>
        )}
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="74"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-white/5"
            />
            <motion.circle
              cx="80"
              cy="80"
              r="74"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={465}
              initial={{ strokeDashoffset: 465 }}
              animate={{ strokeDashoffset: 465 - (465 * (100 - progress)) / 100 }}
              className="text-primary"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-mono font-bold text-white tracking-tighter">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!isActive ? (
            <button 
              onClick={handleStart}
              className="w-14 h-14 rounded-full bg-primary text-background-dark flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-6 h-6 fill-current" />
            </button>
          ) : (
            <button 
              onClick={handlePause}
              className={`w-14 h-14 rounded-full flex items-center justify-center border border-white/10 hover:scale-105 active:scale-95 transition-all ${isPaused ? 'bg-primary text-background-dark' : 'bg-white/5 text-white'}`}
            >
              {isPaused ? <Play className="w-6 h-6 fill-current" /> : <Pause className="w-6 h-6 fill-current" />}
            </button>
          )}
          <button 
            onClick={handleReset}
            className="w-14 h-14 rounded-full bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center hover:text-white hover:bg-white/10 transition-all"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
