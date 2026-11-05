import HelloWorld from "@/components/PlayerOverlay.vue";
import App from "@/components/App.vue";
/*
function attachObserver() {
    const targetNode: HTMLElement | null = document.querySelector('#ytp-caption-window-container');

    if (!targetNode) {
        console.error('There is no yt caption node element');
        return;
    }

    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                targetNode.style.display = 'none';
                console.log(targetNode.innerText);
            }
        }
    });

    observer.observe(targetNode, {
        childList: true,
        subtree: true,
        characterData: true,
    });

    console.log(`Observer has been attached: ${targetNode.tagName}`);
}

function attachUI(): boolean {
    const container: HTMLElement | null = document.querySelector('#container');

    if (!container) {
        console.error('There is no container');
        return false;
    }

    return true;
}

function app() {
    const interval = setInterval(() => {
        if (attachUI()) {
            clearInterval(interval);

            attachObserver();
        }
    }, 1000 / 10);
}
*/

export default defineContentScript({
    matches: ['*://*.youtube.com/*'],
    main(ctx) {
        const existingUi = document.querySelector('.cool-captions');
        if (existingUi) {
            existingUi.remove();
        }

        const ui = createIntegratedUi(ctx, {
            position: 'overlay',
            alignment: 'top-right',
            zIndex: 100,
            anchor: 'body',
            onMount(container) {
                const app = createApp(App);
                app.mount(container);
                return app;
            },
            onRemove(app) {
                app?.unmount();
            },
        });
        ui.autoMount();
    },
});
