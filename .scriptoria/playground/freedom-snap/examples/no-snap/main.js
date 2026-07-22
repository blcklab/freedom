export function run({ module, inputs }) {
  const target = { id: 'workspace', x: 100, y: 100, width: 500, height: 300 }
  const size = { width: 180, height: 120 }
  const input = { x: Number(inputs.x), y: Number(inputs.y) }
  const plugin = module.snapPlugin({
    threshold: Number(inputs.threshold),
    snapToViewport: false,
    getSnapTargets: () => [target],
  })
  const result = executeSnap(plugin, input, size)

  return {
    input,
    output: result.position,
    changed: input.x !== result.position.x || input.y !== result.position.y,
    events: result.events,
    target,
    threshold: Number(inputs.threshold),
  }
}


function executeSnap(plugin, position, size) {
  const events = []
  const context = {
    window: { getSize: () => ({ ...size }) },
    element: null,
    emit(event, data) {
      events.push({
        event,
        target: data.target?.id ?? null,
        edges: data.edges ? [...data.edges] : [],
        position: data.position ? { ...data.position } : null,
      })
    },
  }
  const data = {
    position: { ...position },
    delta: { x: 0, y: 0 },
    pointerEvent: {},
  }
  const result = plugin.onDrag?.(data, context) ?? position
  return { position: result, events, context }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])
}
