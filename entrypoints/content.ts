import App from "@/components/App.vue";

function removeStaleUi() {
    document.querySelectorAll('.cool-captions, .rt-settings').forEach((el) => el.remove());
    document.querySelectorAll('.rt-ui-wrapper').forEach((el) => el.remove());
}

export default defineContentScript({
    matches: ['*://*.youtube.com/*'],
    main(ctx) {
        // Dev reloads re-run this script without a page reload: the previous
        // instance's Vue app may not have unmounted yet, so remove any
        // leftover teleported nodes / wrappers before mounting fresh.
        removeStaleUi();

        const ui = createIntegratedUi(ctx, {
            position: 'overlay',
            alignment: 'top-right',
            zIndex: 100,
            anchor: 'body',
            onMount(container) {
                container.classList.add('rt-ui-wrapper');
                const app = createApp(App);
                app.mount(container);
                return app;
            },
            onRemove(app) {
                app?.unmount();
                // Teleported nodes live outside the wrapper, so explicitly
                // drop any the unmount may have left behind.
                document.querySelectorAll('.cool-captions, .rt-settings').forEach((el) => el.remove());
            },
        });
        ui.autoMount();
    },
});
