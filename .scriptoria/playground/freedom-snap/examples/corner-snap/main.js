export function run({ module, inputs }) {
  const target = { id: 'workspace', x: 0, y: 0, width: 800, height: 500 }
  const size = { width: Number(inputs.width), height: Number(inputs.height) }
  const corner = String(inputs.corner)
  const offset = Number(inputs.offset)
  const points = {
    'top-left': { x: offset, y: offset },
    'top-right': { x: target.width - size.width - offset, y: offset },
    'bottom-left': { x: offset, y: target.height - size.height - offset },
    'bottom-right': { x: target.width - size.width - offset, y: target.height - size.height - offset },
  }
  const plugin = module.snapPlugin({
    threshold: Number(inputs.threshold),
    snapToViewport: false,
    getSnapTargets: () => [target],
  })
  const start = points[corner]
  const result = executeSnap(plugin, start, size)
  const edges = result.events.at(-1)?.edges ?? []

  return {
    html: `<p><strong>${escapeHtml(corner)} corner</strong></p><pre>Workspace 800 × 500
Window ${size.width} × ${size.height}
Input  (${start.x}, ${start.y})
Output (${result.position.x}, ${result.position.y})
Edges  ${edges.join(' + ') || 'none'}</pre>`,
    corner,
    input: start,
    output: result.position,
    edges,
    target,
    size,
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
