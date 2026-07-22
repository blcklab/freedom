# freeDOM Window Playground

This plugin loads `@blcklab/freedom@0.2.1/dist/index.js`.

Scriptoria executes module runners in a disposable Web Worker, so the package can be imported and inspected but `freedom.window()` cannot receive a real `HTMLElement`. The examples therefore provide truthful configuration, lifecycle, and state previews plus the real browser-environment guard.

Actual dragging, resizing, docking, persistence, and DOM events must run in a browser page.
