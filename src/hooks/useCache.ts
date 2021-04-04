import { useCallback, useLayoutEffect, useRef } from 'react';
import { CellMeasurerCache } from 'react-virtualized/dist/es/CellMeasurer';

import useRefCallback from '../helpers/useRefCallback';

import { RenderElement, UpdateCache } from '../types';

type CacheProps = {
  renderElements: RenderElement[];
  recomputedGridSize(): void;
};

export default function useCache(props: CacheProps) {
  const { renderElements, recomputedGridSize } = props;
  const cacheRef = useRefCallback(() => new CellMeasurerCache({ fixedWidth: true }));

  // Update render key
  const updateRenderKey = renderElements.map(({ key }) => key);
  const beforeUpdateRenderKeyRef = useRef<React.Key[]>();

  const updateCache: UpdateCache = useCallback(
    ({ key, index }) => {
      const renderElement =
        typeof index === 'number' ? renderElements[index] : renderElements.find(item => item.key === key);
      if (!renderElement) {
        throw new Error(`key (${key}) or index (${index}) is not in VirtualizedScroller`);
      }
      const targetIndex = renderElements.indexOf(renderElement);
      cacheRef.current.clear(targetIndex, 0);
      recomputedGridSize();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(updateRenderKey), recomputedGridSize]
  );

  // When render elements update sort or deleted
  // recalculate cache
  useLayoutEffect(() => {
    const caches = cacheRef.current;
    if (beforeUpdateRenderKeyRef.current) {
      beforeUpdateRenderKeyRef.current.reduce<{
        from: number;
        to: number;
        width: number;
        height: number;
      }[]>((result, key, prevIndex) => {
        const currentIndex = renderElements.findIndex(element => key === element.key);
        // When the element is deleted
        if (currentIndex === -1) {
          caches.clear(prevIndex, 0);
        }
        // When the element is sorted
        else if (currentIndex !== prevIndex) {
          result.push({
            from: prevIndex,
            to: currentIndex,
            width: caches.getWidth(prevIndex, 0),
            height: caches.getHeight(prevIndex, 0)
          });
        }
        return result;
      }, []).forEach(({ from, to, width, height }) => {
        caches.clear(from, 0);
        caches.set(to, 0, width, height);
      });
      recomputedGridSize();
    }
    return () => {
      beforeUpdateRenderKeyRef.current = updateRenderKey;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateCache]);

  return {
    cacheRef,
    updateCache
  };
}
