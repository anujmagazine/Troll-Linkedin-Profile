/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, RefreshCw, AlertCircle, Trash2, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeLinkedInProfile, Annotation } from './services/geminiService';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setAnnotations([]);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTroll = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeLinkedInProfile(image);
      setAnnotations(result);
    } catch (err) {
      setError("Gemini failed to roast this profile. Maybe it's too perfect? (Unlikely)");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = image;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Draw annotations
      annotations.forEach(ann => {
        ctx.strokeStyle = '#ef4444'; // red-500
        ctx.fillStyle = '#ef4444';
        ctx.lineWidth = Math.max(img.width / 200, 3);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const x = (ann.x / 100) * img.width;
        const y = (ann.y / 100) * img.height;

        if (ann.type === 'circle') {
          ctx.beginPath();
          ctx.ellipse(x, y, img.width * 0.05, img.height * 0.03, (ann.rotation || 0) * Math.PI / 180, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (ann.type === 'arrow' && ann.targetX !== undefined && ann.targetY !== undefined) {
          const tx = (ann.targetX / 100) * img.width;
          const ty = (ann.targetY / 100) * img.height;
          drawArrow(ctx, x, y, tx, ty, Math.max(img.width / 100, 10));
        } else if (ann.type === 'text' && ann.content) {
          ctx.font = `bold ${Math.max(img.width / 30, 24)}px "Caveat"`;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((ann.rotation || -5) * Math.PI / 180);
          ctx.fillText(ann.content, 0, 0);
          ctx.restore();
        } else if (ann.type === 'doodle') {
          drawDoodle(ctx, ann.content || '', x, y, img.width * 0.1);
        }
      });
    };
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number, headlen: number) => {
    const angle = Math.atan2(toy - fromy, tox - fromx);
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const drawDoodle = (ctx: CanvasRenderingContext2D, type: string, x: number, y: number, size: number) => {
    ctx.save();
    ctx.translate(x, y);
    if (type.includes('horn')) {
      // Simple horns
      ctx.beginPath();
      ctx.moveTo(-size/2, 0);
      ctx.quadraticCurveTo(-size/2, -size, 0, -size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(size/2, 0);
      ctx.quadraticCurveTo(size/2, -size, 0, -size);
      ctx.stroke();
    } else if (type.includes('clown')) {
      ctx.beginPath();
      ctx.arc(0, 0, size/4, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();
  };

  useEffect(() => {
    if (image && annotations.length > 0) {
      drawCanvas();
    }
  }, [image, annotations]);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'trolled-linkedin.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#f3f2ef] flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-4xl mb-8 text-center">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl md:text-6xl font-black tracking-tighter text-zinc-900 mb-2 marker-text uppercase italic"
        >
          LinkedIn <span className="text-red-600">Troller</span>
        </motion.h1>
        <p className="text-zinc-600 font-medium">Because your professional network is a goldmine of cringe.</p>
      </header>

      <main className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 flex flex-col md:flex-row min-h-[600px]">
        {/* Left Panel: Controls */}
        <div className="w-full md:w-80 border-r border-zinc-100 p-6 flex flex-col gap-6 bg-zinc-50/50">
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Step 1: Upload</h2>
            <label className="group relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-zinc-300 rounded-2xl cursor-pointer hover:border-red-500 hover:bg-red-50/30 transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 text-zinc-400 group-hover:text-red-500 mb-2 transition-colors" />
                <p className="text-xs text-zinc-500 font-medium">Drop screenshot or click</p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Step 2: Roast</h2>
            <button
              onClick={handleTroll}
              disabled={!image || isAnalyzing}
              className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-zinc-900 transition-all active:scale-95"
            >
              {isAnalyzing ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
              {isAnalyzing ? "Analyzing Cringe..." : "Troll This Profile"}
            </button>
          </div>

          {annotations.length > 0 && (
            <div className="space-y-4 mt-auto">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Step 3: Share</h2>
              <button
                onClick={downloadImage}
                className="w-full py-4 border-2 border-zinc-900 text-zinc-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-900 hover:text-white transition-all active:scale-95"
              >
                <Download className="w-5 h-5" />
                Download Masterpiece
              </button>
              <button
                onClick={() => { setImage(null); setAnnotations([]); }}
                className="w-full py-2 text-zinc-400 hover:text-red-600 text-sm font-medium flex items-center justify-center gap-1 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Start Over
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Right Panel: Preview */}
        <div className="flex-1 bg-zinc-100 p-4 md:p-8 flex items-center justify-center relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!image ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="text-center space-y-4"
              >
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <Camera className="w-10 h-10 text-zinc-200" />
                </div>
                <p className="text-zinc-400 font-medium">No profile loaded yet.</p>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden bg-white"
                ref={containerRef}
              >
                {annotations.length === 0 ? (
                  <img src={image} alt="LinkedIn Profile" className="max-w-full h-auto block" />
                ) : (
                  <canvas ref={canvasRef} className="max-w-full h-auto block" />
                )}

                {isAnalyzing && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="marker-text text-xl text-red-600 animate-pulse">Finding the cringe...</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Decorative Grid Lines */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
               style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>
      </main>

      <footer className="mt-8 text-zinc-400 text-sm font-medium">
        Built for the "Thought Leaders" who take themselves too seriously.
      </footer>
    </div>
  );
}
