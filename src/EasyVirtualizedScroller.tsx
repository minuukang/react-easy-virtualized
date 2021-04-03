import React, { forwardRef, useImperativeHandle } from 'react';
import { List } from 'react-virtualized/dist/es/List';
import { AutoSizer } from 'react-virtualized/dist/es/AutoSizer';
import { WindowScroller } from 'react-virtualized/dist/es/WindowScroller';

import useParentScrollElement from './helpers/useParentScrollElement';

import useEasyVirtualizedScroller from './hooks/useEasyVirtualizedScroller';
import { RenderElement, UpdateCache } from './types';

type Props = {
  useParentScrollElement?: boolean;
  overscanRowCount?: number;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  loader?: React.ReactElement;
};

export type VirtualizedScrollerRef = {
  updateCache: UpdateCache;
};

const DEFAULT_OVERSCAN_ROW_COUNT = 30;

const EasyVirtualizedScroller = forwardRef<VirtualizedScrollerRef, React.PropsWithChildren<Props>>((props, ref) => {
  const {
    useParentScrollElement: useParentScrollElementOption,
    overscanRowCount = DEFAULT_OVERSCAN_ROW_COUNT,
    children,
    hasMore,
    onLoadMore,
    loader
  } = props;
  const renderElements: RenderElement[] = React.Children.toArray(children)
    .filter((component): component is React.ReactElement => !!(component as React.ReactElement).key)
    .map(component => ({
      key: component.key as React.Key,
      component
    }));
  const { updateCache, renderListWrapper, wrapperRef, handleAutoUpdateGrid } = useEasyVirtualizedScroller(
    renderElements,
    onLoadMore !== undefined && hasMore !== undefined
      ? {
          onLoadMore,
          hasMore,
          loader
        }
      : undefined
  );
  const parentScrollElement = useParentScrollElement(useParentScrollElementOption ? wrapperRef : undefined);

  useImperativeHandle(ref, () => ({ updateCache }), [updateCache]);

  return (
    <div ref={wrapperRef}>
      <WindowScroller
        scrollElement={(useParentScrollElementOption && parentScrollElement) || undefined}
        onScroll={handleAutoUpdateGrid}
      >
        {({ height, isScrolling, onChildScroll, scrollTop }) => (
          <AutoSizer disableHeight>
            {({ width }) =>
              renderListWrapper(listProps => (
                <List
                  {...listProps}
                  scrollTop={scrollTop}
                  isScrolling={isScrolling}
                  onScroll={onChildScroll}
                  width={width}
                  height={height}
                  overscanRowCount={overscanRowCount}
                  autoHeight
                />
              ))
            }
          </AutoSizer>
        )}
      </WindowScroller>
    </div>
  );
});

export default EasyVirtualizedScroller;
