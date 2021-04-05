import { DependencyList, useCallback, useEffect, useRef } from 'react';

import { getRootNode } from './domHelper';

export default function useResizeObserver(
  callback: (entries: ResizeObserverEntry[]) => void,
  deps: DependencyList = []
) {
  const observerRef = useRef<ResizeObserver | undefined>();
  const observeElementsRef = useRef<Array<{ element: Element }>>([]);
  const observeInitialSetRef = useRef<Set<Element>>();

  useEffect(() => {
    observeInitialSetRef.current = new Set();
    observerRef.current = new ResizeObserver(entries => {
      const isNotInitialEntries = entries.filter(entry => {
        // Check created or removed
        return observeInitialSetRef.current?.has(entry.target) && getRootNode(entry.target) === document;
      });
      entries.forEach(entry => {
        observeInitialSetRef.current?.add(entry.target);
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
      observerRef.current?.observe(element);
      observeElementsRef.current.push({
        element
      });
    }, [])
  };
}
