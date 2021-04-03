export function mergeFunc<F extends (...args: never[]) => void>(...callbacks: F[]): F {
  return function (...args: never[]) {
    callbacks.forEach(callback => callback(...args));
  } as F;
}
