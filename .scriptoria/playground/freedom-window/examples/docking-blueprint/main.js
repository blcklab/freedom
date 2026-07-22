export function run({ inputs }) {
  const active = String(inputs.zone)
  const contains = String(inputs.contains)
  const lockOnDrop = Boolean(inputs['lock-on-drop'])
  const zones = ['todo', 'inprogress', 'completed']
  const headers = zones.map((zone) => `<th>${zone === active ? `<mark>${label(zone)}</mark>` : label(zone)}</th>`).join('')
  const cells = zones.map((zone) => `<td>${zone === active ? '<strong>Task window</strong><br><small>active dock</small>' : '<small>drop zone</small>'}</td>`).join('')

  const dropZones = zones.map((id) => ({
    id,
    element: `() => document.querySelector('#${id}')`,
    snap: true,
    threshold: 28,
    lockOnDrop,
    contains,
  }))

  return {
    html: `<p><strong>Task-board docking blueprint</strong></p><table><thead><tr>${headers}</tr></thead><tbody><tr>${cells}</tr></tbody></table><p>Detection: <code>${contains}</code> · Lock on drop: <strong>${lockOnDrop}</strong></p><pre>win.dock('${escapeHtml(active)}')\nwin.undock({ x: 40, y: 40 })</pre>`,
    activeZone: active,
    dropZones,
    note: 'The preview documents the configuration; actual drag/drop requires a browser DOM.',
  }
}

function label(value) {
  return value === 'inprogress' ? 'In Progress' : value[0].toUpperCase() + value.slice(1)
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])
}
