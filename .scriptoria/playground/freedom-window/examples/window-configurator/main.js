export function run({ module, inputs }) {
  const width = Number(inputs.width)
  const height = Number(inputs.height)
  const options = {
    initialPosition: inputs['initial-position'],
    initialSize: { width, height },
    dragHandle: '.panel-header',
    bounds: inputs.bounds,
    resizable: Boolean(inputs.resizable),
    draggable: Boolean(inputs.draggable),
  }

  const status = typeof module.freedom?.window === 'function' ? 'Factory available' : 'Factory missing'
  const handles = options.resizable ? 'edges + corners' : 'disabled'
  const drag = options.draggable ? '.panel-header' : 'disabled'

  return {
    html: `<p><strong>Window configuration</strong></p><table><tbody><tr><th>Initial position</th><td>${escapeHtml(String(options.initialPosition))}</td></tr><tr><th>Initial size</th><td>${width} × ${height}</td></tr><tr><th>Bounds</th><td>${escapeHtml(String(options.bounds))}</td></tr><tr><th>Drag handle</th><td><code>${drag}</code></td></tr><tr><th>Resize handles</th><td>${handles}</td></tr><tr><th>Package</th><td>${status}</td></tr></tbody></table><pre>${escapeHtml(createSnippet(options))}</pre>`,
    options,
    note: 'Copy the generated options into browser code and pass a real HTMLElement to freedom.window().',
  }
}

function createSnippet(options) {
  return `const win = freedom.window(element, ${JSON.stringify(options, null, 2)})`
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])
}
