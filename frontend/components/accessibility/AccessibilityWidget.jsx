import { useState, useEffect, useRef } from "react"
import { cn } from "../../lib/utils"
import {
    PersonStanding, X, Type, Contrast, Eye, AlignLeft,
    Move, ZapOff, ScanLine, Space, AlignJustify, Target, RotateCcw
} from "lucide-react"

const STORAGE_KEY = "skillmatch_a11y"

const defaultSettings = {
    fontSize: 0,       // -1 = sm, 0 = normal, 1 = lg, 2 = xl, 3 = 2xl
    highContrast: false,
    grayscale: false,
    dyslexicFont: false,
    reduceMotion: false,
    readingGuide: false,
    focusHighlight: false,
    letterSpacing: false,
    lineHeight: false,
    largeTargets: false,
}

const FONT_LABELS = ["Sm", "Norm", "Lg", "XL", "2XL"]
const FONT_SCALES = [0.88, 1.0, 1.12, 1.25, 1.4]

function applySettings(settings) {
    const root = document.documentElement

    // Font size via CSS var
    root.style.setProperty("--a11y-font-scale", FONT_SCALES[settings.fontSize + 1] ?? 1)

    // Toggle body classes
    const toggleClass = (cls, active) =>
        active ? root.classList.add(cls) : root.classList.remove(cls)

    toggleClass("a11y-high-contrast", settings.highContrast)
    toggleClass("a11y-grayscale", settings.grayscale)
    toggleClass("a11y-dyslexic", settings.dyslexicFont)
    toggleClass("a11y-no-motion", settings.reduceMotion)
    toggleClass("a11y-reading-guide", settings.readingGuide)
    toggleClass("a11y-focus-highlight", settings.focusHighlight)
    toggleClass("a11y-letter-spacing", settings.letterSpacing)
    toggleClass("a11y-line-height", settings.lineHeight)
    toggleClass("a11y-large-targets", settings.largeTargets)
}

