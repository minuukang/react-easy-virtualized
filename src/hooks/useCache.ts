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
  const keyToIndexRef = useRef<Array<{ key: React.Key; index: number }>>([]);

  // Update render key
  const updateRenderKey = JSON.stringify(renderElements.map(({ key }) => key));

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
    [updateRenderKey, recomputedGridSize]
  );

  // When render elements update sort or deleted
  // recalculate cache
  useLayoutEffect(() => {
    const caches = cacheRef.current;
    if (keyToIndexRef.current.length) {
      const reCaculators: Array<{ index: number; target: number; width: number; height: number }> = [];
      keyToIndexRef.current.forEach(element => {
        const currentIndex = renderElements.findIndex(({ key }) => key === element.key);
        // When the element is deleted
        if (currentIndex === -1) {
          caches.clear(element.index, 0);
        }
        // When the element is sorted
        else if (currentIndex !== element.index) {
          reCaculators.push({
            index: element.index,
            target: currentIndex,
            width: caches.getWidth(element.index, 0),
            height: caches.getHeight(element.index, 0)
          });
        }
      });
      if (reCaculators.length) {
        reCaculators.forEach(({ index, target, width, height }) => {
          caches.clear(index, 0);
          caches.set(target, 0, width, height);
        });
      }
      recomputedGridSize();
    }
    return () => {
      keyToIndexRef.current = renderElements.map(({ key }, index) => ({ key, index }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateCache]);

  return {
    cacheRef,
    updateCache
  };
}
