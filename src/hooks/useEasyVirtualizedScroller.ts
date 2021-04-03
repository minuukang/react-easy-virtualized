import React, { useCallback, useRef } from 'react';
import { List } from 'react-virtualized/dist/es/List';

import useRepaintCallback from '../helpers/useRepaintCallback';

import useRender from './useRender';
import useCache from './useCache';
import useLayout from './useLayout';
import { InfiniteScrollOption } from '../types';

type RenderElement = { component: React.ReactElement; key: React.Key };

const AUTO_UPDATE_GRID_TIME = 3000;

export default function useEasyVirtualizedScroller(
  renderElements: RenderElement[],
  infiniteScrollOption?: InfiniteScrollOption
) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<List>();

  const handleRegisterList = useCallback((list: List) => {
    listRef.current = list;
  }, []);

  const getElementByKey = useCallback(
    (key: React.Key): HTMLElement | null => {
      return (wrapperRef.current?.querySelector(`[data-virtualized-key="${key}"]`)?.children[0] as HTMLElement) || null;
    },
    [wrapperRef]
  );

  const recomputedGridSize = useRepaintCallback(() => {
    listRef.current?.recomputeGridSize();
  }, [listRef]);

  const { updateCache, cacheRef } = useCache({ renderElements, recomputedGridSize });
  const { handleAutoUpdateGrid, handleRowsRendered } = useLayout({
    renderElements,
    getElementByKey,
    updateCache,
    autoUpdateGridTime: AUTO_UPDATE_GRID_TIME
  });
  const { renderListWrapper } = useRender({
    renderElements,
    cacheRef,
    infiniteScrollOption,
    onRegisterList: handleRegisterList,
    onRowsRendered: handleRowsRendered
  });

  return {
    updateCache,
    wrapperRef,
    handleAutoUpdateGrid,
    renderListWrapper
  };
}
