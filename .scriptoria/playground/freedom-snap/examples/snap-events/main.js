export function run({ module }) {
  const target = { id: 'workspace', x: 100, y: 100, width: 500, height: 300 }
  const size = { width: 180, height: 120 }
  const callbacks = []
  const emitted = []
  const plugin = module.snapPlugin({
    threshold: 16,
    snapToViewport: false,
    getSnapTargets: () => [target],
    onSnap(data) { callbacks.push({ event: 'onSnap', target: data.target.id, edges: data.edges.join(', ') }) },
    onUnsnap(data) { callbacks.push({ event: 'onUnsnap', target: data.target.id, edges: data.edges.join(', ') }) },
  })
  const context = {
    window: { getSize: () => ({ ...size }) },
    element: null,
    emit(event, data) { emitted.push({ event, target: data.target?.id ?? '', edges: data.edges?.join(', ') ?? '' }) },
  }

  plugin.onDrag?.({ position: { x: 107, y: 180 }, delta: { x: 0, y: 0 }, pointerEvent: {} }, context)
  plugin.onDrag?.({ position: { x: 180, y: 180 }, delta: { x: 73, y: 0 }, pointerEvent: {} }, context)

  return [
    ...callbacks.map((item) => ({ source: 'callback', ...item })),
    ...emitted.map((item) => ({ source: 'window event', ...item })),
  ]
}
