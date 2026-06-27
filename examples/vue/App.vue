<template>
  <Panel title="Inspector" :initial-position="{ x: 60, y: 60 }" :manager="manager">
    Drag by the header, resize from any corner.
  </Panel>
  <Panel title="Console" :initial-position="{ x: 460, y: 140 }" :manager="manager">
    Click a panel to bring it to the front.
  </Panel>
</template>

<script setup lang="ts">
import { freedom } from 'freedom';
import Panel from './Panel.vue';

// One manager shared by every window in the app.
const manager = freedom.manager();
</script>
