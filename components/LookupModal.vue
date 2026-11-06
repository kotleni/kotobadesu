<script setup lang="ts">
import { computed } from 'vue';
import type { CaptionPosition } from '@/composables/useSettings';

export interface LookupResult {
  char: string;
  type: string;
  hiragana?: string;
  katakana?: string;
  romaji?: string;
  meanings?: string[];
  on?: string[];
  kun?: string[];
  token?: {
    surface: string;
    reading?: string;
    pronunciation?: string;
    pos?: string;
  } | null;
}

const props = defineProps<{
  lookup: LookupResult | null;
  loading: boolean;
  position?: CaptionPosition;
  fontSize?: number;
  bgOpacity?: number;
}>();

const emit = defineEmits<{ (e: 'close'): void }>();

const meaning = computed(() => props.lookup?.meanings?.join(', ') ?? '');
const readings = computed(() => {
  const parts = [props.lookup?.hiragana, props.lookup?.katakana, props.lookup?.romaji];
  const unique: string[] = [];
  for (const p of parts) {
    if (p && !unique.includes(p)) unique.push(p);
  }
  return unique.join(' · ');
});
const word = computed(() => {
  const t = props.lookup?.token;
  if (!t) return '';
  const bits = [t.surface];
  if (t.reading && t.reading !== t.surface) bits.push(t.reading);
  if (t.pronunciation && t.pronunciation !== t.reading) bits.push(`(${t.pronunciation})`);
  if (t.pos) bits.push(t.pos);
  return bits.join(' · ');
});

// Offset tracks the caption height so a larger font doesn't overlap.
const overlayStyle = computed(() => {
  const fs = props.fontSize ?? 32;
  const offset = Math.round(fs * 2 + 86);
  return props.position === 'top'
    ? { paddingTop: offset + 'px' }
    : { paddingBottom: offset + 'px' };
});

const cardStyle = computed(() => ({
  backgroundColor: `rgba(33,33,33,${props.bgOpacity ?? 0.85})`,
}));
</script>

<template>
  <div
    class="rt-lookup-overlay"
    :class="{ 'is-top': position === 'top', 'is-bottom': position !== 'top' }"
    :style="overlayStyle"
    role="status"
    aria-label="Character lookup"
  >
    <div class="rt-lookup-card" :style="cardStyle">
      <button type="button" class="rt-lookup-close" aria-label="Close lookup" @click="emit('close')">
        ×
      </button>

      <div v-if="loading" class="rt-lookup-line">…</div>

      <template v-else-if="lookup">
        <div class="rt-lookup-line rt-lookup-main">
          <span class="rt-lookup-char">{{ lookup.char }}</span>
          <span v-if="meaning" class="rt-lookup-meaning">{{ meaning }}</span>
          <span v-else class="rt-lookup-meaning">{{ lookup.type }}</span>
        </div>
        <div v-if="readings" class="rt-lookup-line rt-lookup-sub">{{ readings }}</div>
        <div v-if="word" class="rt-lookup-line rt-lookup-sub">{{ word }}</div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.rt-lookup-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  pointer-events: none;
  z-index: 1000;
  font-family: inherit;
  box-sizing: border-box;
  padding-left: 24px;
  padding-right: 24px;
}

.rt-lookup-overlay.is-bottom {
  align-items: flex-end;
}

.rt-lookup-overlay.is-top {
  align-items: flex-start;
}

.rt-lookup-card {
  pointer-events: auto;
  position: relative;
  max-width: 90%;
  box-sizing: border-box;
  padding: 6px 28px 6px 12px;
  border-radius: 4px;
  color: #fff;
  text-align: center;
  line-height: 1.4;
}

.rt-lookup-close {
  position: absolute;
  top: 4px;
  right: 6px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
}

.rt-lookup-close:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.rt-lookup-line {
  font-size: 14px;
}

.rt-lookup-main {
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rt-lookup-char {
  font-weight: 600;
  margin-right: 8px;
}

.rt-lookup-meaning {
  color: rgba(255, 255, 255, 0.92);
}

.rt-lookup-sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  word-break: break-word;
}
</style>
