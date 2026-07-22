export function run({ module, inputs }) {
  const threshold = Number(inputs.threshold)
  const size = { width: Number(inputs.width), height: Number(inputs.height) }
  const start = { x: Number(inputs.x), y: Number(inputs.y) }
  const target = { id: 'workspace', x: 100, y: 80, width: 600, height: 400 }
  const plugin = module.snapPlugin({
    threshold,
    snapToViewport: false,
    getSnapTargets: () => [target],
  })
  const result = executeSnap(plugin, start, size)
  const event = result.events.at(-1)

  return {
    html: `<p><strong>${event ? 'Snap detected' : 'No snap'}</strong></p><table><tbody><tr><th>Input position</th><td>${start.x}, ${start.y}</td></tr><tr><th>Output position</th><td>${result.position.x}, ${result.position.y}</td></tr><tr><th>Threshold</th><td>${threshold} px</td></tr><tr><th>Edges</th><td>${event?.edges.join(', ') || 'none'}</td></tr></tbody></table><pre>Target: x=100 y=80 width=600 height=400
Window: width=${size.width} height=${size.height}</pre>`,
    input: start,
    output: result.position,
    target,
    threshold,
    events: result.events,
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
