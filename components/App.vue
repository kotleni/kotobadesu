<script setup lang="ts">
import {useIntervalFn, useMutationObserver} from '@vueuse/core';
import PlayerOverlay from "@/components/PlayerOverlay.vue";
import SettingsDrawer from "@/components/SettingsDrawer.vue";
import LookupModal, { type LookupResult } from "@/components/LookupModal.vue";
import { browser } from 'wxt/browser';
import { getConvertOptions, isHtmlOutput, useSettings } from '@/composables/useSettings';
import { computed, nextTick, watch } from 'vue';

const { settings, isLoaded } = useSettings();

const useQuerySelector = (selector: string) => {
    const elementRef = ref<HTMLElement | null>();
    const {pause, resume, isActive} = useIntervalFn(() => {
        const el = document.querySelector<HTMLElement>(selector);
        if (!elementRef.value && el) {
            console.log("useQuerySelector got", selector, elementRef.value);
            elementRef.value = el;
        }
        if (elementRef.value && !el) {
            console.log("useQuerySelector now missing", selector, elementRef.value);
            elementRef.value = undefined;
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

// Only conversion-relevant settings need a re-convert; position/font/bg don't.
watch(
    () => JSON.stringify(getConvertOptions(settings.value)),
    () => {
        if (isLoaded.value) void convertText(rawText.value.trim());
    },
);

function clearSelection() {
    document.querySelectorAll('.rt-char.rt-selected').forEach((el) => el.classList.remove('rt-selected'));
}

function clearHover() {
    document.querySelectorAll('.rt-char.rt-hover').forEach((el) => el.classList.remove('rt-hover'));
}

function wrapCaptionChars() {
    const container = playerContainerRef.value?.querySelector('.furigana-container') as HTMLElement | null;
    if (!container) return;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            if (node.parentElement?.closest('rt, rp, .rt-char')) return NodeFilter.FILTER_REJECT;
            if (!node.textContent) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        },
    });
    const textNodes: Text[] = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
    for (const tn of textNodes) {
        const text = tn.textContent || '';
        if (!text) continue;
        const frag = document.createDocumentFragment();
        for (const ch of text) {
            const span = document.createElement('span');
            span.className = ch === ' ' ? 'rt-char rt-char-space' : 'rt-char';
            span.dataset.char = ch;
            span.textContent = ch === ' ' ? '\u00A0' : ch;
            frag.appendChild(span);
        }
        tn.parentNode?.replaceChild(frag, tn);
    }
}

watch(line, async () => {
    clearHover();
    await nextTick();
    wrapCaptionChars();
});

function getCharSpan(ev: MouseEvent): HTMLElement | null {
    if (!(ev.target instanceof HTMLElement)) return null;
    return ev.target.closest('.rt-char') as HTMLElement | null;
}

function onCaptionHover(ev: MouseEvent) {
    const span = getCharSpan(ev);
    clearHover();
    if (!span || span.classList.contains('rt-selected') || span.classList.contains('rt-char-space')) return;
    span.classList.add('rt-hover');
}

function onCaptionLeave() {
    clearHover();
}

async function onCaptionClick(ev: MouseEvent) {
    const span = getCharSpan(ev);
    if (!span || span.classList.contains('rt-char-space')) return;

    clearSelection();
    span.classList.add('rt-selected');

    const char = span.dataset.char ?? span.textContent ?? '';
    if (!char) return;

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
    clearSelection();
};
</script>

<template>
    <teleport :to="playerContainerRef" v-if="playerContainerRef">
        <PlayerOverlay
            v-if="line.length > 0"
            :position="settings.position"
            :font-size="settings.fontSize"
            :bg-opacity="settings.bgOpacity"
            @caption-click="onCaptionClick"
            @caption-hover="onCaptionHover"
            @caption-leave="onCaptionLeave"
        >
            <span v-if="htmlMode" class="furigana-container" v-html="line"></span>
            <span v-else class="furigana-container">{{ line }}</span>
        </PlayerOverlay>
        <SettingsDrawer />
        <LookupModal
            v-if="lookup"
            :lookup="lookup"
            :loading="lookupLoading"
            :position="settings.position"
            :font-size="settings.fontSize"
            :bg-opacity="settings.bgOpacity"
            @close="closeLookup"
        />
    </teleport>
</template>
