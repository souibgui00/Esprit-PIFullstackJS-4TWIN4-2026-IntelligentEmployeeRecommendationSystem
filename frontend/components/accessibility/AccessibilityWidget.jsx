import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import {
    PersonStanding,
    X,
    Type,
    Contrast,
    Eye,
    AlignLeft,
    Move,
    ZapOff,
    ScanLine,
    Space,
    RotateCcw,
} from "lucide-react"
import {
    applyAccessibilitySettings,
    saveAccessibilitySettings,
    hasAnyAccessibilitySetting,
    loadAccessibilitySettings,
    defaultAccessibilitySettings,
    FONT_LABELS,
} from "@/components/accessibility/accessibility-settings"

export function AccessibilityWidget() {
    const [open, setOpen] = useState(false)
    const [settings, setSettings] = useState(() => loadAccessibilitySettings())
    const [guideY, setGuideY] = useState(-100)
    const panelRef = useRef(null)
    const toggleRef = useRef(null)
    const restoreFocusRef = useRef(null)

    useEffect(() => {
        applyAccessibilitySettings(settings)
        saveAccessibilitySettings(settings)
    }, [settings])

    useEffect(() => {
        const onStorage = (event) => {
            if (event.key === "skillmatch_a11y") {
                setSettings(loadAccessibilitySettings())
            }
        }
        window.addEventListener("storage", onStorage)
        return () => window.removeEventListener("storage", onStorage)
    }, [])

    useEffect(() => {
        if (!settings.readingGuide) return
        const handler = (e) => setGuideY(e.clientY)
        window.addEventListener("mousemove", handler)
        return () => window.removeEventListener("mousemove", handler)
    }, [settings.readingGuide])

    useEffect(() => {
        if (!open) return
        restoreFocusRef.current = document.activeElement

        const focusPanel = window.requestAnimationFrame(() => {
            panelRef.current?.focus()
        })

        const handler = (event) => {
            if (event.key === "Escape") {
                event.preventDefault()
                setOpen(false)
            }
        }

        const handlePointerDown = (event) => {
            const target = event.target
            if (
                panelRef.current?.contains(target) ||
                toggleRef.current?.contains(target)
            ) {
                return
            }
            setOpen(false)
        }

        document.addEventListener("keydown", handler)
        document.addEventListener("pointerdown", handlePointerDown)
        return () => {
            window.cancelAnimationFrame(focusPanel)
            document.removeEventListener("keydown", handler)
            document.removeEventListener("pointerdown", handlePointerDown)
        }
    }, [open])

    useEffect(() => {
        if (open) return
        restoreFocusRef.current?.focus?.()
    }, [open])

    const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }))
    const toggle = (key) => update(key, !settings[key])
    const reset = () => setSettings(defaultAccessibilitySettings)

    const hasAnyActive = hasAnyAccessibilitySetting(settings)

    return (
        <>
            {settings.readingGuide && (
                <div
                    className="pointer-events-none fixed left-0 right-0 z-[99999]"
                    style={{ top: guideY - 14, height: 28 }}
                >
                    <div className="w-full h-full bg-[#F28C1B]/10 border-y border-[#F28C1B]/30" />
                </div>
            )}

            <button
                ref={toggleRef}
                onClick={() => setOpen((current) => !current)}
                aria-label="Open accessibility settings"
                aria-controls="accessibility-panel"
                aria-expanded={open}
                className={cn(
                    "fixed bottom-8 right-8 z-[9998] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 group",
                    open
                        ? "bg-[#F28C1B] rotate-180 shadow-[#F28C1B]/40"
                        : "bg-[#222222] hover:bg-[#F28C1B] shadow-[#222222]/30 hover:shadow-[#F28C1B]/30"
                )}
            >
                {open
                    ? <X className="w-6 h-6 text-white" />
                    : <PersonStanding className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                }
                {hasAnyActive && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#F28C1B] rounded-full border-2 border-white animate-pulse" />
                )}
            </button>

            <div
                ref={panelRef}
                id="accessibility-panel"
                role="dialog"
                aria-modal="false"
                aria-label="Accessibility settings"
                tabIndex={-1}
                className={cn(
                    "fixed right-8 z-[9997] w-80 bg-white border border-[#EEEEEE] rounded-[4px] shadow-2xl shadow-[#222222]/10 overflow-hidden transition-all duration-500",
                    open
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 translate-y-4 pointer-events-none"
                )}
                style={{ bottom: "calc(7rem)" }}
            >
                <div className="bg-[#222222] px-8 py-6 flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-bold text-[#F28C1B] tracking-[0.4em]">Assist Protocol</p>
                        <h2 className="text-lg font-black font-display text-white tracking-tighter leading-tight">
                            Accessibility
                        </h2>
                    </div>
                    <button
                        onClick={reset}
                        title="Reset all settings"
                        className="flex items-center gap-2 text-[9px] font-bold text-gray-400 tracking-widest hover:text-[#F28C1B] transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset
                    </button>
                </div>

                <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
                    <div className="bg-[#F8FAFC] border border-[#EEEEEE] rounded-[4px] p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <Type className="w-4 h-4 text-[#F28C1B]" />
                            <span className="text-[10px] font-black font-display text-[#222222] tracking-widest">
                                Text Size
                            </span>
                            <span className="ml-auto text-[9px] font-bold text-[#F28C1B] tracking-widest ">
                                {FONT_LABELS[settings.fontSize + 1]}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => update("fontSize", Math.max(-1, settings.fontSize - 1))}
                                disabled={settings.fontSize <= -1}
                                className="w-8 h-8 rounded-[4px] bg-white border border-[#EEEEEE] text-[#222222] font-black text-sm hover:border-[#F28C1B] hover:text-[#F28C1B] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
                                                ? "bg-[#F28C1B]"
                                                : "bg-[#EEEEEE] hover:bg-[#F28C1B]/40"
                                        )}
                                        aria-label={`Set text size to ${label}`}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={() => update("fontSize", Math.min(3, settings.fontSize + 1))}
                                disabled={settings.fontSize >= 3}
                                className="w-8 h-8 rounded-[4px] bg-white border border-[#EEEEEE] text-[#222222] font-black text-sm hover:border-[#F28C1B] hover:text-[#F28C1B] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Increase text size"
                            >+</button>
                        </div>
                    </div>

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
                            desc: "Disables animations and transitions",
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
                            desc: "Increases spacing between letters and words",
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
                                        : "bg-[#F8FAFC] border-[#EEEEEE] hover:border-[#F28C1B]/30 hover:bg-white"
                                )}
                                aria-pressed={active}
                            >
                                <div className={cn(
                                    "w-9 h-9 rounded-[4px] flex items-center justify-center shrink-0 transition-colors",
                                    active ? "bg-[#F28C1B]" : "bg-[#EEEEEE] group-hover:bg-[#F28C1B]/10"
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
                                    <p className="text-[9px] font-medium leading-relaxed text-gray-400">
                                        {desc}
                                    </p>
                                </div>
                                <div className={cn(
                                    "w-5 h-5 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center transition-all",
                                    active
                                        ? "bg-[#F28C1B] border-[#F28C1B]"
                                        : "border-[#EEEEEE] group-hover:border-[#F28C1B]/50"
                                )}>
                                    {active && <div className="w-2 h-2 rounded-full bg-white" />}
                                </div>
                            </button>
                        )
                    })}
                </div>

                <div className="px-6 py-4 border-t border-[#EEEEEE] bg-[#F8FAFC]">
                    <p className="text-[9px] font-bold text-gray-400 tracking-widest text-center">
                        Settings saved automatically - WCAG 2.1 Compliant
                    </p>
                </div>
            </div>
        </>
    )
}

