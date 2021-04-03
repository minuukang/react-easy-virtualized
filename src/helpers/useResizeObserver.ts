import { DependencyList, useCallback, useEffect, useRef } from 'react';
import ResizeObserver from 'resize-observer-polyfill';

import { getRootNode } from './domHelper';

export default function useResizeObserver(
  callback: (entries: ResizeObserverEntry[]) => void,
  deps: DependencyList = []
) {
  const observerRef = useRef<ResizeObserver | undefined>();
  const observeElementsRef = useRef<Array<{ element: Element }>>([]);

  useEffect(() => {
    observerRef.current = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      const isNotInitialEntries = entries.filter(entry => {
        // Check removed
        return getRootNode(entry.target) === document;
      });
      if (isNotInitialEntries.length) {
        window.requestAnimationFrame(() => {
          callback(isNotInitialEntries);
        });
      }
    });
    observeElementsRef.current.forEach(({ element }) => {
      observerRef.current?.observe(element);
    });
    return () => {
      observerRef?.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return {
    observe: useCallback((element: Element) => {
      observerRef?.current?.observe(element);
      observeElementsRef.current.push({
        element
      });
    }, [])
  };
}
