# Installation

```bash
npm install @blcklab/freedom
```

freeDOM has zero runtime dependencies. It ships ESM, CommonJS, and TypeScript declarations.

## Public imports

Root import:

```ts
import { freedom, createWindow } from '@blcklab/freedom'
```

Tree-shakable subpath imports:

```ts
import { createWindow } from '@blcklab/freedom/window'
import { createManager } from '@blcklab/freedom/manager'
import { snapPlugin } from '@blcklab/freedom/plugins/snap'
```

`@blcklab/freedom/snap` is also available as a short alias:

```ts
import { snapPlugin } from '@blcklab/freedom/snap'
```

## SSR

Importing freeDOM is SSR-safe.

Creating a window must run in the browser:

```ts
onMounted(() => {
  freedom.window(element)
})
```

Do not call `freedom.window()` during server render.
