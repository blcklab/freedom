export function run({ module }) {
  const target = document.querySelector('#demo-window')
  const desktop = document.querySelector('#desktop')
  const grip = document.querySelector('#grip')
  if (!(target instanceof HTMLElement) || !(desktop instanceof HTMLElement) || !(grip instanceof HTMLElement)) throw new Error('Demo elements were not found.')
  const win = module.freedom.window(target, {
    initialPosition: { x: 70, y: 68 },
    initialSize: { width: 360, height: 220 },
    dragHandle: grip,
    bounds: desktop,
    resizable: true,
  })
  return () => win.destroy()
}
