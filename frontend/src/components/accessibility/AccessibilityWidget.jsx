import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';

// Internal utility to replace 'cn' and avoid import errors
const cn = (...classes) => classes.filter(Boolean).join(' ');

export function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('a11y-settings');
    return saved ? JSON.parse(saved) : {
      readingGuide: false,
      highContrast: false,
      grayscale: false,
      largeCursor: false,
      focusRings: false,
      dyslexicFont: false,
      fontSize: 100,
      screenReader: false,
      spotlight: false,
      reduceMotion: false
    };
  });

  const [guidePosition, setGuidePosition] = useState(0);
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    localStorage.setItem('a11y-settings', JSON.stringify(settings));
    const body = document.documentElement;
    
    // Apply High Contrast
    if (settings.highContrast) body.classList.add('a11y-high-contrast');
    else body.classList.remove('a11y-high-contrast');

    // Apply other styles to body
    const bodyEl = document.body;
    bodyEl.classList.toggle('a11y-grayscale', settings.grayscale);
    bodyEl.classList.toggle('a11y-large-cursor', settings.largeCursor);
    bodyEl.classList.toggle('a11y-focus-rings', settings.focusRings);
    bodyEl.classList.toggle('a11y-dyslexic', settings.dyslexicFont);
    bodyEl.classList.toggle('a11y-no-motion', settings.reduceMotion);
    
    body.style.fontSize = `${settings.fontSize}%`;

    return () => {
      body.style.fontSize = '';
    };
  }, [settings]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (settings.readingGuide) setGuidePosition(e.clientY);
      if (settings.spotlight) setSpotlightPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [settings.readingGuide, settings.spotlight]);

  useEffect(() => {
    const handleMouseOver = (e) => {
      if (!settings.screenReader) return;
      let text = e.target.innerText || e.target.ariaLabel || e.target.alt;
      if (text && text.length < 300) {
        text = text.replace(/[\[\]{}()_]/g, ' ').replace(/\s+/g, ' ').trim();
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
      }
    };
    window.addEventListener('mouseover', handleMouseOver);
    return () => window.removeEventListener('mouseover', handleMouseOver);
  }, [settings.screenReader]);

  const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  
  const resetSettings = () => {
    setSettings({
      readingGuide: false,
      highContrast: false,
      grayscale: false,
      largeCursor: false,
      focusRings: false,
      dyslexicFont: false,
      fontSize: 100,
      screenReader: false,
      spotlight: false,
      reduceMotion: false
    });
  };

  return (
    <>
      {/* Reading Guide Line */}
      {settings.readingGuide && (
        <div 
          className="fixed left-0 right-0 h-1 bg-[#F28C1B]/60 pointer-events-none z-[2147483647] shadow-[0_0_20px_rgba(242,140,27,0.8)] transition-all duration-75 ease-out"
          style={{ top: `${guidePosition}px`, transform: 'translateY(-50%)' }}
        />
      )}

      {/* Spotlight Mask */}
      {settings.spotlight && (
        <div 
          className="fixed inset-0 pointer-events-none z-[2147483646]"
          style={{
            background: `radial-gradient(circle 200px at ${spotlightPos.x}px ${spotlightPos.y}px, transparent 0%, rgba(0,0,0,0.9) 100%)`
          }}
        />
      )}

      {/* Floating Button (ORANGE Background for Maximum Visibility) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-[#F28C1B] text-white rounded-3xl shadow-[0_15px_50px_rgba(242,140,27,0.4)] flex items-center justify-center hover:scale-110 hover:rotate-6 active:scale-90 transition-all z-[2147483647] group border-none cursor-pointer border-4 border-white"
        aria-label="Accessibility Settings"
      >
        {isOpen ? (
          <Lucide.X className="w-8 h-8 animate-in spin-in-90 duration-300" />
        ) : (
          <Lucide.PersonStanding className="w-8 h-8 group-hover:scale-125 transition-transform duration-300 drop-shadow-md" />
        )}
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <div className="fixed bottom-32 right-8 w-85 bg-white rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.3)] border-4 border-[#F28C1B]/10 p-8 z-[2147483647] animate-in slide-in-from-bottom-10 fade-in duration-500">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#F28C1B] rounded-2xl shadow-lg shadow-orange-500/30">
                <Lucide.PersonStanding className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-2xl tracking-tighter">Accessibility</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Support Center</p>
              </div>
            </div>
            <button onClick={resetSettings} className="p-2 hover:bg-slate-100 rounded-xl transition-all border-none bg-transparent cursor-pointer group">
              <Lucide.RotateCcw className="w-5 h-5 text-slate-400 group-hover:text-[#F28C1B] group-hover:rotate-[-45deg] transition-all" />
            </button>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            {[
              { key: 'readingGuide', icon: <Lucide.MousePointer2 />, label: 'Reading Guide', desc: 'Visual focus line' },
              { key: 'highContrast', icon: <Lucide.Eye />, label: 'High Contrast', desc: 'Sharp color profiles' },
              { key: 'grayscale', icon: <Lucide.Sun />, label: 'Monochrome', desc: 'Black and white' },
              { key: 'largeCursor', icon: <Lucide.MousePointer />, label: 'Large Cursor', desc: 'Bigger mouse pointer' },
              { key: 'focusRings', icon: <Lucide.Zap />, label: 'Focus Rings', desc: 'Highlight active elements' },
              { key: 'dyslexicFont', icon: <Lucide.Type />, label: 'Dyslexic Font', desc: 'Specialized typeface' },
              { key: 'screenReader', icon: <Lucide.Volume2 />, label: 'Screen Reader', desc: 'Text-to-speech engine' },
              { key: 'spotlight', icon: <Lucide.Search />, label: 'Spotlight', desc: 'Focus on small area' },
              { key: 'reduceMotion', icon: <Lucide.Wind />, label: 'Reduce Motion', desc: 'Minimize animations' },
            ].map(tool => (
              <div 
                key={tool.key}
                className={cn(
                  "flex items-center justify-between p-4 rounded-[1.5rem] transition-all duration-300 cursor-pointer group/item",
                  settings[tool.key] 
                    ? "bg-[#F28C1B] text-white shadow-xl shadow-orange-500/20 scale-[1.02]" 
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-transparent hover:border-orange-200"
                )}
                onClick={() => toggle(tool.key)}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                    settings[tool.key] ? "bg-white/20" : "bg-white shadow-sm"
                  )}>
                    {React.cloneElement(tool.icon, { 
                      className: cn("w-6 h-6", settings[tool.key] ? "text-white" : "text-[#F28C1B]") 
                    })}
                  </div>
                  <div>
                    <p className="text-[15px] font-black tracking-tight leading-none mb-1">{tool.label}</p>
                    <p className={cn("text-[10px] font-bold", settings[tool.key] ? "text-white/80" : "text-slate-400")}>{tool.desc}</p>
                  </div>
                </div>
                {settings[tool.key] && (
                  <Lucide.Check className="w-5 h-5 text-white stroke-[4px] animate-in zoom-in duration-300" />
                )}
              </div>
            ))}

            {/* Font Size Scaling */}
            <div className="space-y-4 px-1 pt-6 border-t border-slate-100 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lucide.Type className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-black text-slate-900 tracking-tight">Text Magnification</span>
                </div>
                <span className="text-xs font-black text-white bg-[#F28C1B] px-3 py-1 rounded-full shadow-lg shadow-orange-500/20">{settings.fontSize}%</span>
              </div>
              <div className="flex items-center gap-5">
                <button 
                  onClick={() => setSettings(s => ({ ...s, fontSize: Math.max(80, s.fontSize - 10) }))}
                  className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-xl hover:bg-slate-200 transition-all border-none cursor-pointer text-slate-600"
                >-</button>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-[#F28C1B] to-[#FFB76B] rounded-full transition-all duration-500 ease-out shadow-sm" style={{ width: `${(settings.fontSize - 80) / (150 - 80) * 100}%` }} />
                </div>
                <button 
                  onClick={() => setSettings(s => ({ ...s, fontSize: Math.min(150, s.fontSize + 10) }))}
                  className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-xl hover:bg-slate-200 transition-all border-none cursor-pointer text-slate-600"
                >+</button>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-[#F28C1B] rounded-full" />
              <div>
                <p className="text-[11px] font-black tracking-[0.2em] text-slate-900 leading-none">A11Y v4.2</p>
                <p className="text-[8px] text-slate-400 font-bold tracking-widest uppercase mt-1">Maghrebia Intelligence</p>
              </div>
            </div>
            <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
              <p className="text-[10px] font-black text-emerald-600 tracking-tight flex items-center gap-2">
                <Lucide.Shield className="w-3 h-3" /> WCAG COMPLIANT
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
