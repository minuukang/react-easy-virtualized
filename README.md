# react-easy-virtualized

This package is easy way to use [react-virtualized]([react-virtualized](https://github.com/bvaughn/react-virtualized)) (built in `WindowScroller`, `AutoSizer`, `List` and optional of `InfniteScroll`). and use `ResizeObserver` to automatically update cache of `CellMeasurerCache`. (If you want to support IE, please add `ResizeObserver` polyfill)

## Comparison of react-virtualized

Manually use of `react-virtualized` package example.

```ts
import { AutoSizer, List, WindowScroller, InfiniteScroll, CellMeasurerCache, ListRowRenderer, CellMeasurer } from 'react-virtualized';

const cache = new CellMeasurerCache();

type Props = {
  data: AnyData[];
  loadMore(): Promise<void>;
  hasMore: boolean;
};

function App ({ data, loadMore, hasMore }: Props) {
  const rowCount = data.length + (hasMore ? 1 : 0);

  const isRowLoaded = ({ index }: { index: number }) => {
    return !hasMore || index < data.length;
  };

  const rowRenderer: ListRowRenderer = params => {
    const item = isRowLoaded(params)
      ? <DataComponent data={data[param.id]} />
      : <div>Loading...</div>;
    return (
      <CellMeasurer
        cache={cache}
        parent={params.parent}
        columnIndex={0}
        rowIndex={params.index}
      >
        <div style={params.style}>
          {item}
        </div>
      </CellMeasurer>
    );
  };

  return (
    <WindowScroller>
      {({ height, isScrolling, onChildScroll, scrollTop }) => (
        <AutoSizer disableHeight>
          {({ width }) =>
            <InfiniteScroller
              loadMoreRows={loadMore}
              isRowLoaded={isRowLoaded}
              rowCount={rowCount}
            >
              {({ onRowRendered, registerChild }) => (
                <List
                  onRowRendered={onRowRendered}
                  ref={registerChild}
                  scrollTop={scrollTop}
                  isScrolling={isScrolling}
                  onScroll={onChildScroll}
                  width={width}
                  height={height}
                  rowHeight={cache.rowHeight}
                  deferredMeasurementCache={cache}
                  rowCount={rowCount}
                  rowRenderer={rowRenderer}
                  autoHeight
                />
              )
            </InfiniteScroller>
          }
        </AutoSizer>
      )}
    </WindowScroller>
  );
}
```

... it's to long and hard to understanding rendering. try to use `react-easy-virtualized` !

```ts
import EasyVirtualized from 'react-easy-virtualized';

type Props = {
  data: AnyData[];
  loadMore(): Promise<void>;
  hasMore: boolean;
};

function App ({ data, loadMore, hasMore }: Props) {
  return (
    <EasyVirtualized
      onLoadMore={loadMore}
      hasMore={hasMore}
      loader={<div>Loading...</div>}
    >
      {data.map(item => (
        <DataComponent key={data.id} data={data} />
      )}
    </EasyVirtualized>
  );
};
```

Just give a childrens with `key`! Isn't it short and easy to understand? Let's go!

## Features

```ts
type Props = {
  // Want to detect parent overflow auto|scroll element. default is false (using window scroll)
  useParentScrollElement?: boolean;
  // Want to control overscan row count. default is 10 (Doc: https://github.com/bvaughn/react-virtualized/blob/master/docs/overscanUsage.md)
  overscanRowCount?: number;
  // InfiniteScroll options
  // pass `onLoadMore` and `hasMore` to enable infiniteScroll option
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  scrollReverse?: boolean; // if you want to use reverse scroll
  loader?: React.ReactElement;
};
```

* Automatically update cache when prepended item, deleted item, resize item dom
* If resize it item and removed from overscan area, will be automatically update cache when stop scroll 3 seconds
* If you want to manually control cache, pass to ref to `EasyVirtualized` and using `updateCache()`

```ts
import { useRef, Key } from 'react';
import EasyVirtualized, { EasyVirtualizedScrollerRef } from 'react-easy-virtualized';

function App () {
  const scrollerRef = useRef<EasyVirtualizedScrollerRef>(null);

  function updateItem ({ key, index }: { key?: Key; index?: number }) {
    // you can update the cache by index or key.
    scrollerRef.current.updateCache({
      key,
      index
    });
  }

  return <EasyVirtualized ref={scrollerRef} />
}
```

## Author

[minuukang](https://www.github.com/minuukang)