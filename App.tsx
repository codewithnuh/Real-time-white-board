import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Whiteboard } from './components/Whiteboard';
import { Toolbar } from './components/Toolbar';
import { ChatPanel } from './components/ChatPanel';
import { Stroke, ChatMessage, User } from './types';
import { analyzeBoard, generateDrawing } from './services/geminiService';
import { Users } from 'lucide-react';

const BROADCAST_CHANNEL_NAME = 'collab-canvas-v1';

const App: React.FC = () => {
  // State
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState('#000000');
  const [width, setWidth] = useState(4);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [peerCount, setPeerCount] = useState(1);
  
  // Refs
  const channelRef = useRef<BroadcastChannel | null>(null);
  const userId = useRef(crypto.randomUUID()).current;

  // Initialize Broadcast Channel
  useEffect(() => {
    channelRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    
    channelRef.current.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'NEW_STROKE') {
        setStrokes((prev) => [...prev, payload]);
      } else if (type === 'CLEAR_BOARD') {
        setStrokes([]);
      } else if (type === 'SYNC_REQUEST') {
        // Someone joined, send them our state
        channelRef.current?.postMessage({
          type: 'SYNC_RESPONSE',
          payload: { strokes }
        });
        // Simplistic peer counting
        setPeerCount(prev => prev + 1);
      } else if (type === 'SYNC_RESPONSE') {
        // We joined, receive state
        setStrokes(payload.strokes);
      } else if (type === 'PEER_JOINED') {
         setPeerCount(prev => prev + 1);
      }
    };

    // Announce presence
    channelRef.current.postMessage({ type: 'SYNC_REQUEST' });
    channelRef.current.postMessage({ type: 'PEER_JOINED' });

    // Initial greeting
    setMessages([{
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am your creative partner. Draw something and ask me to analyze it, or ask me to draw for you!',
      timestamp: Date.now()
    }]);

    return () => {
      channelRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once

  // Handlers
  const handleStrokeComplete = (stroke: Stroke) => {
    setStrokes((prev) => [...prev, stroke]);
    channelRef.current?.postMessage({
      type: 'NEW_STROKE',
      payload: stroke
    });
  };

  const handleClear = () => {
    setStrokes([]);
    channelRef.current?.postMessage({ type: 'CLEAR_BOARD' });
  };

  const handleDownload = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `collab-canvas-${Date.now()}.png`;
      a.click();
    }
  };

  const handleSendMessage = async (text: string, mode: 'chat' | 'generate') => {
    // Add user message
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessingAI(true);

    try {
      const canvas = document.querySelector('canvas');
      const base64 = canvas ? canvas.toDataURL('image/png') : '';

      if (mode === 'generate') {
        const result = await generateDrawing(text, base64);
        if (result && result.strokes) {
          // Add AI strokes to board
          const newStrokes: Stroke[] = result.strokes.map((s: any) => ({
            id: crypto.randomUUID(),
            points: s.points,
            color: s.color,
            width: s.width,
            isEraser: s.isEraser || false,
            userId: 'ai'
          }));

          setStrokes(prev => {
            const updated = [...prev, ...newStrokes];
             // Broadcast AI strokes so peers see them
            newStrokes.forEach(s => {
                channelRef.current?.postMessage({ type: 'NEW_STROKE', payload: s });
            });
            return updated;
          });
         
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            sender: 'ai',
            text: result.explanation || "Here is what I drew for you!",
            timestamp: Date.now()
          }]);
        } else {
            throw new Error("Could not generate drawing.");
        }
      } else {
        // Chat / Analyze mode
        const response = await analyzeBoard(base64, text);
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          sender: 'ai',
          text: response,
          timestamp: Date.now()
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        sender: 'system',
        text: "Error communicating with Gemini AI. Please check your API key or try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsProcessingAI(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-50">
      
      {/* Header / Meta Info */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-4">
        <div className="bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-xs font-medium text-slate-500 flex items-center gap-2">
           <Users size={14} />
           <span>{peerCount > 1 ? `${peerCount} Users Active` : 'Solo Session (Open new tab to test sync)'}</span>
        </div>
      </div>

      <Toolbar
        color={color}
        setColor={setColor}
        width={width}
        setWidth={setWidth}
        tool={tool}
        setTool={setTool}
        onClear={handleClear}
        onDownload={handleDownload}
      />
      
      <Whiteboard
        strokes={strokes}
        onStrokeComplete={handleStrokeComplete}
        color={color}
        width={width}
        tool={tool}
        userId={userId}
      />
      
      <ChatPanel
        messages={messages}
        onSendMessage={handleSendMessage}
        isProcessing={isProcessingAI}
      />
    </div>
  );
};

export default App;
