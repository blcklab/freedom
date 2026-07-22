<template>
  <div ref="elementRef" class="panel" :style="{ width: '320px', height: '200px' }">
    <div class="panel-header">{{ title }}</div>
    <div class="panel-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { freedom, type FreedomWindow } from '@blcklab/freedom';
import type { FreedomManager } from '@blcklab/freedom/manager';
import { snapPlugin } from '@blcklab/freedom/plugins/snap';

const props = defineProps<{
  title: string;
  initialPosition: { x: number; y: number };
  manager: FreedomManager;
}>();

const elementRef = ref<HTMLElement | null>(null);
let win: FreedomWindow | null = null;
let focusOnPointerDown: (() => void) | null = null;

onMounted(() => {
  const element = elementRef.value;
  if (!element) return;

  win = freedom.window(element, {
    initialPosition: props.initialPosition,
    minWidth: 240,
    minHeight: 160,
    dragHandle: '.panel-header',
    bounds: 'viewport',
    plugins: [snapPlugin({ threshold: 12 })],
  });

  props.manager.register(win);

  focusOnPointerDown = () => {
    if (win) props.manager.focus(win);
  };

  element.addEventListener('pointerdown', focusOnPointerDown);
});

onBeforeUnmount(() => {
  const element = elementRef.value;
  if (element && focusOnPointerDown) {
    element.removeEventListener('pointerdown', focusOnPointerDown);
  }
  win?.destroy();
  win = null;
});
</script>
