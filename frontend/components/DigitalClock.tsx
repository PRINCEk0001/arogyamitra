import React, { useState, useEffect } from 'react';
import { Clock as ClockIcon } from 'lucide-react';

export const DigitalClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <div className="bg-surface-dark p-6 rounded-[2rem] border border-white/5 shadow-xl relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
      <div className="flex items-center gap-3 mb-2">
        <ClockIcon className="w-4 h-4 text-primary" />
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Current Time</span>
      </div>
      <div className="flex flex-col">
        <span className="text-3xl font-bold text-white tracking-tighter">{formatTime(time)}</span>
        <span className="text-[10px] text-slate-400 font-medium mt-1">{formatDate(time)}</span>
      </div>
    </div>
  );
};
