import React, { forwardRef, useImperativeHandle, useLayoutEffect } from 'react';
import { Grid } from 'react-virtualized/dist/es/Grid';
import { AutoSizer } from 'react-virtualized/dist/es/AutoSizer';
import { WindowScroller } from 'react-virtualized/dist/es/WindowScroller';

import useParentScrollElement from './helpers/useParentScrollElement';

import useEasyVirtualizedScroller from './hooks/useEasyVirtualizedScroller';
import { InfiniteScrollOption, RenderElement, UpdateCache } from './types';
import checkSupportPassive from './helpers/checkSupportPassive';

type Props = Partial<InfiniteScrollOption> & {
  columnCount?: number;
  useParentScrollElement?: boolean;
  overscanRowCount?: number;
  noRowsRenderer?: JSX.Element;
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
    noRowsRenderer,
    columnCount = 1,
    ...infiniteScrollOption
  } = props;
  const renderElements: RenderElement[] = React.Children.toArray(children)
    .filter((component): component is React.ReactElement => !!(component as React.ReactElement).key)
    .map(component => ({
      key: component.key as React.Key,
      component
    }));
  const { updateCache, renderGridWrapper, wrapperRef, handleAutoUpdateGrid, isProcessing } = useEasyVirtualizedScroller({
    renderElements,
    columnCount,
    infiniteScrollOption:
      infiniteScrollOption.onLoadMore !== undefined && infiniteScrollOption.hasMore !== undefined
        ? (infiniteScrollOption as InfiniteScrollOption)
        : undefined
  });
  const parentScrollElement = useParentScrollElement(useParentScrollElementOption ? wrapperRef : undefined);

  useImperativeHandle(
    ref,
    () => ({
      updateCache({ index, key }) {
        updateCache({
          index,
          key: key && `.$${key}` // Add React children key prefix ".$"
        });
      }
    }),
    [updateCache]
  );

  useLayoutEffect(() => {
    if (checkSupportPassive() && (!useParentScrollElementOption || parentScrollElement)) {
      const scrollElement = parentScrollElement || document.scrollingElement || document.documentElement;
      scrollElement.addEventListener('scroll', handleAutoUpdateGrid, { passive: true });
      return () => {
        scrollElement.removeEventListener('scroll', handleAutoUpdateGrid);
      };
    }
    return;
  }, [useParentScrollElementOption, parentScrollElement, handleAutoUpdateGrid]);

  return (
    <div ref={wrapperRef}>
      <WindowScroller
        scrollElement={(useParentScrollElementOption && parentScrollElement) || undefined}
        onScroll={checkSupportPassive() ? undefined : handleAutoUpdateGrid}
      >
        {({ height, isScrolling, onChildScroll, scrollTop }) => (
          <AutoSizer disableHeight>
            {({ width }) =>
              renderGridWrapper(gridProps => (
                <Grid
                  {...gridProps}
                  autoContainerWidth
                  scrollTop={scrollTop}
                  isScrolling={isScrolling}
                  onScroll={onChildScroll}
                  width={width}
                  height={height}
                  columnWidth={width / columnCount}
                  overscanRowCount={overscanRowCount}
                  noContentRenderer={() => <>{(isProcessing && infiniteScrollOption.loader) || noRowsRenderer}</>}
                  autoHeight
                  scrollToIndex={infiniteScrollOption.scrollReverse ? renderElements.length : undefined}
                  tabIndex={-1}
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
