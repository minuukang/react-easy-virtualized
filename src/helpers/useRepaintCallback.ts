import { useRef, useCallback } from 'react';

export default function useRepaintCallback<C extends (...args: never[]) => void>(
  callback: C
): C {
  const timerRef = useRef<number>(0);
  const callbackRef = useRef<typeof callback>(callback);
  callbackRef.current = callback;
  return useCallback((...args: never[]) => {
    window.cancelAnimationFrame(timerRef.current);
    timerRef.current = window.requestAnimationFrame(() => {
      callbackRef.current(...args);
    });
  }, []) as C;
}
