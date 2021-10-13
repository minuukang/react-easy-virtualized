import React, { useCallback, useReducer, useRef } from 'react';
import { Grid } from 'react-virtualized/dist/es/Grid';

import useRender from './useRender';
import useCache from './useCache';
import useLayout from './useLayout';

import { InfiniteScrollOption } from '../types';

type RenderElement = { component: React.ReactElement; key: React.Key };

const AUTO_UPDATE_GRID_TIME = 3000;

type Props = {
  renderElements: RenderElement[];
  columnCount: number;
  infiniteScrollOption?: InfiniteScrollOption;
};

export default function useVirtualizedScroller(props: Props) {
  const { renderElements, columnCount, infiniteScrollOption } = props;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<Grid>();
  const forceUpdate = useReducer(() => ({}), {})[1];

  const handleRegisterGrid = useCallback((grid: Grid) => {
    gridRef.current = grid;
  }, []);

  const getElementByKey = useCallback(
    (key: React.Key): HTMLElement | null => {
      return wrapperRef.current?.querySelector(`[data-virtualized-key="${key}"]`) || null;
    },
    [wrapperRef]
  );

  const recomputedGridSize = useCallback(
    (params?: { columnIndex: number; rowIndex: number }) => {
      if (params && gridRef.current) {
        gridRef.current.recomputeGridSize(params);
      } else {
        forceUpdate();
      }
    },
    [forceUpdate]
  );

  const { updateCache, cache } = useCache({
    columnCount,
    renderElements,
    recomputedGridSize,
    infiniteScrollOption
  });
  const { handleAutoUpdateGrid, handleSectionRendered } = useLayout({
    columnCount,
    renderElements,
    getElementByKey,
    updateCache,
    autoUpdateGridTime: AUTO_UPDATE_GRID_TIME
  });
  const { renderGridWrapper, isProcessing } = useRender({
    renderElements,
    cache,
    infiniteScrollOption,
    columnCount,
    onRegisterGrid: handleRegisterGrid,
    onSectionRendered: handleSectionRendered
  });

  return {
    updateCache,
    wrapperRef,
    handleAutoUpdateGrid,
    renderGridWrapper,
    isProcessing
  };
}
