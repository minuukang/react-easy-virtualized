import React, { useCallback, useEffect, useRef } from 'react';
import { Grid, GridProps, GridCellRenderer } from 'react-virtualized/dist/es/Grid';
import { CellMeasurer, CellMeasurerCache } from 'react-virtualized/dist/es/CellMeasurer';
import { InfiniteLoader } from 'react-virtualized/dist/es/InfiniteLoader';

import { mergeFunc } from '../helpers/functionHelper';
import useAsyncLoading from '../helpers/useAsyncLoading';
import VisibilitySensor from '../VisibilitySensor';

import { RenderElement, InfiniteScrollOption, OnSectionRendered, OverscanIndicesGetter } from '../types';

type RenderProps = {
  renderElements: RenderElement[];
  cache: CellMeasurerCache;
  onSectionRendered: OnSectionRendered;
  columnCount: number;
  onRegisterGrid: (listEl: Grid) => void;
  infiniteScrollOption?: InfiniteScrollOption;
};

const handleOverscanIndicesGetter: OverscanIndicesGetter = ({
  startIndex,
  overscanCellsCount,
  cellCount,
  stopIndex
}) => ({
  overscanStartIndex: Math.max(0, startIndex - overscanCellsCount),
  overscanStopIndex: Math.min(cellCount - 1, stopIndex + overscanCellsCount)
});

const LOADER_KEY = `loader__${Math.random()}`;

export default function useRender(props: RenderProps) {
  const { renderElements, cache, infiniteScrollOption, onSectionRendered, onRegisterGrid, columnCount } = props;
  const { onLoadMore, hasMore, loader, threshold } = infiniteScrollOption || {};
  const loaderVisibleRef = useRef(false);
  const loadMoreTimerRef = useRef(0);

  const rowCount = Math.ceil(renderElements.length / columnCount);
  const infiniteRowCount = rowCount + (infiniteScrollOption?.hasMore ? 1 : 0);

  const handleIsRowLoaded = ({ index }: { index: number }) => {
    return !hasMore || index < rowCount;
  };

  const [isProcessing, handleLoadMore] = useAsyncLoading(async () => {
    if (hasMore) {
      await onLoadMore?.();
      loadMoreTimerRef.current = window.requestAnimationFrame(() => {
        if (loaderVisibleRef.current) {
          handleLoadMore();
        }
      });
    }
  });

  const handleVisibilityLoadMore = useCallback(
    (visible: boolean) => {
      if ((loaderVisibleRef.current = visible)) {
        void handleLoadMore();
      }
    },
    [handleLoadMore]
  );

  useEffect(() => {
    void handleLoadMore();
    return () => {
      window.cancelAnimationFrame(loadMoreTimerRef.current);
    };
  }, [handleLoadMore]);

  const renderCell: GridCellRenderer = params => {
    const index = params.rowIndex * columnCount + params.columnIndex;
    const data: RenderElement | null = renderElements[index]
      ? renderElements[index]
      : params.columnIndex === 0
      ? {
          key: LOADER_KEY,
          component: <VisibilitySensor onChange={handleVisibilityLoadMore}>{loader}</VisibilitySensor>
        }
      : null;
    if (!data) {
      return null;
    }
    // TRICKY The style object is sometimes cached by Grid.
    // This prevents new style objects from bypassing shallowCompare().
    // However as of React 16, style props are auto-frozen (at least in dev mode)
    // Check to make sure we can still modify the style before proceeding.
    // https://github.com/facebook/react/commit/977357765b44af8ff0cfea327866861073095c12#commitcomment-20648713
    if (columnCount === 1 || data.key === LOADER_KEY) {
      const widthDescriptor = Object.getOwnPropertyDescriptor(params.style, 'width');
      if (widthDescriptor && widthDescriptor.writable) {
        // By default, List cells should be 100% width.
        // This prevents them from flowing under a scrollbar (if present).
        params.style.width = '100%';
      }
    }
    return (
      <CellMeasurer
        key={data.key}
        cache={cache}
        parent={params.parent}
        columnIndex={params.columnIndex}
        rowIndex={params.rowIndex}
      >
        <div style={params.style} data-virtualized-key={data.key}>
          <div>{data.component}</div>
        </div>
      </CellMeasurer>
    );
  };

  const defaultProps = {
    overscanIndicesGetter: handleOverscanIndicesGetter,
    deferredMeasurementCache: cache,
    rowHeight: cache.rowHeight,
    rowCount: infiniteRowCount,
    columnCount,
    cellRenderer: renderCell
  };

  const renderGridWrapper = (
    callback: (props: Partial<GridProps> & typeof defaultProps) => React.ReactElement<Grid>
  ) => {
    if (infiniteScrollOption) {
      return (
        <InfiniteLoader
          rowCount={infiniteRowCount}
          loadMoreRows={handleLoadMore}
          isRowLoaded={handleIsRowLoaded}
          threshold={threshold || 0}
        >
          {({ registerChild, onRowsRendered: onInfiniteScrollRowRendered }) =>
            callback({
              ...defaultProps,
              ref: mergeFunc(onRegisterGrid, registerChild),
              onSectionRendered: mergeFunc(onSectionRendered, ({ rowStartIndex, rowStopIndex }) => {
                onInfiniteScrollRowRendered({
                  startIndex: rowStartIndex,
                  stopIndex: rowStopIndex
                });
              })
            })
          }
        </InfiniteLoader>
      );
    } else {
      return callback({
        ...defaultProps,
        ref: onRegisterGrid,
        onSectionRendered
      });
    }
  };

  return {
    renderGridWrapper,
    isProcessing
  };
}
