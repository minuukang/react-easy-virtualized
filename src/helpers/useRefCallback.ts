import { useRef, MutableRefObject } from 'react';

export default function useRefCallback<V>(callback: () => V) {
  const ref = useRef<V>();
  if (!ref.current) {
    ref.current = callback();
  }
  return ref as MutableRefObject<V>;
}
