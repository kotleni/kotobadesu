<script setup lang="ts">
import {useIntervalFn, useMutationObserver} from '@vueuse/core';
import PlayerOverlay from "@/components/PlayerOverlay.vue";
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
import { browser } from 'wxt/browser';

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

async function updateCaptions() {
    if (!containerRef.value) {
        line.value = '';
        return;
    }
    containerRef.value!.style.display = 'none';

    const text = containerRef!.value!.innerText;

    try {
        const response = await browser.runtime.sendMessage({
            type: 'CONVERT_TEXT',
            text,
            to: 'romaji',
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
</script>

<template>
    <teleport :to="playerContainerRef" v-if="playerContainerRef">
        <PlayerOverlay v-if="line.length > 0">
            <span class="furigana-container" v-html="line"></span>
        </PlayerOverlay>
    </teleport>
</template>