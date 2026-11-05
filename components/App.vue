<script setup lang="ts">
import {useIntervalFn, useMutationObserver} from '@vueuse/core';
import PlayerOverlay from "@/components/PlayerOverlay.vue";
import SettingsDrawer from "@/components/SettingsDrawer.vue";
import LookupModal, { type LookupResult } from "@/components/LookupModal.vue";
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

const lookup = ref<LookupResult | null>(null);
const lookupLoading = ref(false);
const hoverBox = ref<{ left: number; top: number; width: number; height: number } | null>(null);

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

// Close lookup if the feature is turned off while open.
watch(() => settings.value.lookupEnabled, (enabled) => {
    if (!enabled) {
        lookup.value = null;
        hoverBox.value = null;
    }
});

watch(line, () => {
    hoverBox.value = null;
});

function clearHighlights() {
    document.querySelectorAll('.rt-selected').forEach((el) => {
        const parent = el.parentNode;
        if (!parent) return;
        const text = document.createTextNode(el.textContent || '');
        parent.replaceChild(text, el);
        parent.normalize();
    });
}

function getCaretRange(x: number, y: number): Range | null {
    return (document as Document & { caretRangeFromPoint?: (x: number, y: number) => Range | null }).caretRangeFromPoint?.(x, y) ?? null;
}

function onCaptionHover(ev: MouseEvent) {
    if (!settings.value.lookupEnabled) {
        hoverBox.value = null;
        return;
    }
    const range = getCaretRange(ev.clientX, ev.clientY);
    if (!range) {
        hoverBox.value = null;
        return;
    }
    const node = range.startContainer;
    if (node.nodeType !== 3) {
        hoverBox.value = null;
        return;
    }
    const parentEl = node.parentElement;
    // The clicked character already has a persistent highlight — don't stack another.
    if (parentEl?.closest('.rt-selected')) {
        hoverBox.value = null;
        return;
    }
    const rect = range.getBoundingClientRect();
    if (!rect.width || !rect.height) {
        hoverBox.value = null;
        return;
    }
    const playerRect = playerContainerRef.value?.getBoundingClientRect();
    if (!playerRect) return;
    hoverBox.value = {
        left: rect.left - playerRect.left,
        top: rect.top - playerRect.top,
        width: rect.width,
        height: rect.height,
    };
}

function onCaptionLeave() {
    hoverBox.value = null;
}

async function onCaptionClick(ev: MouseEvent) {
    if (!settings.value.lookupEnabled) return;
    clearHighlights();
    hoverBox.value = null;

    const range = getCaretRange(ev.clientX, ev.clientY);
    if (!range) return;

    const node = range.startContainer as CharacterData | null;
    if (!node || node.nodeType !== 3) return;
    const offset = range.startOffset;
    const text = node.textContent || '';
    if (offset >= text.length) return;

    const char = text[offset] ?? '';
    // Highlight the single character in place.
    const before = text.slice(0, offset);
    const after = text.slice(offset + 1);
    node.textContent = before;
    const mark = document.createElement('mark');
    mark.className = 'rt-selected';
    mark.textContent = char;
    node.after(mark);
    if (after) mark.after(document.createTextNode(after));

    lookupLoading.value = true;
    lookup.value = { char, type: '…' } as LookupResult;
    try {
        const response = await browser.runtime.sendMessage({
            type: 'LOOKUP_CHAR',
            char,
            line: rawText.value.trim(),
            romajiSystem: settings.value.romajiSystem,
        });
        if (response?.result) lookup.value = response.result as LookupResult;
    } catch (err) {
        console.error('Lookup failed:', err);
    } finally {
        lookupLoading.value = false;
    }
}

const closeLookup = () => {
    lookup.value = null;
    clearHighlights();
};
</script>

<template>
    <teleport :to="playerContainerRef" v-if="playerContainerRef">
        <PlayerOverlay
            v-if="line.length > 0"
            :position="settings.position"
            :lookup-enabled="settings.lookupEnabled"
            @caption-click="onCaptionClick"
            @caption-hover="onCaptionHover"
            @caption-leave="onCaptionLeave"
        >
            <span v-if="htmlMode" class="furigana-container" v-html="line"></span>
            <span v-else class="furigana-container">{{ line }}</span>
        </PlayerOverlay>
        <div
            v-if="hoverBox"
            class="rt-hover-box"
            :style="{
                left: hoverBox.left + 'px',
                top: hoverBox.top + 'px',
                width: hoverBox.width + 'px',
                height: hoverBox.height + 'px',
            }"
        ></div>
        <SettingsDrawer />
        <LookupModal
            v-if="lookup"
            :lookup="lookup"
            :loading="lookupLoading"
            :position="settings.position"
            @close="closeLookup"
        />
    </teleport>
</template>

<style scoped>
.rt-hover-box {
    position: absolute;
    pointer-events: none;
    background: rgba(62, 166, 255, 0.45);
    border-radius: 4px;
    z-index: 10;
}
</style>
