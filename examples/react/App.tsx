import { useEffect, useRef } from 'react';
import { freedom, type FreedomWindowOptions } from '@blcklab/freedom';
import { createManager, type FreedomManager } from '@blcklab/freedom/manager';
import { snapPlugin } from '@blcklab/freedom/plugins/snap';

const manager: FreedomManager = createManager();

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
      win.destroy();
    };
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
    plugins: [snapPlugin({ threshold: 12 })],
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
        Drag by the header, resize from any edge or corner.
      </Panel>

      <Panel title="Console" initialPosition={{ x: 460, y: 140 }}>
        Click a panel to bring it to the front.
      </Panel>
    </>
  );
}
