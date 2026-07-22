# Snap Plugin Playground

This plugin loads `@blcklab/freedom@0.2.1/dist/snap.js` and runs the real `snapPlugin()` implementation with deterministic custom targets. Viewport access is intentionally disabled in the Worker; custom rectangles make every result reproducible.
