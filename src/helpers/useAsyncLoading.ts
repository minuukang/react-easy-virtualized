import { useCallback, useState, useRef } from 'react';

type AnyPromiseVoidFunction = (...args: never[]) => Promise<void>;

export default function useAsyncLoading<F extends AnyPromiseVoidFunction>(callback: F) {
  const [isLoading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const callbackRef = useRef<F>(callback);
  callbackRef.current = callback;
  const handler = useCallback(async (...args: never[]) => {
    if (loadingRef.current) {
      return;
    }
    setLoading((loadingRef.current = true));
    try {
      return await callbackRef.current(...args);
    } finally {
      setLoading((loadingRef.current = false));
    }
  }, []);
  return [isLoading, handler as F] as const;
}
