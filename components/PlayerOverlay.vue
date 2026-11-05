<script setup lang="ts">
import type { CaptionPosition } from '@/composables/useSettings';

withDefaults(
  defineProps<{
    position?: CaptionPosition;
  }>(),
  { position: 'bottom' },
);

defineSlots<{
    default(): any
}>();
</script>

<template>
    <div class="cool-captions" :class="{ 'is-top': position === 'top', 'is-bottom': position === 'bottom' }">
        <div class="captions-text">
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
    background-color: rgba(33, 33, 33, 0.85);
    border-radius: 4px;

    color: white;
    font-size: 2em;
    text-align: center;

    word-break: break-word;
    overflow-wrap: break-word;
    max-width: 100%;
}

.captions-text ruby {
    ruby-position: over;
}

.captions-text rt {
    font-size: 0.5em;
    color: rgba(255, 255, 255, 0.85);
}
</style>