export function run({ module }) {
  const desktop = document.querySelector('#desktop')
  const status = document.querySelector('#status')
  if (!(desktop instanceof HTMLElement)) throw new Error('Desktop was not found.')
  const specs = [
    ['#window-a', { x: 40, y: 48 }, { width: 270, height: 185 }],
    ['#window-b', { x: 220, y: 150 }, { width: 310, height: 190 }],
    ['#window-c', { x: 445, y: 64 }, { width: 270, height: 205 }],
  ]
  let top = 10
  const cleanups = []
  const windows = specs.map(([selector, position, size]) => {
    const element = document.querySelector(selector)
    if (!(element instanceof HTMLElement)) throw new Error(`Missing ${selector}`)
    const win = module.freedom.window(element, { initialPosition: position, initialSize: size, dragHandle: '.window__header', bounds: desktop, resizable: true, zIndex: ++top })
    const focus = () => { for (const item of windows) item.win.blur(); win.focus(); win.setZIndex(++top); if (status) status.textContent = `Focused: ${win.id}` }
    element.addEventListener('pointerdown', focus)
    cleanups.push(() => element.removeEventListener('pointerdown', focus))
    return { win, element }
  })
  windows[1]?.win.focus()
  return () => { for (const cleanup of cleanups) cleanup(); for (const item of windows) item.win.destroy() }
}
