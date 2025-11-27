import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stroke, Point } from '../types';

interface WhiteboardProps {
  strokes: Stroke[];
  onStrokeComplete: (stroke: Stroke) => void;
  color: string;
  width: number;
  tool: 'pen' | 'eraser';
  userId: string;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({
  strokes,
  onStrokeComplete,
  color,
  width,
  tool,
  userId
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);

  // Resize handler
  const handleResize = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const { offsetWidth, offsetHeight } = containerRef.current;
    
    // Save image data to prevent loss on resize
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Create temp canvas to store content
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasRef.current.width;
    tempCanvas.height = canvasRef.current.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx?.drawImage(canvasRef.current, 0, 0);

    // Resize
    canvasRef.current.width = offsetWidth;
    canvasRef.current.height = offsetHeight;

    // Redraw logic handled by useEffect dependency on 'strokes'
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Main Draw Function
  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) return;

    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = stroke.width;
    ctx.strokeStyle = stroke.isEraser ? '#f8fafc' : stroke.color; // eraser matches bg-slate-50

    if (stroke.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = stroke.width * 2; // Eraser is usually bigger
    } else {
        ctx.globalCompositeOperation = 'source-over';
    }

    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  };

  // Render all strokes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw existing strokes
    strokes.forEach(stroke => drawStroke(ctx, stroke));

    // Draw current stroke
    if (currentStroke) {
      drawStroke(ctx, currentStroke);
    }
  }, [strokes, currentStroke]);

  // Input Handlers
  const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const point = getPoint(e);
    setCurrentStroke({
      id: crypto.randomUUID(),
      points: [point],
      color,
      width,
      isEraser: tool === 'eraser',
      userId
    });
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentStroke) return;
    const point = getPoint(e);
    setCurrentStroke(prev => prev ? {
      ...prev,
      points: [...prev.points, point]
    } : null);
  };

  const stopDrawing = () => {
    if (isDrawing && currentStroke) {
      onStrokeComplete(currentStroke);
    }
    setIsDrawing(false);
    setCurrentStroke(null);
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-50 cursor-crosshair touch-none">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="block"
      />
    </div>
  );
};
