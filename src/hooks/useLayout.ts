import { useRef } from 'react';

import useRefCallback from '../helpers/useRefCallback';
import useRepaintCallback from '../helpers/useRepaintCallback';
import useResizeObserver from '../helpers/useResizeObserver';
import { closest, getRootNode, nodeIsElement } from '../helpers/domHelper';

import { OnSectionRendered, RenderElement, UpdateCache } from '../types';

type LayoutProps = {
  columnCount: number;
  renderElements: RenderElement[];
  updateCache: UpdateCache;
  getElementByKey(key: RenderElement['key']): HTMLElement | null;
  autoUpdateGridTime: number;
};

function createRangeKeyArray(elements: RenderElement[], { start, end }: { start: number; end: number }) {
  return [...Array(end - start + 1).keys()]
    .map(i => i + start)
    .map(i => elements[i]?.key)
    .filter(Boolean);
}

export default function useLayout(props: LayoutProps) {
  const { renderElements, updateCache, getElementByKey, autoUpdateGridTime, columnCount } = props;

  const beforeScanKeysRef = useRef<RenderElement['key'][]>();
  const beforeOverScanKeysRef = useRef<RenderElement['key'][]>();

  const mutationUpdateKeySetRef = useRefCallback(() => new Set<RenderElement['key']>());

  const updateGridTimerRef = useRef<number>(0);

  const handleAutoUpdateGrid = useRepaintCallback(() => {
    window.clearTimeout(updateGridTimerRef.current);
    if (!mutationUpdateKeySetRef.current.size) {
      return;
    }
    updateGridTimerRef.current = window.setTimeout(() => {
      requestAnimationFrame(() => {
        [...mutationUpdateKeySetRef.current.values()].forEach(key => {
          if (!beforeOverScanKeysRef.current?.includes(key)) {
            if (renderElements.some(el => el.key === key)) {
              updateCache({ key });
            } else {
              mutationUpdateKeySetRef.current.delete(key);
            }
          }
        });
      });
    }, autoUpdateGridTime);
  });

  const updateObserver = useResizeObserver(
    entiries => {
      window.requestAnimationFrame(() => {
        Array.from(
          new Set(
            entiries
              .map(entry => entry.target)
              .filter(nodeIsElement)
              .filter(target => getRootNode(target) === document)
              .map(target => closest(target, '[data-virtualized-key]'))
              .filter(nodeIsElement)
          )
        ).forEach(itemWrapper => {
          const key = itemWrapper.dataset.virtualizedKey;
          if (key) {
            updateCache({ key });
            mutationUpdateKeySetRef.current.add(key);
          }
        });
      })
    }
  );

  const handleSectionRendered: OnSectionRendered = useRepaintCallback(
    info => {
      const scanKeys = createRangeKeyArray(renderElements, {
        start: info.rowStartIndex * columnCount + info.columnStartIndex,
        end: info.rowStopIndex * columnCount + info.columnStopIndex
      });
      [...new Set([...scanKeys, ...(beforeScanKeysRef.current || [])])].forEach(key => {
        const isInBeforeScanKey = !!beforeScanKeysRef.current?.includes(key);
        // its new item
        if (!beforeScanKeysRef.current || !isInBeforeScanKey) {
          const targetElement = getElementByKey(key);
          if (targetElement) {
            [...targetElement.children].forEach(element => {
              updateObserver.observe(element);
            });
          }
        }
      });
      beforeScanKeysRef.current = scanKeys;
      beforeOverScanKeysRef.current = createRangeKeyArray(renderElements, {
        start: info.rowOverscanStartIndex * columnCount + info.columnOverscanStartIndex,
        end: info.rowOverscanStopIndex * columnCount + info.columnOverscanStopIndex
      });
    }
  );

  return {
    handleSectionRendered,
    handleAutoUpdateGrid
  };
}
