import { useRef } from 'react';

import useRefCallback from '../helpers/useRefCallback';
import useRepaintCallback from '../helpers/useRepaintCallback';
import useResizeObserver from '../helpers/useResizeObserver';
import { closest, nodeIsElement } from '../helpers/domHelper';

import { OnRowRendered, RenderElement, UpdateCache } from '../types';

type LayoutProps = {
  renderElements: RenderElement[];
  updateCache: UpdateCache;
  getElementByKey(key: RenderElement['key']): HTMLElement | null;
  requestLoadingProcesser(callback: () => Promise<unknown>): Promise<unknown>;
  autoUpdateGridTime: number;
};

function createRangeKeyArray(elements: RenderElement[], { start, end }: { start: number; end: number }) {
  return [...Array(end - start + 1).keys()]
    .map(i => i + start)
    .map(i => elements[i]?.key)
    .filter(Boolean);
}

export default function useLayout(props: LayoutProps) {
  const { renderElements, updateCache, getElementByKey, autoUpdateGridTime, requestLoadingProcesser } = props;

  const beforeScanKeysRef = useRef<RenderElement['key'][]>();
  const beforeOverScanKeysRef = useRef<RenderElement['key'][]>();

  const observeInitialKeySetRef = useRefCallback(() => new Set<RenderElement['key']>());
  const mutationUpdateKeySetRef = useRefCallback(() => new Set<RenderElement['key']>());

  const updateGridTimerRef = useRef<number>(0);

  const handleAutoUpdateGrid = useRepaintCallback(() => {
    window.clearTimeout(updateGridTimerRef.current);
    updateGridTimerRef.current = window.setTimeout(() => {
      requestLoadingProcesser(
        () =>
          new Promise<void>(resolve =>
            requestAnimationFrame(() => {
              [...mutationUpdateKeySetRef.current.values()].forEach(key => {
                if (!beforeOverScanKeysRef.current?.includes(key)) {
                  updateCache({ key });
                  mutationUpdateKeySetRef.current.delete(key);
                }
              });
              resolve();
            })
          )
      );
    }, autoUpdateGridTime);
  }, [updateCache, autoUpdateGridTime]);

  const updateObserver = useResizeObserver(
    entiries => {
      Array.from(
        new Set(
          entiries
            .map(entry => entry.target)
            .filter(nodeIsElement)
            .map(target => closest(target, '[data-virtualized-key]'))
            .filter(nodeIsElement)
        )
      ).forEach(itemWrapper => {
        const key = itemWrapper.dataset.virtualizedKey;
        if (key) {
          updateCache({ key });
          if (observeInitialKeySetRef.current.has(key)) {
            mutationUpdateKeySetRef.current.add(key);
          } else {
            observeInitialKeySetRef.current.add(key);
          }
        }
      });
    },
    [updateCache]
  );

  const handleRowsRendered: OnRowRendered = useRepaintCallback(
    info => {
      const scanKeys = createRangeKeyArray(renderElements, {
        start: info.startIndex,
        end: info.stopIndex
      });
      [...new Set([...scanKeys, ...(beforeScanKeysRef.current || [])])].forEach(key => {
        const isInBeforeScanKey = !!beforeScanKeysRef.current?.includes(key);
        // its new item
        if (!beforeScanKeysRef.current || !isInBeforeScanKey) {
          const targetElement = getElementByKey(key);
          if (targetElement) {
            updateObserver.observe(targetElement);
          }
        }
      });
      beforeScanKeysRef.current = scanKeys;
      beforeOverScanKeysRef.current = createRangeKeyArray(renderElements, {
        start: info.overscanStartIndex,
        end: info.overscanStopIndex
      });
    },
    [updateCache, getElementByKey]
  );

  return {
    handleRowsRendered,
    handleAutoUpdateGrid
  };
}
