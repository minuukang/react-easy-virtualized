import { useCallback, useEffect, useRef } from 'react';

export default function useResizeObserver(
  callback: (entries: ResizeObserverEntry[]) => void
) {
  const observerCallbackRef = useRef<typeof callback>(callback);
  observerCallbackRef.current = callback;
  const observerRef = useRef<ResizeObserver | undefined>();

  useEffect(() => {
    observerRef.current = new ResizeObserver(entries => {
      observerCallbackRef.current(entries);
    });
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);
  return {
    observe: useCallback((element: Element) => {
      observerRef.current?.observe(element);
    }, [])
  };
}
