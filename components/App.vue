<script setup lang="ts">
import {useIntervalFn, useMutationObserver} from '@vueuse/core';
import PlayerOverlay from "@/components/PlayerOverlay.vue";
import SettingsDrawer from "@/components/SettingsDrawer.vue";
import { browser } from 'wxt/browser';
import { getConvertOptions, isHtmlOutput, useSettings } from '@/composables/useSettings';
import { computed, watch } from 'vue';

const { settings, isLoaded } = useSettings();

const useQuerySelector = (selector: string) => {
    const elementRef = ref<HTMLElement | null>();
    const {pause, resume, isActive} = useIntervalFn(() => {
        elementRef.value = document.querySelector<HTMLElement>(selector);
        if (elementRef.value) {
            console.log("useQuerySelector got", selector, elementRef.value);
            pause();
        }
    }, 100);
    return elementRef;
}

const containerRef = useQuerySelector('#ytp-caption-window-container');
const playerContainerRef = useQuerySelector("#player-container");

const line = ref('');
const rawText = ref('');
const htmlMode = computed(() => isHtmlOutput(getConvertOptions(settings.value).mode));

async function updateCaptions() {
    if (!containerRef.value) {
        line.value = '';
        return;
    }
    containerRef.value!.style.display = 'none';

    const text = containerRef!.value!.innerText;
    if (text) rawText.value = text;

    await convertText(rawText.value.trim());
}

async function convertText(text: string) {
    if (!text) {
        line.value = '';
        return;
    }
    const { to, mode, romajiSystem, delimiter_start, delimiter_end } = getConvertOptions(settings.value);
    try {
        const response = await browser.runtime.sendMessage({
            type: 'CONVERT_TEXT',
            text,
            to,
            mode,
            romajiSystem,
            delimiter_start,
            delimiter_end,
        });
        line.value = response?.result || '';
        // console.log(response);
    } catch (err) {
        console.error('Failed to send conversion request:', err);
    }
}

useMutationObserver(containerRef, (mutations) => {
    // for (const mutation of mutations) {
        updateCaptions();
    // }
}, {
    childList: true,
    subtree: true,
    characterData: true,
});

onMounted(() => updateCaptions());

// Re-convert the current caption whenever display settings change.
watch(settings, () => {
    if (isLoaded.value) void convertText(rawText.value.trim());
}, { deep: true });
</script>

<template>
    <teleport :to="playerContainerRef" v-if="playerContainerRef">
        <PlayerOverlay v-if="line.length > 0" :position="settings.position">
            <span v-if="htmlMode" class="furigana-container" v-html="line"></span>
            <span v-else class="furigana-container">{{ line }}</span>
        </PlayerOverlay>
        <SettingsDrawer />
    </teleport>
</template>
