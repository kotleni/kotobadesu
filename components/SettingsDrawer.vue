<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watchEffect } from 'vue';
import { useSettings } from '@/composables/useSettings';

const { settings } = useSettings();
const isOpen = ref(false);

const usesRomajiSystem = computed(() => settings.value.to === 'romaji');
const usesDelimiters = computed(
  () => settings.value.mode === 'okurigana' || settings.value.mode === 'furigana',
);

const toggle = () => {
  isOpen.value = !isOpen.value;
};

const close = () => {
  isOpen.value = false;
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') close();
};

watchEffect((onCleanup) => {
  if (!isOpen.value) return;
  window.addEventListener('keydown', onKeydown);
  onCleanup(() => window.removeEventListener('keydown', onKeydown));
});

onBeforeUnmount(close);
</script>

<template>
  <div class="rt-settings" :class="{ open: isOpen }">
    <!-- Sticky toggle: pinned to the top-right corner of the player. -->
    <button
      type="button"
      class="rt-settings-toggle"
      :aria-expanded="isOpen"
      :aria-label="isOpen ? 'Close romaji settings' : 'Open romaji settings'"
      @click="toggle"
    >
      <span class="rt-settings-toggle-icon" aria-hidden="true">
        <svg v-if="!isOpen" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </span>
      <span class="rt-settings-toggle-label">Settings</span>
    </button>

    <!-- Slide-in panel from the right side. -->
    <div
      class="rt-settings-panel"
      :class="{ open: isOpen }"
      role="dialog"
      aria-label="Romaji settings"
      :aria-hidden="!isOpen"
    >
      <div class="rt-settings-header">
        <span class="rt-settings-title">Romaji Settings</span>
        <button
          type="button"
          class="rt-settings-close"
          aria-label="Close settings"
          @click="close"
        >
          &times;
        </button>
      </div>

      <div class="rt-setting">
        <span class="rt-setting-label">To</span>
        <div class="rt-segmented">
          <button
            type="button"
            class="rt-segmented-btn"
            :class="{ active: settings.to === 'hiragana' }"
            @click="settings.to = 'hiragana'"
          >
            Hiragana
          </button>
          <button
            type="button"
            class="rt-segmented-btn"
            :class="{ active: settings.to === 'katakana' }"
            @click="settings.to = 'katakana'"
          >
            Katakana
          </button>
          <button
            type="button"
            class="rt-segmented-btn"
            :class="{ active: settings.to === 'romaji' }"
            @click="settings.to = 'romaji'"
          >
            Romaji
          </button>
        </div>
      </div>

      <div class="rt-setting">
        <span class="rt-setting-label">Mode</span>
        <div class="rt-segmented">
          <button
            type="button"
            class="rt-segmented-btn"
            :class="{ active: settings.mode === 'normal' }"
            @click="settings.mode = 'normal'"
          >
            Normal
          </button>
          <button
            type="button"
            class="rt-segmented-btn"
            :class="{ active: settings.mode === 'spaced' }"
            @click="settings.mode = 'spaced'"
          >
            Spaced
          </button>
          <button
            type="button"
            class="rt-segmented-btn"
            :class="{ active: settings.mode === 'okurigana' }"
            @click="settings.mode = 'okurigana'"
          >
            Okurigana
          </button>
          <button
            type="button"
            class="rt-segmented-btn"
            :class="{ active: settings.mode === 'furigana' }"
            @click="settings.mode = 'furigana'"
          >
            Furigana
          </button>
        </div>
      </div>

      <div class="rt-setting" :class="{ disabled: !usesRomajiSystem }">
        <span class="rt-setting-label">Romaji system</span>
        <div class="rt-segmented">
          <button
            type="button"
            class="rt-segmented-btn"
            :class="{ active: settings.romajiSystem === 'hepburn' }"
            :disabled="!usesRomajiSystem"
            @click="settings.romajiSystem = 'hepburn'"
          >
            Hepburn
          </button>
          <button
            type="button"
            class="rt-segmented-btn"
            :class="{ active: settings.romajiSystem === 'nippon' }"
            :disabled="!usesRomajiSystem"
            @click="settings.romajiSystem = 'nippon'"
          >
            Nippon
          </button>
          <button
            type="button"
            class="rt-segmented-btn"
            :class="{ active: settings.romajiSystem === 'passport' }"
            :disabled="!usesRomajiSystem"
            @click="settings.romajiSystem = 'passport'"
          >
            Passport
          </button>
        </div>
      </div>

      <div class="rt-setting" :class="{ disabled: !usesDelimiters }">
        <span class="rt-setting-label">Delimiters</span>
        <div class="rt-delims">
          <input
            v-model="settings.delimiterStart"
            type="text"
            :disabled="!usesDelimiters"
            maxlength="10"
            aria-label="Delimiter start"
            placeholder="("
          />
          <input
            v-model="settings.delimiterEnd"
            type="text"
            :disabled="!usesDelimiters"
            maxlength="10"
            aria-label="Delimiter end"
            placeholder=")"
          />
        </div>
      </div>

      <div class="rt-setting">
        <span class="rt-setting-label">Position</span>
        <div class="rt-segmented">
          <button
            type="button"
            class="rt-segmented-btn"
            :class="{ active: settings.position === 'top' }"
            @click="settings.position = 'top'"
          >
            Top
          </button>
          <button
            type="button"
            class="rt-segmented-btn"
            :class="{ active: settings.position === 'bottom' }"
            @click="settings.position = 'bottom'"
          >
            Bottom
          </button>
        </div>
      </div>

      <div class="rt-setting">
        <span class="rt-setting-label">Lookup</span>
        <div class="rt-segmented">
          <button
            type="button"
            class="rt-segmented-btn"
            :class="{ active: settings.lookupEnabled === true }"
            @click="settings.lookupEnabled = true"
          >
            On
          </button>
          <button
            type="button"
            class="rt-segmented-btn"
            :class="{ active: settings.lookupEnabled === false }"
            @click="settings.lookupEnabled = false"
          >
            Off
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rt-settings {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
  font-family: inherit;
}

