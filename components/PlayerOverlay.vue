<script setup lang="ts">
defineSlots<{
    default(): any
}>();
</script>

<template>
    <div class="cool-captions">
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
</style>