import { ref, watch } from 'vue';
import { browser } from 'wxt/browser';

export type CaptionPosition = 'top' | 'bottom';
export type KuroshiroTarget = 'hiragana' | 'katakana' | 'romaji';
export type KuroshiroMode = 'normal' | 'spaced' | 'okurigana' | 'furigana';
export type RomajiSystem = 'hepburn' | 'nippon' | 'passport';

export interface RomajiSettings {
  to: KuroshiroTarget;
  mode: KuroshiroMode;
  romajiSystem: RomajiSystem;
  delimiterStart: string;
  delimiterEnd: string;
  /** Overlay position inside the player. */
  position: CaptionPosition;
  /** Caption font size in px. */
  fontSize: number;
  /** Caption background opacity 0-1. */
  bgOpacity: number;
}

export const DEFAULT_SETTINGS: RomajiSettings = {
  to: 'romaji',
  mode: 'furigana',
  romajiSystem: 'hepburn',
  delimiterStart: '(',
  delimiterEnd: ')',
  position: 'bottom',
  fontSize: 32,
  bgOpacity: 0.85,
};

const STORAGE_KEY = 'romajiSettings';

// Module-level singleton so App.vue (conversion + overlay position) and
// SettingsDrawer.vue (controls) share the same reactive state.
const settings = ref<RomajiSettings>({ ...DEFAULT_SETTINGS });
const isLoaded = ref(false);

let initPromise: Promise<void> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let lastSavedJson: string | null = null;

const TARGETS: KuroshiroTarget[] = ['hiragana', 'katakana', 'romaji'];
const MODES: KuroshiroMode[] = ['normal', 'spaced', 'okurigana', 'furigana'];
const ROMAJI_SYSTEMS: RomajiSystem[] = ['hepburn', 'nippon', 'passport'];

function clampNumber(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function sanitize(raw: unknown): RomajiSettings {
  const base = { ...DEFAULT_SETTINGS };
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;

  // Legacy shape from the toggle-based UI: { showFurigana, showKana, onlyRomaji, position }.
  // Map it onto the direct Kuroshiro options so saved settings keep their effect.
  const hasNew = r.to != null || r.mode != null || r.romajiSystem != null;
  if (!hasNew && ('showFurigana' in r || 'showKana' in r || 'onlyRomaji' in r)) {
    const showFurigana = r.showFurigana !== false;
    const showKana = r.showKana !== false;
    const onlyRomaji = r.onlyRomaji === true;
    if (onlyRomaji) return { ...base, to: 'romaji', mode: 'normal', position: r.position === 'top' ? 'top' : 'bottom' };
    if (showFurigana && showKana) return { ...base, to: 'romaji', mode: 'furigana', position: r.position === 'top' ? 'top' : 'bottom' };
    if (showFurigana && !showKana) return { ...base, to: 'romaji', mode: 'spaced', position: r.position === 'top' ? 'top' : 'bottom' };
    if (!showFurigana && showKana) return { ...base, to: 'romaji', mode: 'okurigana', position: r.position === 'top' ? 'top' : 'bottom' };
    return { ...base, to: 'romaji', mode: 'normal', position: r.position === 'top' ? 'top' : 'bottom' };
  }

  return {
    to: (TARGETS as string[]).includes(String(r.to)) ? (r.to as KuroshiroTarget) : base.to,
    mode: (MODES as string[]).includes(String(r.mode)) ? (r.mode as KuroshiroMode) : base.mode,
    romajiSystem: (ROMAJI_SYSTEMS as string[]).includes(String(r.romajiSystem))
      ? (r.romajiSystem as RomajiSystem)
      : base.romajiSystem,
    delimiterStart: typeof r.delimiterStart === 'string' ? r.delimiterStart.slice(0, 10) : base.delimiterStart,
    delimiterEnd: typeof r.delimiterEnd === 'string' ? r.delimiterEnd.slice(0, 10) : base.delimiterEnd,
    position: r.position === 'top' ? 'top' : 'bottom',
    fontSize: clampNumber(r.fontSize, 16, 64, base.fontSize),
    bgOpacity: clampNumber(r.bgOpacity, 0, 1, base.bgOpacity),
  };
}

async function loadFromStorage(): Promise<void> {
  // Prefer extension storage (persists across sessions / syncs across tabs).
  try {
    const res = await browser.storage.local.get(STORAGE_KEY);
    const saved = (res as Record<string, unknown> | undefined)?.[STORAGE_KEY];
    if (saved != null) {
      settings.value = sanitize(saved);
      isLoaded.value = true;
      return;
    }
  } catch {
    // storage API unavailable (e.g. preview without extension context) — fall through.
  }

  // Fallback / migration source: localStorage copy.
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) settings.value = sanitize(JSON.parse(raw));
  } catch {
    // ignore corrupt storage
  }
  isLoaded.value = true;
}

async function saveToStorage(snapshot: RomajiSettings): Promise<void> {
  lastSavedJson = JSON.stringify(snapshot);
  // Always write both back-ends so the settings survive even if one becomes unavailable.
  try {
    await browser.storage.local.set({ [STORAGE_KEY]: snapshot });
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore (private mode, quota, etc.)
  }
}

function ensureInit(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // Persist every change (deep) once the initial load has completed.
    // Debounced so dragging a slider coalesces into a single write instead
    // of a stream of stale echoes that make the slider flash back and forth.
    watch(
      settings,
      () => {
        if (!isLoaded.value) return;
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          saveTimer = null;
          const snapshot = JSON.parse(JSON.stringify(settings.value)) as RomajiSettings;
          void saveToStorage(snapshot);
        }, 300);
      },
      { deep: true },
    );

    // Keep multiple tabs in sync when the user changes settings elsewhere.
    try {
      const onChanged = (changes: Record<string, { newValue?: unknown }>, area: string) => {
        if (area !== 'local' || !changes[STORAGE_KEY]?.newValue) return;
        const next = sanitize(changes[STORAGE_KEY].newValue);
        const nextJson = JSON.stringify(next);
        // Ignore echoes of our own writes (including stale ones from mid-drag).
        if (nextJson === lastSavedJson) return;
        if (nextJson === JSON.stringify(settings.value)) return;
        settings.value = next;
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (browser.storage as any)?.onChanged?.addListener?.(onChanged);
    } catch {
      // ignore
    }

    await loadFromStorage();
  })();

  return initPromise;
}

export function useSettings() {
  void ensureInit();
  return {
    settings,
    isLoaded,
    ready: () => ensureInit(),
  };
}

/** Map the stored settings directly onto a Kuroshiro conversion request. */
export function getConvertOptions(s: RomajiSettings): {
  to: KuroshiroTarget;
  mode: KuroshiroMode;
  romajiSystem: RomajiSystem;
  delimiter_start: string;
  delimiter_end: string;
} {
  return {
    to: s.to,
    mode: s.mode,
    romajiSystem: s.romajiSystem,
    delimiter_start: s.delimiterStart,
    delimiter_end: s.delimiterEnd,
  };
}

/** Only `furigana` mode returns HTML (<ruby>); the other modes are plain text. */
export function isHtmlOutput(mode: KuroshiroMode | string): boolean {
  return mode === 'furigana';
}
