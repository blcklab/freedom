# Window Manager

The manager is optional. Use it when you have multiple windows and need focus/z-index management.

```ts
import { createManager } from '@blcklab/freedom/manager'

const manager = createManager({ baseZIndex: 100 })

const a = freedom.window(elementA)
const b = freedom.window(elementB)

manager.register(a)
manager.register(b)

manager.focus(a)
manager.bringToFront(b)

console.log(manager.getFocused())
console.log(manager.list())
```

## Focus on pointerdown

```ts
element.addEventListener('pointerdown', () => {
  manager.focus(win)
})
```

When a registered window is destroyed, the manager automatically unregisters it.
