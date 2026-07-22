# Vue Usage

Use a template ref and create the window in `onMounted()`.

```vue
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { freedom, type FreedomWindow } from '@blcklab/freedom'
import { snapPlugin } from '@blcklab/freedom/plugins/snap'

const panel = ref<HTMLElement | null>(null)
const win = shallowRef<FreedomWindow | null>(null)

onMounted(() => {
  if (!panel.value) return

  win.value = freedom.window(panel.value, {
    initialPosition: 'center',
    initialSize: { width: 420, height: 260 },
    dragHandle: '.panel-header',
    bounds: 'viewport',
    plugins: [snapPlugin({ threshold: 16 })]
  })
})

onBeforeUnmount(() => {
  win.value?.destroy()
  win.value = null
})
</script>

<template>
  <div ref="panel" class="panel">
    <div class="panel-header">freeDOM Panel</div>
    <div class="panel-body">Drag me from the header.</div>
  </div>
</template>

<style scoped>
.panel {
  position: fixed;
  visibility: hidden;
  overflow: hidden;
  border-radius: 16px;
  background: #0f172a;
  color: white;
}

.panel-header {
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: #334155;
  cursor: move;
  user-select: none;
}

.panel-body {
  padding: 20px;
}
</style>
```

## Reactive position and size

`getPosition()` and `getSize()` are methods, not Vue reactive values. Store them in Vue refs if you want to display them.

```ts
const position = ref({ x: 0, y: 0 })
const size = ref({ width: 0, height: 0 })

function sync() {
  if (!win.value) return
  position.value = win.value.getPosition()
  size.value = win.value.getSize()
}

win.value = freedom.window(panel.value, {
  onDrag: sync,
  onResize: sync
})
```
