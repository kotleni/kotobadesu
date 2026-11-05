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
            getKuroshiro().then(async (instance) => {
                const result = await instance.convert(message.text, { to: message.to });
                sendResponse({ result });
            }).catch((err) => {
                console.error('Kuroshiro background error:', err);
                sendResponse({ result: '', error: err.message });
            });
            return true;
        }
    });
});