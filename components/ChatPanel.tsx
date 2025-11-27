import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, X, Minimize2, Maximize2, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, mode: 'chat' | 'generate') => void;
  isProcessing: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isProcessing }) => {
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent, mode: 'chat' | 'generate') => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSendMessage(input, mode);
    setInput('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105 z-50 flex items-center gap-2"
      >
        <Bot size={24} />
        <span className="font-semibold">AI Assistant</span>
      </button>
    );
  }

  return (
    <div className="absolute bottom-6 right-6 w-96 max-h-[600px] h-[70vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 z-50 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="text-blue-400" size={20} />
          <h2 className="font-semibold">Collab Gemini</h2>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
          <Minimize2 size={18} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 text-sm mt-8">
            <Sparkles className="mx-auto mb-2 opacity-50" size={32} />
            <p>Start drawing and ask Gemini to analyze it!</p>
            <p className="mt-2 text-xs">Try: "What does my drawing look like?" or "Draw a cat"</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : msg.sender === 'system'
                  ? 'bg-slate-200 text-slate-600 text-xs py-1 px-3'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">
              {msg.sender === 'ai' ? 'Gemini' : msg.sender === 'user' ? 'You' : ''}
            </span>
          </div>
        ))}
        {isProcessing && (
          <div className="flex items-center gap-2 text-slate-500 text-xs pl-2">
            <Loader2 size={12} className="animate-spin" />
            Gemini is thinking...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-100 shrink-0">
        <form 
          className="flex flex-col gap-2"
          onSubmit={(e) => handleSubmit(e, 'chat')}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI or describe what to draw..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            disabled={isProcessing}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
              disabled={isProcessing}
            >
              Ask Gemini
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'generate')}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2"
              disabled={isProcessing}
            >
              <Sparkles size={14} />
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
