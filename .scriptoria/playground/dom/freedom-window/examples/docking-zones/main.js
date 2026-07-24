export function run({ module }) {
  const target = document.querySelector('#demo-window')
  const desktop = document.querySelector('#desktop')
  const left = document.querySelector('#left-zone')
  const right = document.querySelector('#right-zone')
  const status = document.querySelector('#status')
  if (!(target instanceof HTMLElement) || !(desktop instanceof HTMLElement) || !(left instanceof HTMLElement) || !(right instanceof HTMLElement)) throw new Error('Demo elements were not found.')
  const zones = [
    { id: 'left', element: left, threshold: 24, snap: true, lockOnDrop: true, contains: 'center' },
    { id: 'right', element: right, threshold: 24, snap: true, lockOnDrop: true, contains: 'center' },
  ]
  const win = module.freedom.window(target, {
    initialPosition: { x: 275, y: 145 }, initialSize: { width: 260, height: 170 }, dragHandle: '.window__header', bounds: desktop, resizable: true, dropZones: zones,
    onDock: ({ zone }) => { if (status) status.textContent = `Docked: ${zone.id}` },
    onUndock: () => { if (status) status.textContent = 'Undocked' },
  })
  const dockLeft = () => win.dock('left'); const dockRight = () => win.dock('right'); const undock = () => win.undock({ x: 275, y: 145 })
  document.querySelector('#dock-left')?.addEventListener('click', dockLeft)
  document.querySelector('#dock-right')?.addEventListener('click', dockRight)
  document.querySelector('#undock')?.addEventListener('click', undock)
  return () => { document.querySelector('#dock-left')?.removeEventListener('click', dockLeft); document.querySelector('#dock-right')?.removeEventListener('click', dockRight); document.querySelector('#undock')?.removeEventListener('click', undock); win.destroy() }
}
