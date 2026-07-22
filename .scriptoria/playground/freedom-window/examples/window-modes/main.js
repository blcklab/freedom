export function run({ inputs }) {
  const selected = String(inputs.mode)
  const normal = { position: { x: 80, y: 72 }, size: { width: 420, height: 260 } }
  const minimized = { position: normal.position, size: { width: 420, height: Number(inputs['minimized-height']) } }
  const maximized = { position: { x: 0, y: 0 }, size: { width: 1280, height: 720 } }
  const states = { normal, minimized, maximized }
  const state = states[selected]

  const rows = Object.entries(states).map(([mode, value]) => `<tr><th>${mode === selected ? `<mark>${mode}</mark>` : mode}</th><td>${value.position.x}, ${value.position.y}</td><td>${value.size.width} × ${value.size.height}</td></tr>`).join('')
  const method = selected === 'normal' ? 'win.restore()' : selected === 'minimized' ? `win.minimize({ height: ${state.size.height} })` : 'win.maximize()'

  return {
    html: `<p><strong>Window mode state</strong></p><table><thead><tr><th>Mode</th><th>Position</th><th>Size</th></tr></thead><tbody>${rows}</tbody></table><pre>${method}</pre><p><small>freeDOM stores the previous normal position and size so restore can return to it.</small></p>`,
    selected,
    state,
    restoreSnapshot: normal,
    className: selected === 'normal' ? null : `freedom-${selected}`,
  }
}
