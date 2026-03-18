/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Upload, Download, RefreshCw, AlertCircle, Trash2, Camera, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { trollWithNanobanana1 } from './services/geminiService';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [trolledImage, setTrolledImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setTrolledImage(null);
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
      const result = await trollWithNanobanana1(image);
      setTrolledImage(result);
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setError(err.message || "Gemini failed to roast this profile. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadImage = () => {
    if (!trolledImage) return;
    const link = document.createElement('a');
    link.download = 'trolled-linkedin.png';
    link.href = trolledImage;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#f3f2ef] flex flex-col items-center p-4 md:p-8">
      <header className="w-full max-w-4xl mb-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-block mb-4"
        >
          <span className="px-3 py-1 text-xs font-bold tracking-widest uppercase bg-red-600 text-white rounded-full">
            Nanobanana 1 Powered
          </span>
        </motion.div>
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-4xl md:text-6xl font-black tracking-tighter text-zinc-900 mb-2 marker-text uppercase italic"
        >
          LinkedIn <span className="text-red-600">Troller</span>
        </motion.h1>
        <p className="text-zinc-600 font-medium">Image-to-image roasting with Nanobanana 1 (No API key required).</p>
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
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} ref={fileInputRef} />
            </label>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Step 2: Roast</h2>
            <button
              onClick={handleTroll}
              disabled={!image || isAnalyzing}
              className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-zinc-900 transition-all active:scale-95 shadow-lg shadow-zinc-900/10"
            >
              {isAnalyzing ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
              {isAnalyzing ? "Nanobanana 1 Working..." : "Troll This Profile"}
            </button>
          </div>

          {trolledImage && (
            <div className="space-y-4 mt-auto">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Step 3: Share</h2>
              <button
                onClick={downloadImage}
                className="w-full py-4 border-2 border-zinc-900 text-zinc-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-900 hover:text-white transition-all active:scale-95"
              >
                <Download className="w-5 h-5" />
                Download Roast
              </button>
              <button
                onClick={() => { setImage(null); setTrolledImage(null); }}
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
              >
                <img 
                  src={trolledImage || image} 
                  alt="LinkedIn Profile" 
                  className={`max-w-full h-auto block transition-all duration-500 ${isAnalyzing ? 'blur-sm grayscale' : ''}`} 
                />

                {isAnalyzing && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="marker-text text-xl text-red-600 animate-pulse">Nanobanana 1 is painting the cringe...</p>
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

      <footer className="mt-8 text-zinc-400 text-sm font-medium flex flex-col items-center gap-2">
        <p>Built for the "Thought Leaders" who take themselves too seriously.</p>
        <div className="flex items-center gap-4">
          <p>Powered by Nanobanana 1</p>
        </div>
      </footer>
    </div>
  );
}
