<script setup lang="ts">
import type { CaptionPosition } from '@/composables/useSettings';

withDefaults(
  defineProps<{
    position?: CaptionPosition;
    fontSize?: number;
    bgOpacity?: number;
  }>(),
  { position: 'bottom', fontSize: 32, bgOpacity: 0.85 },
);

const emit = defineEmits<{
  (e: 'caption-click', ev: MouseEvent): void;
  (e: 'caption-hover', ev: MouseEvent): void;
  (e: 'caption-leave'): void;
}>();

const onClick = (ev: MouseEvent) => {
  emit('caption-click', ev);
};

const onHover = (ev: MouseEvent) => {
  emit('caption-hover', ev);
};

const onLeave = () => {
  emit('caption-leave');
};

defineSlots<{
    default(): any
}>();
</script>

<template>
    <div
        class="cool-captions"
        :class="{ 'is-top': position === 'top', 'is-bottom': position === 'bottom', 'is-interactive': true }"
        @click="onClick"
        @mousemove="onHover"
        @mouseleave="onLeave"
    >
        <div
            class="captions-text"
            :style="{ fontSize: fontSize + 'px', backgroundColor: `rgba(33,33,33,${bgOpacity})` }"
        >
            <slot></slot>
        </div>
    </div>
</template>

<style scoped>
.cool-captions {
    pointer-events: none;
    position: absolute;
    inset: 0;

    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 32px;

    padding-left: 24px;
    padding-right: 24px;
    box-sizing: border-box;
}

.cool-captions.is-top {
    align-items: flex-start;
    padding-bottom: 0;
    padding-top: 56px;
}

.cool-captions.is-bottom {
    align-items: flex-end;
    padding-bottom: 32px;
    padding-top: 0;
}

.captions-text {
    padding: 6px 12px;
    border-radius: 4px;

    color: white;
    text-align: center;

    word-break: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
}

.cool-captions.is-interactive .captions-text {
    pointer-events: auto;
    cursor: pointer;
    user-select: none;
}

.captions-text ruby {
    ruby-position: over;
}

.captions-text rt {
    font-size: 0.5em;
    color: rgba(255, 255, 255, 0.85);
}

.captions-text :deep(.rt-char) {
    border-radius: 2px;
}

.captions-text :deep(.rt-char.rt-hover) {
    background: rgba(62, 166, 255, 0.30);
    box-shadow: 0 0 0 2px rgba(62, 166, 255, 0.12);
}

.captions-text :deep(.rt-char.rt-selected) {
    background: rgba(62, 166, 255, 0.85);
    box-shadow: 0 0 0 2px rgba(62, 166, 255, 0.30);
}
</style>
