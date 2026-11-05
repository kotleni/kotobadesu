import App from "@/components/App.vue";

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
