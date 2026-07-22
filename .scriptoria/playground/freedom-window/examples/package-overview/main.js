export function run({ module }) {
  const exports = Object.keys(module).sort()
  const checks = [
    ['freedom.window', typeof module.freedom?.window],
    ['createWindow', typeof module.createWindow],
    ['window', typeof module.window],
    ['default', typeof module.default],
  ]

  const rows = checks
    .map(([name, type]) => `<tr><td><code>${name}</code></td><td>${type}</td><td>${type === 'function' || type === 'object' ? 'Available' : 'Missing'}</td></tr>`)
    .join('')

  return {
    html: `<p><strong>freeDOM 0.2.1</strong> is loaded from its browser ESM entry.</p><table><thead><tr><th>Export</th><th>Type</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table><p><small>The window factory is SSR-safe to import, but creating a window requires a real browser DOM.</small></p>`,
    package: '@blcklab/freedom',
    version: '0.2.1',
    exports,
    runtimeDependencies: 0,
    browserOnlyCreation: true,
  }
}
