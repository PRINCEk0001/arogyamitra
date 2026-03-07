import React, { useState, useEffect } from 'react';
import { Clock as ClockIcon } from 'lucide-react';

const Clock: React.FC = () => {
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
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white shadow-xl flex flex-col items-center justify-center">
      <div className="flex items-center gap-2 mb-2 opacity-70">
        <ClockIcon className="w-4 h-4" />
        <span className="text-xs uppercase tracking-widest font-medium">Current Time</span>
      </div>
      <div className="text-5xl font-bold tracking-tighter mb-1">
        {formatTime(time)}
      </div>
      <div className="text-sm font-medium opacity-60">
        {formatDate(time)}
      </div>
    </div>
  );
};

export default Clock;
