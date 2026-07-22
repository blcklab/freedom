# API Reference

## `freedom.window(element, options?)`

Creates a draggable/resizable window instance.

```ts
const win = freedom.window(element, options)
```

`element` must be an `HTMLElement`.

## Options

```ts
interface FreedomWindowOptions {
  id?: string

  initialPosition?: { x: number; y: number } | 'center'
  initialSize?: { width: number; height: number }
  positioning?: 'absolute' | 'fixed' | 'relative'
  autoReveal?: boolean

  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number

  draggable?: boolean
  resizable?: boolean | ResizeHandle[]
  dragHandle?: string | HTMLElement | null

  bounds?: BoundsOption
  dropZones?: DropZone[]
  persist?: boolean | PersistOptions

  zIndex?: number
  plugins?: FreedomPlugin[]

  onDragStart?(data: DragEventData): void
  onDrag?(data: DragEventData): void
  onDragEnd?(data: DragEventData): void
  onResizeStart?(data: ResizeEventData): void
  onResize?(data: ResizeEventData): void
  onResizeEnd?(data: ResizeEventData): void
  onSnap?(data: SnapEventData): void
  onUnsnap?(data: SnapEventData): void
  onDock?(data: DockEventData): void
  onUndock?(data: DockEventData): void
  onMinimize?(state: PersistedWindowState): void
  onMaximize?(state: PersistedWindowState): void
  onRestore?(state: PersistedWindowState): void
  onFocus?(): void
  onBlur?(): void
}
```

## Instance methods

```ts
win.getPosition()
win.getSize()
win.setPosition({ x, y })
win.setSize({ width, height })

win.getBounds()
win.setBounds(bounds)

win.dock(zone)
win.undock(position)
win.isDocked()
win.getDockedZone()

win.minimize(options)
win.maximize(options)
win.restore()
win.isMinimized()
win.isMaximized()

win.saveState()
win.restoreState()
win.clearState()

win.focus()
win.blur()
win.isFocused()

win.setZIndex(zIndex)
win.getZIndex()

win.enableDrag()
win.disableDrag()
win.enableResize(handles)
win.disableResize()

win.on(event, handler)
win.destroy()
```

## Resize handles

```ts
type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se'
```

## Events

```ts
win.on('drag', data => {})
win.on('dragend', data => {})
win.on('resize', data => {})
win.on('resizeend', data => {})
win.on('snap', data => {})
win.on('unsnap', data => {})
win.on('dock', data => {})
win.on('undock', data => {})
win.on('minimize', state => {})
win.on('maximize', state => {})
win.on('restore', state => {})
win.on('destroy', () => {})
```
