import { ReactElement, Key } from 'react';
import { ListProps } from 'react-virtualized/dist/es/List';

export type RenderElement = { component: ReactElement; key: Key };
export type InfiniteScrollOption = {
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  scrollReverse?: boolean;
  threshold?: number;
  loader?: React.ReactElement;
};
export type OnRowRendered = NonNullable<ListProps['onRowsRendered']>;
export type OverscanIndicesGetter = NonNullable<ListProps['overscanIndicesGetter']>;
export type UpdateCache = (options: { key?: Key; index?: number }) => void;
