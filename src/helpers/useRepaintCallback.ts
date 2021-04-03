import { DependencyList, useRef, useCallback } from 'react';

export default function useRepaintCallback<C extends (...args: never[]) => void>(
  callback: C,
  deps: DependencyList = []
): C {
  const timerRef = useRef<number>(0);
  return useCallback((...args: never[]) => {
    window.cancelAnimationFrame(timerRef.current);
    timerRef.current = window.requestAnimationFrame(() => {
      callback(...args);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps) as C;
}
