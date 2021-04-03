import { useState, useLayoutEffect } from 'react';

import getParentScrollElement from './getParentScrollElement';

export default function useParentScrollElement(elementRef?: React.RefObject<HTMLElement | null>) {
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (elementRef?.current) {
      setScrollElement(getParentScrollElement(elementRef.current));
    }
  }, [elementRef?.current]);
  return scrollElement;
}
