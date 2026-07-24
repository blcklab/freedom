# Interactive Playground

freeDOM uses Scriptoria's first-party `dom` adapter because its core APIs require real browser elements, pointer events, layout geometry, and animation frames.

The Playground provides editable **HTML**, **CSS**, and **JavaScript** beside a real interactive preview. Each run creates a fresh sandboxed iframe, loads the exact pinned npm asset, and calls the example's `run({ module, inputs })` function.

## Example groups

### freeDOM Window

Real browser examples covering:

- Basic dragging
- Eight-direction resizing
- Custom drag handles
- Element bounds
- Centered first render
- Selective resize handles
- Programmatic instance methods
- Lifecycle events
- Minimize, maximize, and restore
- Drop zones and docking
- Custom persistence storage
- Multiple independent windows

### Window Manager

The manager subpath is exercised through DOM-backed managed window objects:

- Focus and z-index stacking
- Dynamic registration
- Manager events

### Snap Plugin

The snap subpath powers real pointer-driven cards:

- Workspace edge snapping
- Custom DOM snap targets
- Snap and unsnap callbacks

## DOM runner contract

A saved DOM example contains:

```text
index.html       required
main.js          required
style.css        optional
controls.json    optional
example.json     optional
```

`main.js` exports a runner:

```js
export function run({ module, inputs }) {
  const target = document.querySelector('#window')
  const instance = module.freedom.window(target)

  return () => instance.destroy()
}
```

The optional cleanup function is called before rerun, reset, navigation, and iframe disposal. Scriptoria also recreates the iframe so event listeners, timers, DOM mutations, and package instances cannot leak between runs.

## Security boundary

DOM examples run only inside a sandboxed iframe with scripts enabled but without same-origin, popup, form, top-navigation, or download permissions. They cannot access Scriptoria's parent document or storage. The adapter is intended for browser interaction libraries; pure calculations should continue using the stricter Worker-based `module` adapter.

## Version pinning

All examples load the exact package version:

```text
@blcklab/freedom@0.2.1
```

Update the manifest asset version whenever the examples depend on a newer published API.
