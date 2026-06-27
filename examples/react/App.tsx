// React has no special integration package — `freedom` is plain DOM logic,
// so a tiny hook is all that's needed to bind it to a ref's lifecycle.

import { useEffect, useRef } from 'react';
import { freedom, type FreedomManager, type FreedomWindowOptions } from 'freedom';

/** One manager shared by every window in the app. */
const manager: FreedomManager = freedom.manager();

function useFreedomWindow(
  ref: React.RefObject<HTMLElement>,
  options: FreedomWindowOptions
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const win = freedom.window(element, options);
    manager.register(win);

    const focusOnPointerDown = () => manager.focus(win);
    element.addEventListener('pointerdown', focusOnPointerDown);

    return () => {
      element.removeEventListener('pointerdown', focusOnPointerDown);
      win.destroy(); // manager.unregister happens automatically via the 'destroy' event
    };
    // Intentionally run once per mount — pass a new `key` prop if you need
    // the window recreated with different options.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

interface PanelProps {
  title: string;
  initialPosition: { x: number; y: number };
  children: React.ReactNode;
}

function Panel({ title, initialPosition, children }: PanelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useFreedomWindow(ref, {
    initialPosition,
    minWidth: 240,
    minHeight: 160,
    dragHandle: '.panel-header',
    bounds: 'viewport',
    plugins: [freedom.plugins.snap({ threshold: 12 })],
  });

  return (
    <div ref={ref} className="panel" style={{ width: 320, height: 200 }}>
      <div className="panel-header">{title}</div>
      <div className="panel-body">{children}</div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Panel title="Inspector" initialPosition={{ x: 60, y: 60 }}>
        Drag by the header, resize from any corner.
      </Panel>
      <Panel title="Console" initialPosition={{ x: 460, y: 140 }}>
        Click a panel to bring it to the front.
      </Panel>
    </>
  );
}
