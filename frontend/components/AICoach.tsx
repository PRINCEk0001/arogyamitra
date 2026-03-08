import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, ChatMessage, HealthStats } from '../types';
import { Send, User, Bot, Mic, MicOff, Volume2, Square } from 'lucide-react';
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

  // Audio state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Speech Recognition API
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + " " + transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }

    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error("Microphone start error:", e);
        }
      } else {
        alert("Speech recognition is not supported in this browser.");
      }
    }
  };

  const speakText = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);

      // Try to find a good English voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !stats) return;

    // Stop speaking if answering a new question
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const userMsg: ChatMessage = { role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const responseText = await getAICoachResponse({
        message: userMsg.text,
        profile,
        stats,
        history: messages
      }, token);

      const aiResponse = responseText || "I'm not sure how to respond to that.";
      setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);

      // Auto-read response if they used the microphone or had speech enabled previously
      // But for better UX, we'll let them manually click the speaker icon instead of auto-playing.
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] px-4">
      <div className="flex-1 overflow-y-auto no-scrollbar py-4 flex flex-col gap-6">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className="shrink-0 pt-1">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xl
                    ${msg.role === 'user'
                      ? 'bg-primary/20 border-primary/30'
                      : 'bg-surface-dark border-white/10'}`}>
                    {msg.role === 'user' ? <User className="w-5 h-5 text-primary" /> : <Bot className="w-5 h-5 text-primary" />}
                  </div>
                </div>

                <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-5 rounded-[2rem] text-[15px] leading-relaxed relative group
                    ${msg.role === 'user'
                      ? 'bg-primary text-background-dark font-medium rounded-tr-md shadow-[0_10px_40px_-10px_rgba(19,236,178,0.5)]'
                      : 'bg-surface-dark border border-white/5 text-slate-200 rounded-tl-md shadow-2xl'}`}>
                    {msg.text}
                  </div>

                  {/* Action row for AI Model responses */}
                  {msg.role === 'model' && (
                    <div className="flex items-center gap-2 px-2 mt-1">
                      <button
                        onClick={() => speakText(msg.text)}
                        title={isSpeaking ? "Stop Speaking" : "Listen to Response"}
                        className={`p-2 rounded-full border transition-all duration-300 flex items-center gap-2
                          ${isSpeaking
                            ? 'bg-primary/20 text-primary border-primary/30 animate-pulse'
                            : 'bg-surface-dark text-slate-400 border-white/5 hover:text-primary hover:border-primary/20 hover:bg-primary/5'}`}
                      >
                        {isSpeaking ? <Square fill="currentColor" className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        {isSpeaking && <span className="text-[10px] font-bold uppercase tracking-widest mr-1">Playing</span>}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="flex gap-3 max-w-[90%]">
              <div className="shrink-0 pt-1">
                <div className="w-10 h-10 rounded-2xl bg-surface-dark border border-white/10 flex items-center justify-center shadow-xl">
                  <Bot className="w-5 h-5 text-primary animate-pulse" />
                </div>
              </div>
              <div className="bg-surface-dark border border-white/5 p-5 rounded-[2rem] rounded-tl-md shadow-2xl flex items-center gap-2 h-14">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="pb-6 pt-4 shrink-0 relative">
        <div className={`absolute inset-0 bg-primary/20 blur-3xl rounded-full transition-opacity duration-500 ${isListening ? 'opacity-100' : 'opacity-0'}`}></div>
        <div className={`relative bg-surface-dark border transition-all duration-300 rounded-[2rem] p-2 flex items-center pl-4
          ${isListening ? 'border-primary shadow-[0_0_30px_rgba(19,236,178,0.2)]' : 'border-white/10 shadow-xl'}`}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? "Listening..." : "Ask your coach..."}
            className="flex-1 bg-transparent border-none outline-none text-white text-[15px] placeholder:text-slate-500 min-w-0"
          />
          <div className="flex items-center gap-1 shrink-0 bg-background-dark p-1 rounded-full border border-white/5 ml-2">
            <button
              onClick={toggleListen}
              title={isListening ? "Stop Microphone" : "Use Microphone"}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                ${isListening ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button
              onClick={handleSend}
              disabled={loading || (!input.trim() && !isListening)}
              className="w-10 h-10 bg-primary text-background-dark rounded-full flex items-center justify-center disabled:opacity-50 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Developer Credit */}
        <div className="mt-5 flex flex-col items-center justify-center gap-1 opacity-20">
          <p className="text-[8px] uppercase tracking-[0.2em] font-bold text-slate-500">Developed & Crafted by</p>
          <p className="text-[10px] font-bold text-primary tracking-widest">PRINCE KORI</p>
        </div>
      </div>
    </div>
  );
};
