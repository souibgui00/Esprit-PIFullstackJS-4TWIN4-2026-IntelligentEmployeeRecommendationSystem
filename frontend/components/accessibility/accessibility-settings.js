export const ACCESSIBILITY_STORAGE_KEY = "skillmatch_a11y"

export const defaultAccessibilitySettings = {
  fontSize: 0,
  highContrast: false,
  grayscale: false,
  dyslexicFont: false,
  reduceMotion: false,
  readingGuide: false,
  focusHighlight: false,
  letterSpacing: false,
}

export const FONT_LABELS = ["Sm", "Norm", "Lg", "XL", "2XL"]
const FONT_SCALES = [0.88, 1.0, 1.12, 1.25, 1.4]

export function loadAccessibilitySettings() {
  try {
    const saved = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY)
    return saved ? { ...defaultAccessibilitySettings, ...JSON.parse(saved) } : defaultAccessibilitySettings
  } catch {
    return defaultAccessibilitySettings
  }
}

export function saveAccessibilitySettings(settings) {
  try {
    localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Ignore storage errors in private mode or restricted environments.
  }
}

export function hasAnyAccessibilitySetting(settings) {
  return Object.entries(settings).some(([key, value]) => (key === "fontSize" ? value !== 0 : value === true))
}

export function applyAccessibilitySettings(settings) {
  const root = document.documentElement
  root.style.setProperty("--a11y-font-scale", FONT_SCALES[settings.fontSize + 1] ?? 1)

  const toggleClass = (cls, active) => {
    if (active) {
      root.classList.add(cls)
      return
    }
    root.classList.remove(cls)
  }

  toggleClass("a11y-high-contrast", settings.highContrast)
  toggleClass("a11y-grayscale", settings.grayscale)
  toggleClass("a11y-dyslexic", settings.dyslexicFont)
  toggleClass("a11y-no-motion", settings.reduceMotion)
  toggleClass("a11y-reading-guide", settings.readingGuide)
  toggleClass("a11y-focus-highlight", settings.focusHighlight)
  toggleClass("a11y-letter-spacing", settings.letterSpacing)
}