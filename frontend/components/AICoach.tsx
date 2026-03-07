import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ChatMessage, HealthStats } from '../types';
import { Send, User, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAICoachResponse } from '../services/aiService';

interface AICoachProps {
  profile: UserProfile;
  stats: HealthStats | null;
  token: string;
}

export const AICoach: React.FC<AICoachProps> = ({ profile, stats, token }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Hello! I'm ArogyaMitra, your AI health coach. How can I help you reach your goals today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading || !stats) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await getAICoachResponse({
        message: input,
        profile,
        stats,
        history: messages
      }, token);
      setMessages(prev => [...prev, { role: 'model', text: responseText || "I'm not sure how to respond to that." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] px-4">
      <div className="flex-1 overflow-y-auto no-scrollbar py-4 flex flex-col gap-4">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary/20' : 'bg-surface-dark border border-white/10'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-primary" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary text-background-dark font-medium rounded-tr-sm' : 'bg-surface-dark border border-white/5 text-slate-200 rounded-tl-sm'}`}>
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface-dark border border-white/5 p-4 rounded-2xl rounded-tl-sm flex gap-1">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="pb-6 pt-2">
        <div className="bg-surface-dark border border-white/10 rounded-2xl p-2 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask your coach..."
            className="flex-1 bg-transparent border-none outline-none text-white px-3 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="w-10 h-10 bg-primary text-background-dark rounded-xl flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Developer Credit */}
        <div className="mt-4 flex flex-col items-center justify-center gap-1 opacity-20">
          <p className="text-[7px] uppercase tracking-[0.2em] font-bold text-slate-500">Developed & Crafted by</p>
          <p className="text-[9px] font-bold text-primary tracking-widest">PRINCE KORI</p>
        </div>
      </div>
    </div>
  );
};
