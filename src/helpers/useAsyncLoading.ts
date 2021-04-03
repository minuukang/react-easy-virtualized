import { useCallback, useState } from 'react';

export default function useAsyncLoading(options: { enableMultiple?: boolean } = { enableMultiple: false }) {
  const { enableMultiple } = options;
  const [isLoading, setLoading] = useState(false);
  const handler = useCallback(
    async (callback: () => Promise<unknown>) => {
      if (!enableMultiple && isLoading) {
        return;
      }
      setLoading(true);
      try {
        return await callback();
      } finally {
        setLoading(false);
      }
    },
    [enableMultiple, isLoading]
  );
  return [isLoading, handler] as const;
}
