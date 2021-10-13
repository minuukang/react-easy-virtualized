let supportsPassive: undefined | boolean = undefined;

export default function checkSupportPassive() {
  if (supportsPassive === undefined) {
    try {
      const opts = Object.defineProperty({}, 'passive', {
        get: function () {
          supportsPassive = true;
        }
      });
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const emptyCallback = () => {};
      window.addEventListener('testPassive', emptyCallback, opts);
      window.removeEventListener('testPassive', emptyCallback, opts);
    } catch (err) {
      supportsPassive = false;
    }
  }
  return supportsPassive;
}
