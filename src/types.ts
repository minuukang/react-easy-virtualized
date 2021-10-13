import { ReactElement, Key } from 'react';
import { GridProps } from 'react-virtualized/dist/es/Grid';

export type RenderElement = { component: ReactElement; key: Key };
export type InfiniteScrollOption = {
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  scrollReverse?: boolean;
  threshold?: number;
  loader?: React.ReactElement;
};
export type OnSectionRendered = NonNullable<GridProps['onSectionRendered']>;
export type OverscanIndicesGetter = NonNullable<GridProps['overscanIndicesGetter']>;
export type UpdateCache = (options: { key?: Key; index?: number }) => void;
