import React, { useState, useEffect } from 'react';
import { Calendar, Bell, ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  htmlLink: string;
}

const CalendarReminders: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/calendar/events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
        setIsConnected(true);
      } else if (response.status === 401) {
        setIsConnected(false);
      } else {
        setError('Failed to fetch events');
      }
    } catch (err) {
      console.error(err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleConnect = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/calendar/auth/url', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { url } = await response.json();

      const authWindow = window.open(url, 'google_calendar_auth', 'width=600,height=700');
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'CALENDAR_AUTH_SUCCESS') {
          fetchEvents();
          window.removeEventListener('message', handleMessage);
        }
      };
      window.addEventListener('message', handleMessage);
    } catch (err) {
      console.error(err);
      setError('Failed to initiate auth');
    }
  };

  const formatEventTime = (event: CalendarEvent) => {
    if (event.start.dateTime) {
      return new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return 'All Day';
  };

  const formatEventDate = (event: CalendarEvent) => {
    const date = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date!);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Reminders</h3>
            <p className="text-xs opacity-60">Google Calendar Sync</p>
          </div>
        </div>
        {isConnected && (
          <button 
            onClick={fetchEvents}
            disabled={loading}
            className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-sm opacity-60 mb-6 max-w-[200px]">
              Connect your Google Calendar to see upcoming health and fitness reminders.
            </p>
            <button
              onClick={handleConnect}
              className="px-6 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-opacity-90 transition-all text-sm flex items-center gap-2"
            >
              Connect Calendar
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-400/30 mb-4" />
            <p className="text-sm opacity-60">No upcoming events found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                          {formatEventDate(event)}
                        </span>
                        <span className="text-[10px] font-medium opacity-40">
                          {formatEventTime(event)}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium line-clamp-1 group-hover:text-blue-300 transition-colors">
                        {event.summary}
                      </h4>
                    </div>
                    <a 
                      href={event.htmlLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded-lg"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
          <Bell className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  );
};

export default CalendarReminders;
