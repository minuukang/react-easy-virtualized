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
  scrollReverse?: boolean;
  hasMore?: boolean;
  loader?: React.ReactElement;
};

export type EasyVirtualizedScrollerRef = {
  updateCache: UpdateCache;
};

const DEFAULT_OVERSCAN_ROW_COUNT = 10;

const EasyVirtualizedScroller = forwardRef<EasyVirtualizedScrollerRef, React.PropsWithChildren<Props>>((props, ref) => {
  const {
    useParentScrollElement: useParentScrollElementOption,
    overscanRowCount = DEFAULT_OVERSCAN_ROW_COUNT,
    children,
    hasMore,
    scrollReverse,
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
          scrollReverse,
          loader
        }
      : undefined
  );
  const parentScrollElement = useParentScrollElement(useParentScrollElementOption ? wrapperRef : undefined);

  useImperativeHandle(ref, () => ({
    updateCache({ index, key }) {
      updateCache({
        index,
        key: key && `.$${key}` // Add React children key prefix ".$"
      });
    }
  }), [updateCache]);

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
                  scrollToIndex={scrollReverse ? renderElements.length : undefined}
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
