function makeDraggable(element, plugin, context, status) {
  let startPointer = null
  let startPosition = { x: element.offsetLeft, y: element.offsetTop }
  const moveTo = (position) => { element.style.left = `${position.x}px`; element.style.top = `${position.y}px` }
  const onDown = (event) => { startPointer = { x: event.clientX, y: event.clientY }; startPosition = { x: element.offsetLeft, y: element.offsetTop }; element.setPointerCapture(event.pointerId) }
  const onMove = (event) => {
    if (!startPointer) return
    const delta = { x: event.clientX - startPointer.x, y: event.clientY - startPointer.y }
    const proposed = { x: startPosition.x + delta.x, y: startPosition.y + delta.y }
    const resolved = plugin.onDrag?.({ position: proposed, delta, pointerEvent: event }, context) ?? proposed
    moveTo(resolved)
    if (status) status.textContent = `${Math.round(resolved.x)}, ${Math.round(resolved.y)}`
  }
  const onUp = (event) => { startPointer = null; if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId) }
  element.addEventListener('pointerdown', onDown); element.addEventListener('pointermove', onMove); element.addEventListener('pointerup', onUp); element.addEventListener('pointercancel', onUp)
  return () => { element.removeEventListener('pointerdown', onDown); element.removeEventListener('pointermove', onMove); element.removeEventListener('pointerup', onUp); element.removeEventListener('pointercancel', onUp); plugin.onDestroy?.(context) }
}

export function run({ module }) {
  const card = document.querySelector('#snap-card')
  const target = document.querySelector('#target')
  const status = document.querySelector('#status')
  const log = document.querySelector('#log')
  if (!(card instanceof HTMLElement) || !(target instanceof HTMLElement)) throw new Error('Snap elements were not found.')
  const lines = []
  const write = (event, edges) => { lines.unshift(`${event.padEnd(8)} ${edges.join(' + ')}`); lines.splice(10); if (log) log.textContent = lines.join('\n'); if (status) status.textContent = event }
  const plugin = module.snapPlugin({ threshold: 28, snapToViewport: false, getSnapTargets: () => [{ id: 'events', x: target.offsetLeft, y: target.offsetTop, width: target.offsetWidth, height: target.offsetHeight }], onSnap: ({ edges }) => write('snap', edges), onUnsnap: ({ edges }) => write('unsnap', edges) })
  const context = { element: card, window: { getSize: () => ({ width: card.offsetWidth, height: card.offsetHeight }) }, emit(event, data) { if (event === 'snap' || event === 'unsnap') console.info(event, data.edges) } }
  return makeDraggable(card, plugin, context, status)
}
