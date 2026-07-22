export function run({ inputs }) {
  const mode = String(inputs.mode)
  const initial = String(inputs.initial)
  const recommendation = mode === 'fixed'
    ? 'Best for floating app windows and overlays.'
    : mode === 'absolute'
      ? 'Best inside a positioned workspace with parent bounds.'
      : 'Use when preserving normal document flow matters.'

  const diagram = mode === 'fixed'
    ? 'VIEWPORT\n┌──────────────────────────────┐\n│                    ┌───────┐ │\n│                    │ panel │ │\n│                    └───────┘ │\n└──────────────────────────────┘'
    : mode === 'absolute'
      ? 'POSITIONED PARENT\n┌──────────────────────────────┐\n│  ┌───────┐                   │\n│  │ panel │                   │\n│  └───────┘                   │\n└──────────────────────────────┘'
      : 'NORMAL FLOW\ncontent before\n┌──────────────────────────────┐\n│ panel with relative movement │\n└──────────────────────────────┘\ncontent after'

  return {
    html: `<p><strong>${escapeHtml(mode)} positioning</strong></p><pre>${escapeHtml(diagram)}</pre><p>${escapeHtml(recommendation)}</p><table><tbody><tr><th>positioning</th><td><code>${escapeHtml(mode)}</code></td></tr><tr><th>initialPosition</th><td><code>${escapeHtml(initial)}</code></td></tr><tr><th>Recommended bounds</th><td><code>${mode === 'absolute' ? 'parent' : mode === 'fixed' ? 'viewport' : 'none'}</code></td></tr></tbody></table>`,
    options: { positioning: mode, initialPosition: initial },
    recommendation,
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])
}
