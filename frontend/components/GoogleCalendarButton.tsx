import React, { useState } from 'react';
import { Calendar, Clock, Check, Plus, Download, Mail } from 'lucide-react';

interface GoogleCalendarButtonProps {
  summary: string;
  description: string;
  startTime?: string; // ISO string
  endTime?: string;   // ISO string
  token?: string; // Kept for backwards compatibility but unused
}

export const GoogleCalendarButton: React.FC<GoogleCalendarButtonProps> = ({
  summary,
  description,
  startTime,
  endTime,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  const getDates = () => {
    const start = startTime ? new Date(startTime) : new Date(Date.now() + 86400000);
    const end = endTime ? new Date(endTime) : new Date(Date.now() + 86400000 + 3600000);
    return { start, end };
  };

  const handleOpenGoogleCalendar = () => {
    try {
      const { start, end } = getDates();
      const formatTime = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');

      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: summary,
        details: description,
        dates: `${formatTime(start)}/${formatTime(end)}`,
      });

      window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');

      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
      setShowOptions(false);
    } catch (error) {
      console.error('Failed to generate Google calendar link:', error);
    }
  };

  const handleOpenOutlookWeb = () => {
    try {
      const { start, end } = getDates();
      const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        subject: summary,
        body: description,
        startdt: start.toISOString(),
        enddt: end.toISOString()
      });

      window.open(`https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`, '_blank');
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
      setShowOptions(false);
    } catch (error) {
      console.error('Failed to generate Outlook link:', error);
    }
  };

  const handleDownloadICS = () => {
    try {
      const { start, end } = getDates();
      const formatTime = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');

      let icsContent = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//ArogyaMitra//EN\r\nBEGIN:VEVENT\r\n";
      icsContent += `DTSTART:${formatTime(start)}\r\n`;
      icsContent += `DTEND:${formatTime(end)}\r\n`;
      icsContent += `SUMMARY:${summary}\r\n`;
      icsContent += `DESCRIPTION:${description.replace(/\n/g, '\\n')}\r\n`;
      icsContent += "END:VEVENT\r\nEND:VCALENDAR\r\n";

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${summary.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'event'}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
      setShowOptions(false);
    } catch (error) {
      console.error('Failed to generate ICS:', error);
    }
  };

  const handleSetAlarm = () => {
    try {
      const { start } = getDates();
      const hours = start.getHours();
      const minutes = start.getMinutes();

      const shortLabel = summary.length > 20 ? summary.substring(0, 17) + '...' : summary;
      const intentUrl = `intent:#Intent;action=android.intent.action.SET_ALARM;S.android.intent.extra.alarm.MESSAGE=${encodeURIComponent(shortLabel)};i.android.intent.extra.alarm.HOUR=${hours};i.android.intent.extra.alarm.MINUTES=${minutes};B.android.intent.extra.alarm.SKIP_UI=false;end`;

      const isAndroid = /android/i.test(navigator.userAgent || navigator.vendor || (window as any).opera);

      if (isAndroid) {
        window.location.href = intentUrl;
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
        setShowOptions(false);
      } else {
        // Show error inline instead of alert
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
        // Don't close options right away so they can see the error
      }
    } catch (error) {
      console.error('Failed to set alarm:', error);
    }
  };

  return (
    <div className="relative">
      <div
        className={`flex items-center rounded-full border transition-all ${status === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
            status === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
              'bg-white/5 border-white/10 text-slate-400'
          }`}
      >
        <button
          onClick={() => setShowOptions(!showOptions)}
          title="Remind Me"
          className="flex items-center gap-2 px-4 py-2 hover:text-white hover:bg-white/10 transition-colors rounded-full active:scale-95"
        >
          {status === 'success' ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : status === 'error' ? (
            <Plus className="w-4 h-4 text-red-500" />
          ) : (
            <Plus className="w-4 h-4 text-primary" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest text-white">
            {status === 'success' ? 'Added' : status === 'error' ? 'Android Only' : 'Add to Calendar'}
          </span>
        </button>
      </div>

      {showOptions && (
        <div className="absolute bottom-full right-0 mb-2 w-56 bg-surface-dark border border-white/10 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 z-50">
          <button
            onClick={handleOpenGoogleCalendar}
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left"
          >
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="font-medium text-xs">Google Calendar</span>
          </button>

          <button
            onClick={handleDownloadICS}
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="font-medium text-xs">Apple / Windows (.ics)</span>
          </button>

          <button
            onClick={handleOpenOutlookWeb}
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left"
          >
            <Mail className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-xs">Outlook Web</span>
          </button>

          <button
            onClick={handleSetAlarm}
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors text-left border-t border-white/5 mt-1 pt-3"
          >
            <Clock className="w-4 h-4 text-orange-400" />
            <span className="font-medium text-xs">Set Alarm / Clock</span>
          </button>
        </div>
      )}
    </div>
  );
};
