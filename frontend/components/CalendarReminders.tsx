import React from 'react';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

const CalendarReminders: React.FC = () => {
  const [clockError, setClockError] = React.useState(false);

  const handleOpenCalendar = () => {
    window.open('https://calendar.google.com', '_blank');
  };

  const handleOpenClock = () => {
    const isAndroid = /android/i.test(navigator.userAgent || navigator.vendor || (window as any).opera);
    if (isAndroid) {
      // General intent to open the clock app
      window.location.href = 'intent:#Intent;action=android.intent.action.SHOW_ALARMS;end';
    } else {
      setClockError(true);
      setTimeout(() => setClockError(false), 3000);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">App Shortcuts</h3>
            <p className="text-xs opacity-60">Manage your schedule</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-4">
        <p className="text-sm opacity-60 mb-2">
          Use the "Remind Me" buttons on workouts and meals to create events. Check your apps below:
        </p>

        <button
          onClick={handleOpenCalendar}
          className="group relative bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Calendar className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-medium group-hover:text-blue-300 transition-colors">Google Calendar</h4>
              <p className="text-[10px] opacity-50">View your schedule</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button
          onClick={handleOpenClock}
          className={`group relative hover:bg-white/10 border rounded-xl p-4 transition-all flex items-center justify-between ${clockError ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/5'
            }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${clockError ? 'bg-red-500/10' : 'bg-orange-500/10'}`}>
              <Clock className={`w-4 h-4 ${clockError ? 'text-red-400' : 'text-orange-400'}`} />
            </div>
            <div className="text-left">
              <h4 className={`text-sm font-medium transition-colors ${clockError ? 'text-red-300' : 'group-hover:text-orange-300'}`}>
                {clockError ? 'Android Only' : 'Alarms & Clock'}
              </h4>
              <p className={`text-[10px] opacity-50 ${clockError ? 'text-red-200' : ''}`}>
                {clockError ? 'Please open your app manually' : 'Manage daily alerts'}
              </p>
            </div>
          </div>
          <ArrowRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${clockError ? 'text-red-400' : 'text-orange-400'}`} />
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity ${clockError ? 'bg-red-500' : 'bg-orange-500'}`} />
        </button>
      </div>
    </div>
  );
};

export default CalendarReminders;
