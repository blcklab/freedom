export function run({ inputs }) {
  const strategy = String(inputs.strategy)
  const margin = Number(inputs.margin)
  const values = strategy === 'rect'
    ? { x: margin, y: margin, width: 800 - margin * 2, height: 500 - margin * 2 }
    : strategy

  const snippets = {
    viewport: "bounds: 'viewport'",
    parent: "positioning: 'absolute',\nbounds: 'parent'",
    none: "bounds: 'none'",
    rect: `bounds: ${JSON.stringify(values)}`,
    dynamic: 'bounds: () => workspace.getBoundingClientRect()',
  }

  const behavior = {
    viewport: 'Keep the window inside the browser viewport.',
    parent: 'Keep an absolute window inside its offset parent.',
    none: 'Allow unrestricted movement and resizing.',
    rect: 'Constrain movement to a fixed application rectangle.',
    dynamic: 'Resolve the latest workspace geometry during interaction.',
  }

  return {
    html: `<p><strong>${escapeHtml(strategy)} bounds</strong></p><p>${escapeHtml(behavior[strategy])}</p><pre>freedom.window(element, {\n  ${escapeHtml(snippets[strategy])}\n})</pre><p><small>Bounds may also be changed later through <code>win.setBounds(...)</code>.</small></p>`,
    strategy,
    resolvedExample: values,
    description: behavior[strategy],
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])
}
