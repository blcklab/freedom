<!--
  Vue 3, Composition API. Same pattern as React: bind freedom.window() to
  the element's mounted/unmounted lifecycle via a template ref.
-->
<template>
  <div ref="elementRef" class="panel" :style="{ width: '320px', height: '200px' }">
    <div class="panel-header">{{ title }}</div>
    <div class="panel-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { freedom, type FreedomManager } from 'freedom';

const props = defineProps<{
  title: string;
  initialPosition: { x: number; y: number };
  manager: FreedomManager;
}>();

const elementRef = ref<HTMLElement | null>(null);
let focusOnPointerDown: (() => void) | null = null;

onMounted(() => {
  const element = elementRef.value;
  if (!element) return;

  const win = freedom.window(element, {
    initialPosition: props.initialPosition,
    minWidth: 240,
    minHeight: 160,
    dragHandle: '.panel-header',
    bounds: 'viewport',
    plugins: [freedom.plugins.snap({ threshold: 12 })],
  });

  props.manager.register(win);

  focusOnPointerDown = () => props.manager.focus(win);
  element.addEventListener('pointerdown', focusOnPointerDown);

  onBeforeUnmount(() => {
    if (focusOnPointerDown) element.removeEventListener('pointerdown', focusOnPointerDown);
    win.destroy();
  });
});
</script>
