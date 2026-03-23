import { useState, useEffect } from 'react';

/**
 * Returns the current keyboard height in pixels.
 * On iOS Safari/WebView, the visual viewport shrinks when the keyboard opens.
 * We compare window.innerHeight with visualViewport.height to get the keyboard height.
 */
export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const kbHeight = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardHeight(kbHeight);

      // CRÍTICO: ajusta o #root ao visual viewport no iOS
      const root = document.getElementById('root');
      if (root) {
        root.style.height = `${vv.height}px`;
        root.style.top = `${vv.offsetTop}px`;
      }
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      // Restaura quando desmonta
      const root = document.getElementById('root');
      if (root) {
        root.style.height = '';
        root.style.top = '';
      }
    };
  }, []);

  return keyboardHeight;
}