export function run({ module, inputs }) {
  const target = {
    id: String(inputs['target-id']),
    x: Number(inputs['target-x']),
    y: Number(inputs['target-y']),
    width: Number(inputs['target-width']),
    height: Number(inputs['target-height']),
  }
  const size = { width: 180, height: 120 }
  const start = { x: Number(inputs.x), y: Number(inputs.y) }
  const plugin = module.snapPlugin({
    threshold: Number(inputs.threshold),
    snapToViewport: false,
    getSnapTargets: () => [target],
  })
  const result = executeSnap(plugin, start, size)

  return {
    html: `<p><strong>Custom snap target</strong></p><table><tbody><tr><th>Target</th><td>${escapeHtml(target.id)}</td></tr><tr><th>Input</th><td>${start.x}, ${start.y}</td></tr><tr><th>Output</th><td>${result.position.x}, ${result.position.y}</td></tr><tr><th>Matched edges</th><td>${result.events.at(-1)?.edges.join(', ') || 'none'}</td></tr></tbody></table>`,
    target,
    input: start,
    output: result.position,
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
