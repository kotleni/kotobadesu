import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';

export default defineBackground(() => {
    let kuroshiro: Kuroshiro | null = null;
    let analyzer: KuromojiAnalyzer | null = null;
    let initPromise: Promise<Kuroshiro> | null = null;

    async function getKuroshiro() {
        if (kuroshiro) return kuroshiro;
        if (!initPromise) {
            initPromise = (async () => {
                const instance = new Kuroshiro();
                analyzer = new KuromojiAnalyzer({
                    dictPath: 'https://cdn.jsdelivr.net/gh/kotleni/kotobadesu@dev/public/dict/',
                });
                await instance.init(analyzer);
                kuroshiro = instance;
                return instance;
            })();
        }
        return initPromise;
    }

    async function lookupChar(char: string, line: string, romajiSystem: string) {
        const instance = await getKuroshiro();
        const safeChar = (char || '').slice(0, 2);
        const Util = (Kuroshiro as unknown as { Util: {
            isHiragana: (c: string) => boolean;
            isKatakana: (c: string) => boolean;
            isKana: (c: string) => boolean;
            isKanji: (c: string) => boolean;
            isJapanese: (c: string) => boolean;
        } }).Util;

        let type = 'Other';
        try {
            if (safeChar && Util?.isHiragana?.(safeChar)) type = 'Hiragana';
            else if (safeChar && Util?.isKatakana?.(safeChar)) type = 'Katakana';
            else if (safeChar && Util?.isKanji?.(safeChar)) type = 'Kanji';
            else if (safeChar && /^[\x00-\x7F]$/.test(safeChar)) type = 'Romaji';
        } catch {
            // fall back to Other
        }

        const [hiragana, katakana, romaji] = await Promise.all([
            instance.convert(safeChar, { to: 'hiragana', mode: 'normal' }).catch(() => safeChar),
            instance.convert(safeChar, { to: 'katakana', mode: 'normal' }).catch(() => safeChar),
            instance.convert(safeChar, { to: 'romaji', mode: 'normal', romajiSystem: romajiSystem as never }).catch(() => safeChar),
        ]);

        let token: { surface: string; reading?: string; pronunciation?: string; pos?: string } | null = null;
        if (line && analyzer) {
            try {
                const tokens = await analyzer.parse(line) as Array<{
                    surface_form: string;
                    reading?: string;
                    pronunciation?: string;
                    pos?: string;
                }>;
                const found = tokens.find((t) => (t.surface_form || '').includes(safeChar));
                if (found) {
                    token = {
                        surface: found.surface_form,
                        reading: found.reading,
                        pronunciation: found.pronunciation,
                        pos: found.pos,
                    };
                }
            } catch {
                // ignore token lookup failures
            }
        }

        let meanings: string[] | undefined;
        let on: string[] | undefined;
        let kun: string[] | undefined;
        if (type === 'Kanji' && safeChar) {
            try {
                const res = await fetch(`https://kanjiapi.dev/v1/kanji/${encodeURIComponent(safeChar)}`);
                if (res.ok) {
                    const data = (await res.json()) as {
                        meanings?: string[];
                        on_readings?: string[];
                        kun_readings?: string[];
                    };
                    meanings = data.meanings;
                    on = data.on_readings;
                    kun = data.kun_readings;
                }
            } catch {
                // offline / CORS / 404 — fall back to readings only
            }
        }

        return { char: safeChar, type, hiragana, katakana, romaji, meanings, on, kun, token };
    }

    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.type === 'CONVERT_TEXT') {
            const allowedModes = ['normal', 'spaced', 'okurigana', 'furigana'];
            const allowedTargets = ['hiragana', 'katakana', 'romaji'];
            const allowedRomajiSystems = ['hepburn', 'nippon', 'passport'];
            const mode = allowedModes.includes(message.mode) ? message.mode : 'furigana';
            const to = allowedTargets.includes(message.to) ? message.to : 'romaji';
            const romajiSystem = allowedRomajiSystems.includes(message.romajiSystem)
                ? message.romajiSystem
                : 'hepburn';
            const delimiter_start = typeof message.delimiter_start === 'string' ? message.delimiter_start : '(';
            const delimiter_end = typeof message.delimiter_end === 'string' ? message.delimiter_end : ')';
            getKuroshiro().then(async (instance) => {
                const result = await instance.convert(message.text, { to, mode, romajiSystem, delimiter_start, delimiter_end });
                sendResponse({ result });
            }).catch((err) => {
                console.error('Kuroshiro background error:', err);
                sendResponse({ result: '', error: err.message });
            });
            return true;
        }

        if (message.type === 'LOOKUP_CHAR') {
            const allowedRomajiSystems = ['hepburn', 'nippon', 'passport'];
            const romajiSystem = allowedRomajiSystems.includes(message.romajiSystem)
                ? message.romajiSystem
                : 'hepburn';
            lookupChar(message.char || '', message.line || '', romajiSystem)
                .then((result) => sendResponse({ result }))
                .catch((err) => {
                    console.error('Lookup error:', err);
                    sendResponse({ result: null, error: err.message });
                });
            return true;
        }
    });
});
