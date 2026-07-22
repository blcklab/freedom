export function run({ module }) {
  let error = ''

  try {
    module.createWindow({})
  } catch (value) {
    error = value instanceof Error ? value.message : String(value)
  }

  const expected = error.includes('requires a browser environment')

  return {
    html: `<p><strong>${expected ? 'Expected protection triggered' : 'Unexpected result'}</strong></p><pre>${escapeHtml(error)}</pre><p><small>Scriptoria executes module examples in a disposable Worker. freeDOM correctly refuses DOM window creation there while remaining safe to import.</small></p>`,
    importStatus: 'safe',
    createWindowStatus: expected ? 'browser-only guard passed' : 'guard not detected',
    message: error,
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character])
}
