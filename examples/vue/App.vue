<template>
  <Panel title="Inspector" :initial-position="{ x: 60, y: 60 }" :manager="manager">
    Drag by the header, resize from any edge or corner.
  </Panel>

  <Panel title="Console" :initial-position="{ x: 460, y: 140 }" :manager="manager">
    Click a panel to bring it to the front.
  </Panel>
</template>

<script setup lang="ts">
import { createManager } from '@blcklab/freedom/manager';
import Panel from './Panel.vue';

const manager = createManager();
</script>
