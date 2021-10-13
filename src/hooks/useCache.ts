import { useCallback, useEffect, useMemo, useRef } from 'react';
import { CellMeasurerCache } from 'react-virtualized/dist/es/CellMeasurer';

import { InfiniteScrollOption, RenderElement, UpdateCache } from '../types';

type CacheProps = {
  columnCount: number;
  renderElements: RenderElement[];
  infiniteScrollOption?: InfiniteScrollOption;
  recomputedGridSize(params?: { rowIndex: number; columnIndex: number; }): void;
};

function getRowColumnIndex(index: number, columnCount: number) {
  const row = Math.floor(index / columnCount);
  return {
    row,
    column: index - row * columnCount
  };
}

const DEFAULT_UNDEFINED_HEIGHT = 1;

export default function useCache(props: CacheProps) {
  const { renderElements, infiniteScrollOption, recomputedGridSize, columnCount } = props;
  const cache = useMemo(() => new CellMeasurerCache({ fixedWidth: true, defaultHeight: DEFAULT_UNDEFINED_HEIGHT }), []);

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
      const { row, column } = getRowColumnIndex(targetIndex, columnCount);
      cache.clear(row, column);
      recomputedGridSize();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(updateRenderKey), cache, recomputedGridSize, columnCount]
  );

  // When render elements update sort or deleted
  // recalculate cache
  useEffect(() => {
    if (beforeUpdateRenderKeyRef.current) {
      // If using infinite loader, delete cache of loading
      if (infiniteScrollOption) {
        const cacheIndex = infiniteScrollOption.scrollReverse
          ? 0
          : Math.ceil(beforeUpdateRenderKeyRef.current.length / columnCount);
        cache.clear(cacheIndex, 0);
      }
      const updateElements = beforeUpdateRenderKeyRef.current
        .reduce<
          {
            from: number;
            to: number;
          }[]
        >((result, key, prevIndex) => {
          const currentIndex = renderElements.findIndex(element => key === element.key);
          // When the element is deleted
          if (currentIndex === -1) {
            const { row, column } = getRowColumnIndex(prevIndex, columnCount);
            cache.clear(row, column);
          }
          // When the element is sorted
          else if (currentIndex !== prevIndex) {
            result.push({
              from: prevIndex,
              to: currentIndex
            });
          }
          return result;
        }, []);
      updateElements.forEach(({ from, to }) => {
        const fromIndex = getRowColumnIndex(from, columnCount);
        const width = cache.getWidth(fromIndex.row, fromIndex.column);
        const height = cache.getHeight(fromIndex.row, fromIndex.column);
        cache.clear(fromIndex.row, fromIndex.column);
        if (width && height > DEFAULT_UNDEFINED_HEIGHT) {
          const toIndex = getRowColumnIndex(to, columnCount);
          cache.set(toIndex.row, toIndex.column, width, height);
          recomputedGridSize({
            rowIndex: toIndex.row,
            columnIndex: toIndex.column,
          });
        }
      });
    }
    return () => {
      beforeUpdateRenderKeyRef.current = updateRenderKey;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cache, updateCache]);

  return {
    cache,
    updateCache
  };
}
