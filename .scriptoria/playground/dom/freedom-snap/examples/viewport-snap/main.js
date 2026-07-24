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

export function run({ module, inputs }) {
  const card = document.querySelector('#snap-card')
  const desktop = document.querySelector('#desktop')
  const status = document.querySelector('#status')
  if (!(card instanceof HTMLElement) || !(desktop instanceof HTMLElement)) throw new Error('Snap elements were not found.')
  const events = []
  const plugin = module.snapPlugin({ threshold: Number(inputs.threshold), snapToViewport: false, getSnapTargets: () => [{ id: 'workspace', x: 0, y: 0, width: desktop.clientWidth, height: desktop.clientHeight }], onSnap: ({ edges }) => { events.push(edges.join('+')); if (status) status.textContent = `Snapped: ${edges.join(' + ')}` } })
  const context = { element: card, window: { getSize: () => ({ width: card.offsetWidth, height: card.offsetHeight }) }, emit() {} }
  return makeDraggable(card, plugin, context, status)
}
