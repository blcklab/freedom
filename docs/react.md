# React Usage

freeDOM does not need a React adapter. Use `useRef()` and `useEffect()`.

```tsx
import { useEffect, useRef } from 'react'
import { freedom, type FreedomWindowOptions } from '@blcklab/freedom'

function useFreedomWindow(options: FreedomWindowOptions) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const win = freedom.window(ref.current, options)

    return () => {
      win.destroy()
    }
  }, [])

  return ref
}

export function Panel() {
  const ref = useFreedomWindow({
    initialPosition: 'center',
    initialSize: { width: 420, height: 260 },
    dragHandle: '.panel-header',
    bounds: 'viewport'
  })

  return (
    <div ref={ref} className="panel">
      <div className="panel-header">Panel</div>
      <div className="panel-body">Drag me.</div>
    </div>
  )
}
```
