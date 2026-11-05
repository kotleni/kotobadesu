<script setup lang="ts">
import {useIntervalFn, useMutationObserver} from '@vueuse/core';
import PlayerOverlay from "@/components/PlayerOverlay.vue";
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";

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
    // containerRef.value!.style.display = 'none';

    const text = containerRef!.value!.innerText;

    const kuroshiro = new Kuroshiro();
    await kuroshiro.init(new KuromojiAnalyzer({ dictPath: 'dict/' }));

    const result = await kuroshiro.convert(text, {
        to: "hiragana"
    });

    line.value = result;
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
            {{ line }}
        </PlayerOverlay>
    </teleport>
</template>