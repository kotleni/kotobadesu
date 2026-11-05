<script setup lang="ts">
const slop = defineSlots<{
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
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;

    display: flex;
    align-items: center;
    justify-content: center;
}
.captions-text {
    padding: 4px;
    background-color: #212121;

    color: white;
    font-size: 2em;
}
</style>