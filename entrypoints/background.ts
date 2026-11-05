import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';

export default defineBackground(() => {
    let kuroshiro: Kuroshiro | null = null;
    let initPromise: Promise<Kuroshiro> | null = null;

    async function getKuroshiro() {
        if (kuroshiro) return kuroshiro;
        if (!initPromise) {
            initPromise = (async () => {
                const instance = new Kuroshiro();
                await instance.init(new KuromojiAnalyzer({
                    dictPath: 'https://cdn.jsdelivr.net/gh/kotleni/kotobadesu@dev/public/dict/',
                }));
                kuroshiro = instance;
                return instance;
            })();
        }
        return initPromise;
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
    });
});