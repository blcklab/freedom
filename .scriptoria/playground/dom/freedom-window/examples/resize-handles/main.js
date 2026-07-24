export function run({ module, inputs }) {
  const target = document.querySelector('#demo-window')
  const desktop = document.querySelector('#desktop')
  const status = document.querySelector('#status')
  if (!(target instanceof HTMLElement) || !(desktop instanceof HTMLElement)) throw new Error('Demo elements were not found.')
  const sets = {
    all: ['n', 's', 'e', 'w', 'nw', 'ne', 'sw', 'se'],
    corners: ['nw', 'ne', 'sw', 'se'],
    horizontal: ['e', 'w'],
    vertical: ['n', 's'],
  }
  const handles = sets[String(inputs.handles)] ?? sets.all
  if (status) status.textContent = handles.join(' · ')
  const win = module.freedom.window(target, {
    initialPosition: { x: 72, y: 78 },
    initialSize: { width: 350, height: 220 },
    dragHandle: '.window__header',
    bounds: desktop,
    resizable: handles,
  })
  return () => win.destroy()
}
