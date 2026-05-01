import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Eye, Type, MousePointer2, RotateCcw, X, Check, 
  Volume2, Focus, ZapOff, AlignLeft, Search, Sun, Monitor,
  Accessibility, Languages, FileText, MousePointer, Square
} from 'lucide-react';
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

export function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Settings State
  const [settings, setSettings] = useState({
    readingGuide: false,
    highContrast: false,
    grayscale: false,
    focusHighlight: false,
    largeCursor: false,
    dyslexicFont: false,
    reducedMotion: false,
    lineSpacing: 1, // 1: Normal, 1.5: Wide, 2: Extra Wide
    textSpacing: 0, // 0: Normal, 0.1: Wide, 0.2: Extra Wide
    fontSize: 100,
    screenReader: false,
    focusMask: false,
  });

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const utteranceRef = useRef(null);

  // Mouse tracking for Reading Guide & Spotlight
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Apply Classes to HTML element
  useEffect(() => {
    const html = document.documentElement;
    
    // Cleanup old classes
    html.classList.remove(
      'a11y-high-contrast', 
      'a11y-grayscale', 
      'a11y-focus-highlight', 
      'a11y-large-cursor', 
      'a11y-dyslexic', 
      'a11y-no-motion'
    );

    if (settings.highContrast) html.classList.add('a11y-high-contrast');
    if (settings.grayscale) html.classList.add('a11y-grayscale');
    if (settings.focusHighlight) html.classList.add('a11y-focus-highlight');
    if (settings.largeCursor) html.classList.add('a11y-large-cursor');
    if (settings.dyslexicFont) html.classList.add('a11y-dyslexic');
    if (settings.reducedMotion) html.classList.add('a11y-no-motion');

    html.style.fontSize = `${settings.fontSize}%`;
    html.style.setProperty('--a11y-line-spacing', settings.lineSpacing);
    html.style.setProperty('--a11y-text-spacing', `${settings.textSpacing}em`);

  }, [settings]);

  // Screen Reader logic
  useEffect(() => {
    if (!settings.screenReader) {
      window.speechSynthesis.cancel();
      return;
    }

    const handleMouseOver = (e) => {
      if (!settings.screenReader) return;
      
      // Get text and strip technical noise (IDs, brackets, etc)
      let text = e.target.innerText || e.target.ariaLabel || e.target.alt;
      if (text && text.length < 300) {
        text = text.replace(/[\[\]{}()_]/g, ' ').replace(/\s+/g, ' ').trim();
        
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Find best English voice
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
        if (englishVoice) utterance.voice = englishVoice;
        
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    };

    window.addEventListener('mouseover', handleMouseOver);
    return () => window.removeEventListener('mouseover', handleMouseOver);
  }, [settings.screenReader]);

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateNumeric = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetAll = () => {
    setSettings({
      readingGuide: false,
      highContrast: false,
      grayscale: false,
      focusHighlight: false,
      largeCursor: false,
      dyslexicFont: false,
      reducedMotion: false,
      lineSpacing: 1,
      textSpacing: 0,
      fontSize: 100,
      screenReader: false,
      focusMask: false,
    });
    window.speechSynthesis.cancel();
  };

  const ToolCard = ({ id, icon: Icon, label, active, onClick }) => (
    <button
      onClick={() => onClick ? onClick() : toggleSetting(id)}
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-[24px] transition-all duration-300 border gap-2",
        active 
          ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]" 
          : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100 hover:border-slate-200"
      )}
    >
      <Icon className={cn("w-6 h-6", active ? "text-white" : "text-slate-400")} />
      <span className="text-[10px] font-black tracking-widest uppercase">{label}</span>
    </button>
  );

  return (
    <>
      {/* Reading Guide */}
      {settings.readingGuide && (
        <div 
          className="a11y-reading-guide-line"
          style={{ top: `${mousePos.y}px`, transform: 'translateY(-50%)' }}
        />
      )}

      {/* Focus Mask (Spotlight) */}
      {settings.focusMask && (
        <div 
          className="fixed inset-0 pointer-events-none z-[99998]"
          style={{
            background: `radial-gradient(circle 150px at ${mousePos.x}px ${mousePos.y}px, transparent 100%, rgba(0,0,0,0.85) 0%)`
          }}
        />
      )}

      {/* Floating Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 left-8 w-16 h-16 bg-slate-900 text-white rounded-[24px] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[99999] group overflow-hidden"
        aria-label="Accessibility Settings"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {isOpen ? <X className="w-7 h-7 relative z-10" /> : <Accessibility className="w-7 h-7 relative z-10 group-hover:rotate-12 transition-transform" />}
      </button>

      {/* Main Panel */}
      {isOpen && (
        <div className="fixed bottom-28 left-8 w-[400px] max-h-[80vh] bg-white rounded-[40px] shadow-[0_32px_80px_rgba(0,0,0,0.25)] border border-slate-100 z-[99999] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
          {/* Header */}
          <div className="p-8 pb-4 flex items-center justify-between bg-slate-50/50 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-black tracking-tighter text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Assistive Tools
              </h3>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">Adaptive Workspace</p>
            </div>
            <button 
              onClick={resetAll}
              className="px-4 py-2 bg-white rounded-xl text-[10px] font-black tracking-widest text-slate-400 hover:text-primary border border-slate-100 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-3 h-3" /> RESET
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            {/* Visual Section */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase">Visual Enhancement</h4>
              <div className="grid grid-cols-3 gap-3">
                <ToolCard id="highContrast" icon={Sun} label="Contrast" active={settings.highContrast} />
                <ToolCard id="grayscale" icon={Monitor} label="Grayscale" active={settings.grayscale} />
                <ToolCard id="focusHighlight" icon={Square} label="Borders" active={settings.focusHighlight} />
                <ToolCard id="largeCursor" icon={MousePointer} label="Cursor" active={settings.largeCursor} />
                <ToolCard id="focusMask" icon={Search} label="Spotlight" active={settings.focusMask} />
                <ToolCard id="reducedMotion" icon={ZapOff} label="No Motion" active={settings.reducedMotion} />
              </div>
            </section>

            {/* Reading Section */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase">Reading & Focus</h4>
              <div className="grid grid-cols-2 gap-3">
                <ToolCard id="readingGuide" icon={MousePointer2} label="Reading Line" active={settings.readingGuide} />
                <ToolCard id="dyslexicFont" icon={Languages} label="Dyslexic" active={settings.dyslexicFont} />
              </div>

              {/* Sliders / Multi-state buttons */}
              <div className="space-y-4 pt-2">
                <div className="bg-slate-50 p-4 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Text Size</span>
                    <span className="text-xs font-black text-primary">{settings.fontSize}%</span>
                  </div>
                  <div className="flex gap-2">
                    {[100, 120, 140, 160].map(size => (
                      <button 
                        key={size}
                        onClick={() => updateNumeric('fontSize', size)}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
                          settings.fontSize === size ? "bg-primary text-white" : "bg-white text-slate-400"
                        )}
                      >
                        {size === 100 ? 'Std' : `+${size-100}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Line Spacing</span>
                    <span className="text-xs font-black text-primary">Level {settings.lineSpacing}</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 1.5, 2].map(val => (
                      <button 
                        key={val}
                        onClick={() => updateNumeric('lineSpacing', val)}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
                          settings.lineSpacing === val ? "bg-primary text-white" : "bg-white text-slate-400"
                        )}
                      >
                        {val === 1 ? 'Tight' : val === 1.5 ? 'Mid' : 'Wide'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Auditory Section */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase">Assistive Audio</h4>
              <ToolCard 
                id="screenReader" 
                icon={Volume2} 
                label="Screen Reader (TTS)" 
                active={settings.screenReader} 
                className="w-full"
              />
            </section>
          </div>

          {/* Footer Info */}
          <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Accessibility className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-widest">A11Y ENGINE v4.2</p>
                <p className="text-[8px] text-slate-400 font-bold tracking-[0.2em]">Maghrebia Intelligence</p>
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-500">WCAG 2.1 Compliant</p>
          </div>
        </div>
      )}
    </>
  );
}
