import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Send, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AICoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalDefined: (goal: string) => void;
}

export default function AICoachModal({ isOpen, onClose, onGoalDefined }: AICoachModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hey! I am your AI Coach. Tell me a bit about your lifestyle, eating habits, and what you want to achieve with your body.' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [finalGoal, setFinalGoal] = useState<string | null>(null);
  const [finalMessage, setFinalMessage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!userInput.trim() || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/define-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });
      const data = await res.json();
      
      if (data.status === 'complete') {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        setFinalGoal(data.goal);
        setFinalMessage(data.message);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Oops, something went wrong. Let\'s try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-sm bg-[#0F172A] border border-white/10 rounded-3xl p-6 relative shadow-2xl flex flex-col max-h-[80vh]"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6 shrink-0">
            <div className="flex items-center gap-2 text-fuchsia-400">
              <Sparkles className="w-5 h-5" />
              <h2 className="text-xl font-light tracking-widest text-white uppercase">AI Coach</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-white/5 text-white/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col flex-1 overflow-hidden min-h-[350px] mb-4">
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 mb-4 pr-2">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm font-light ${m.role === 'user' ? 'bg-fuchsia-600 text-white rounded-tr-sm' : 'bg-white/10 text-white/90 rounded-tl-sm'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl p-3 bg-white/10 text-white/90 rounded-tl-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-fuchsia-400" />
                    <span className="text-xs font-mono">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {!finalGoal ? (
              <div className="flex gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Tell me about your goals..."
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-colors placeholder:text-white/20 text-sm"
                />
                <button 
                  onClick={handleSend}
                  disabled={!userInput.trim() || loading}
                  className="w-12 h-12 rounded-xl bg-fuchsia-600 text-white flex items-center justify-center hover:bg-fuchsia-500 disabled:opacity-50 transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-2xl p-4 text-center shrink-0">
                <p className="text-white/50 text-xs font-mono uppercase tracking-widest mb-1">Recommended Goal</p>
                <p className="text-fuchsia-400 font-mono text-xl mb-4">{finalGoal}</p>
                <button
                  onClick={() => {
                    onGoalDefined(finalGoal);
                    onClose();
                  }}
                  className="w-full py-4 bg-fuchsia-600 text-white rounded-2xl font-mono text-xs tracking-widest uppercase hover:bg-fuchsia-500 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(217,70,239,0.3)]"
                >
                  <Check className="w-4 h-4" />
                  Apply Goal
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
