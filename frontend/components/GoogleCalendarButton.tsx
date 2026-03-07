import React, { useState, useEffect } from 'react';
import { Calendar, Check, Loader2, AlertCircle } from 'lucide-react';
import { getGoogleAuthUrl, createCalendarEvent } from '../services/googleCalendarService';

interface GoogleCalendarButtonProps {
  summary: string;
  description: string;
  startTime?: string; // ISO string
  endTime?: string;   // ISO string
  token: string;
}

export const GoogleCalendarButton: React.FC<GoogleCalendarButtonProps> = ({
  summary,
  description,
  startTime,
  endTime,
  token
}) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [googleTokens, setGoogleTokens] = useState<any>(() => {
    const saved = localStorage.getItem('google_tokens');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const tokens = event.data.tokens;
        setGoogleTokens(tokens);
        localStorage.setItem('google_tokens', JSON.stringify(tokens));
        // Automatically try to create the event after auth
        handleCreateEvent(tokens);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [summary, description, startTime, endTime]);

  const handleConnect = async () => {
    try {
      setLoading(true);
      const url = await getGoogleAuthUrl(token);
      window.open(url, 'google_auth', 'width=600,height=700');
    } catch (error) {
      console.error('Failed to get auth URL', error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (tokensToUse = googleTokens) => {
    if (!tokensToUse) {
      handleConnect();
      return;
    }

    try {
      setLoading(true);
      setStatus('idle');

      // Default to tomorrow morning if no time provided
      const start = startTime || new Date(Date.now() + 86400000).toISOString();
      const end = endTime || new Date(Date.now() + 86400000 + 3600000).toISOString();

      await createCalendarEvent(token, tokensToUse, {
        summary,
        description,
        start,
        end
      });

      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to create event', error);
      setStatus('error');
      if ((error as any).response?.status === 401) {
        localStorage.removeItem('google_tokens');
        setGoogleTokens(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={() => handleCreateEvent()}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all active:scale-95 ${status === 'success'
        ? 'bg-green-500/10 border-green-500/20 text-green-500'
        : status === 'error'
          ? 'bg-red-500/10 border-red-500/20 text-red-500'
          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
        }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : status === 'success' ? (
        <Check className="w-4 h-4" />
      ) : status === 'error' ? (
        <AlertCircle className="w-4 h-4" />
      ) : (
        <Calendar className="w-4 h-4" />
      )}
      <span className="text-[10px] font-bold uppercase tracking-widest">
        {status === 'success' ? 'Added' : status === 'error' ? 'Failed' : 'Remind Me'}
      </span>
    </button>
  );
};