export function AccessibilityWidget() {
    const [open, setOpen] = useState(false)
    const [settings, setSettings] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
        } catch {
            return defaultSettings
        }
    })
    const [guideY, setGuideY] = useState(-100)
    const panelRef = useRef(null)

    // Apply settings on mount + any change
    useEffect(() => {
        applySettings(settings)
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)) } catch { }
    }, [settings])

    // Reading guide: track mouse Y
    useEffect(() => {
        if (!settings.readingGuide) return
        const handler = (e) => setGuideY(e.clientY)
        window.addEventListener("mousemove", handler)
        return () => window.removeEventListener("mousemove", handler)
    }, [settings.readingGuide])

    // Close on click outside
    useEffect(() => {
        if (!open) return
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
        }
        setTimeout(() => document.addEventListener("mousedown", handler), 0)
        return () => document.removeEventListener("mousedown", handler)
    }, [open])

    const update = (key, value) => setSettings(s => ({ ...s, [key]: value }))
    const toggle = (key) => update(key, !settings[key])
    const reset = () => setSettings(defaultSettings)

    const hasAnyActive = Object.entries(settings).some(([k, v]) =>
        k === "fontSize" ? v !== 0 : v === true
    )

    return (
        <>
            {/* Reading Guide Line */}
            {settings.readingGuide && (
                <div
                    className="pointer-events-none fixed left-0 right-0 z-99999"
                    style={{ top: guideY - 14, height: 28 }}
                >
                    <div className="w-full h-full bg-primary/10 border-y border-primary/30" />
                </div>
            )}

            {/* Floating Trigger Button */}
            <button
                onClick={() => setOpen(o => !o)}
                aria-label="Open accessibility options"
                className={cn(
                    "fixed bottom-8 right-8 z-9998 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 group",
                    open
                        ? "bg-primary rotate-180 shadow-primary/40"
                        : "bg-[#222222] hover:bg-primary shadow-[#222222]/30 hover:shadow-primary/30"
                )}
            >
                {open
                    ? <X className="w-6 h-6 text-white" />
                    : <PersonStanding className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                }
                {hasAnyActive && !open && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white animate-pulse" />
                )}
            </button>

            {/* Panel */}
            <div
                ref={panelRef}
                className={cn(
                    "fixed right-8 z-9997 w-80 bg-white border border-[#EEEEEE] rounded-[4px] shadow-2xl shadow-[#222222]/10 overflow-hidden transition-all duration-500",
                    open
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 translate-y-4 pointer-events-none"
                )}
                style={{ bottom: "calc(7rem)" }}
                role="dialog"
                aria-label="Accessibility settings"
            >
                {/* Header */}
                <div className="bg-[#222222] px-8 py-6 flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-bold text-primary tracking-[0.4em]">Assist Protocol</p>
                        <h2 className="text-lg font-black font-display text-white tracking-tighter leading-tight">
                            Accessibility
                        </h2>
                    </div>
                    <button
                        onClick={reset}
                        title="Reset all settings"
                        className="flex items-center gap-2 text-[9px] font-bold text-gray-400 tracking-widest hover:text-primary transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset
                    </button>
                </div>

                <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">

                    {/* Font Size */}
                    <div className="bg-[#F8FAFC] border border-[#EEEEEE] rounded-[4px] p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <Type className="w-4 h-4 text-primary" />
                            <span className="text-[10px] font-black font-display text-[#222222] tracking-widest">
                                Text Size
                            </span>
                            <span className="ml-auto text-[9px] font-bold text-primary tracking-widest ">
                                {FONT_LABELS[settings.fontSize + 1]}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => update("fontSize", Math.max(-1, settings.fontSize - 1))}
                                disabled={settings.fontSize <= -1}
                                className="w-8 h-8 rounded-[4px] bg-white border border-[#EEEEEE] text-[#222222] font-black text-sm hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Decrease text size"
                            >−</button>
                            <div className="flex-1 flex gap-1">
                                {FONT_LABELS.map((label, i) => (
                                    <button
                                        key={i}
                                        onClick={() => update("fontSize", i - 1)}
                                        className={cn(
                                            "flex-1 h-2 rounded-full transition-all",
                                            i <= settings.fontSize + 1
                                                ? "bg-primary"
                                                : "bg-[#EEEEEE] hover:bg-primary/40"
                                        )}
                                        aria-label={`Set text size to ${label}`}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={() => update("fontSize", Math.min(3, settings.fontSize + 1))}
                                disabled={settings.fontSize >= 3}
                                className="w-8 h-8 rounded-[4px] bg-white border border-[#EEEEEE] text-[#222222] font-black text-sm hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Increase text size"
                            >+</button>
                        </div>
                    </div>

                    {/* Toggle Features */}
                    {[
                        {
                            key: "highContrast",
                            icon: Contrast,
                            label: "High Contrast",
                            desc: "Increases color contrast for better visibility",
                        },
                        {
                            key: "grayscale",
                            icon: Eye,
                            label: "Grayscale",
                            desc: "Removes all colors for color-blind users",
                        },
                        {
                            key: "dyslexicFont",
                            icon: AlignLeft,
                            label: "Dyslexia Font",
                            desc: "Switches to a dyslexia-friendly typeface",
                        },
                        {
                            key: "reduceMotion",
                            icon: ZapOff,
                            label: "Reduce Motion",
                            desc: "Disables animations & transitions",
                        },
                        {
                            key: "readingGuide",
                            icon: ScanLine,
                            label: "Reading Guide",
                            desc: "Highlights the line under your cursor",
                        },
                        {
                            key: "focusHighlight",
                            icon: Move,
                            label: "Focus Highlight",
                            desc: "Adds strong focus rings to all elements",
                        },
                        {
                            key: "letterSpacing",
                            icon: Space,
                            label: "Letter Spacing",
                            desc: "Increases spacing between letters & words",
                        },
                        {
                            key: "lineHeight",
                            icon: AlignJustify,
                            label: "Line Height",
                            desc: "Adds more breathing room between text lines",
                        },
                        {
                            key: "largeTargets",
                            icon: Target,
                            label: "Large Targets",
                            desc: "Makes buttons and controls easier to tap",
                        },
                    ].map(({ key, icon: Icon, label, desc }) => {
                        const active = settings[key]
                        return (
                            <button
                                key={key}
                                onClick={() => toggle(key)}
                                className={cn(
                                    "w-full flex items-start gap-4 p-5 rounded-[4px] border text-left transition-all group",
                                    active
                                        ? "bg-[#222222] border-[#222222] shadow-lg shadow-[#222222]/10"
                                        : "bg-[#F8FAFC] border-[#EEEEEE] hover:border-primary/30 hover:bg-white"
                                )}
                                aria-pressed={active}
                            >
                                <div className={cn(
                                    "w-9 h-9 rounded-[4px] flex items-center justify-center shrink-0 transition-colors",
                                    active ? "bg-primary" : "bg-[#EEEEEE] group-hover:bg-primary/10"
                                )}>
                                    <Icon className={cn("w-4 h-4", active ? "text-white" : "text-[#222222]")} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        "text-[11px] font-black font-display tracking-widest leading-none mb-1",
                                        active ? "text-white" : "text-[#222222]"
                                    )}>
                                        {label}
                                    </p>
                                    <p className={cn(
                                        "text-[9px] font-medium leading-relaxed",
                                        active ? "text-gray-400" : "text-gray-400"
                                    )}>
                                        {desc}
                                    </p>
                                </div>
                                <div className={cn(
                                    "w-5 h-5 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center transition-all",
                                    active
                                        ? "bg-primary border-primary"
                                        : "border-[#EEEEEE] group-hover:border-primary/50"
                                )}>
                                    {active && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#EEEEEE] bg-[#F8FAFC]">
                    <p className="text-[9px] font-bold text-gray-400 tracking-widest text-center">
                        Settings saved automatically · WCAG 2.1 Compliant
                    </p>
                </div>
            </div>
        </>
    )
}

