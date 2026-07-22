export function run({ inputs }) {
  const state = {
    position: { x: Number(inputs.x), y: Number(inputs.y) },
    size: { width: Number(inputs.width), height: Number(inputs.height) },
    mode: inputs.mode,
    dockedZoneId: inputs['docked-zone'] || undefined,
  }

  if (state.mode !== 'normal') {
    state.restorePosition = { x: 80, y: 72 }
    state.restoreSize = { width: 420, height: 260 }
  }

  return {
    storageKey: String(inputs.key),
    persistedState: state,
    localStorageValue: JSON.stringify(state),
    backendPayload: {
      position: state.position,
      size: state.size,
      dockedZone: state.dockedZoneId ?? null,
      minimized: state.mode === 'minimized',
      maximized: state.mode === 'maximized',
    },
  }
}