/* Sticky toggle button pinned to the top-right corner. */
.rt-settings-toggle {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px 6px 8px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.85);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  backdrop-filter: blur(6px);
  transition: background 0.15s ease, transform 0.15s ease;
}

.rt-settings-toggle:hover {
  background: rgba(60, 60, 60, 0.92);
}

.rt-settings-toggle:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.rt-settings-toggle-icon {
  display: inline-flex;
}

.rt-settings-toggle-label {
  letter-spacing: 0.02em;
}

/* Slide-in panel anchored to the right edge. */
.rt-settings-panel {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
  height: 100%;
  width: min(360px, 90vw);
  max-width: calc(100vw - 16px);
  min-width: 320px;
  box-sizing: border-box;
  padding: 20px;
  padding-top: 60px;
  background: rgba(17, 17, 17, 0.94);
  color: #fff;
  border-left: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.45);
  transform: translateX(110%);
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  pointer-events: auto;
  overflow-y: auto;
  backdrop-filter: blur(8px);
  visibility: hidden;
}

.rt-settings-panel.open {
  transform: translateX(0);
  visibility: visible;
}

.rt-settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.rt-settings-title {
  font-size: 16px;
  font-weight: 700;
}

.rt-settings-close {
  border: none;
  background: transparent;
  color: #fff;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 6px;
}

.rt-settings-close:hover {
  background: rgba(255, 255, 255, 0.12);
}

.rt-setting {
  display: block;
  padding: 16px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.rt-setting-label {
  display: block;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
}

.rt-segmented {
  display: flex;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  overflow: hidden;
}

.rt-segmented-btn {
  flex: 1;
  padding: 10px 4px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.rt-segmented-btn.active {
  background: #3ea6ff;
}

.rt-segmented-btn:not(.active):not(:disabled):hover {
  background: rgba(255, 255, 255, 0.16);
}

.rt-segmented-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.rt-delims {
  display: flex;
  gap: 10px;
  width: 100%;
}

.rt-delims input {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 14px;
  text-align: center;
  outline: none;
}

.rt-delims input:focus {
  border-color: #3ea6ff;
}

.rt-delims input:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.rt-setting.disabled {
  opacity: 0.55;
}
</style>
