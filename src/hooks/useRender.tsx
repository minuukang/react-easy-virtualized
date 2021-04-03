import React from 'react';
import { List, ListProps, ListRowRenderer } from 'react-virtualized/dist/es/List';
import { CellMeasurer, CellMeasurerCache } from 'react-virtualized/dist/es/CellMeasurer';
import { InfiniteLoader } from 'react-virtualized/dist/es/InfiniteLoader';

import useAsyncLoading from '../helpers/useAsyncLoading';
import { mergeFunc } from '../helpers/functionHelper';

import { RenderElement, InfiniteScrollOption, OnRowRendered, OverscanIndicesGetter } from '../types';

type RenderProps = {
  renderElements: RenderElement[];
  cacheRef: React.MutableRefObject<CellMeasurerCache>;
  onRowsRendered: OnRowRendered;
  onRegisterList: (listEl: List) => void;
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

export default function useRender(props: RenderProps) {
  const { renderElements, cacheRef, infiniteScrollOption, onRowsRendered, onRegisterList } = props;
  const [, nextLoadingProcesser] = useAsyncLoading();
  const rowCount = renderElements.length + (infiniteScrollOption?.hasMore ? 1 : 0);

  const handleIsRowLoaded = ({ index }: { index: number }) => {
    return !infiniteScrollOption?.hasMore || index < renderElements.length;
  };

  const renderRow: ListRowRenderer = params => {
    const data: RenderElement = handleIsRowLoaded(params)
      ? renderElements[params.index]
      : {
          key: 'loader',
          component: <>{infiniteScrollOption?.loader}</>
        };
    return (
      <CellMeasurer
        key={data.key}
        cache={cacheRef.current}
        parent={params.parent}
        columnIndex={0}
        rowIndex={params.index}
      >
        <div style={params.style} data-virtualized-key={data.key}>
          {data.component}
        </div>
      </CellMeasurer>
    );
  };

  const defaultProps = {
    overscanIndicesGetter: handleOverscanIndicesGetter,
    deferredMeasurementCache: cacheRef.current,
    rowHeight: cacheRef.current.rowHeight,
    rowCount,
    rowRenderer: renderRow
  };

  const renderListWrapper = (
    callback: (props: Partial<ListProps> & typeof defaultProps) => React.ReactElement<List>
  ) => {
    if (infiniteScrollOption) {
      return (
        <InfiniteLoader
          rowCount={rowCount}
          loadMoreRows={() => nextLoadingProcesser(infiniteScrollOption.onLoadMore)}
          isRowLoaded={handleIsRowLoaded}
        >
          {({ registerChild, onRowsRendered: onInfiniteScrollRowRendered }) =>
            callback({
              ...defaultProps,
              ref: mergeFunc(onRegisterList, registerChild),
              onRowsRendered: mergeFunc(onRowsRendered, onInfiniteScrollRowRendered)
            })
          }
        </InfiniteLoader>
      );
    } else {
      return callback({
        ...defaultProps,
        ref: onRegisterList,
        onRowsRendered
      });
    }
  };

  return {
    renderListWrapper
  };
}
