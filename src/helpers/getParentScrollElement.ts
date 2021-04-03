const mapOfParentScrollElement = new WeakMap<HTMLElement, HTMLElement | null>();

export default function getParentScrollElement(element: HTMLElement | null, includeHidden: boolean = false) {
  if (element) {
    if (mapOfParentScrollElement.has(element)) {
      return mapOfParentScrollElement.get(element) || null;
    }
    let style = getComputedStyle(element);
    if (style.position === 'fixed') {
      return null;
    }
    const excludeStaticParent = style.position === 'absolute';
    const overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/;
    let parent: HTMLElement | null;
    const parentElements: HTMLElement[] = [];
    for (parent = element; parent; ) {
      parentElements.push(parent);
      style = getComputedStyle(parent);
      if (excludeStaticParent && style.position === 'static') {
        parent = parent.parentElement;
        continue;
      }
      if (mapOfParentScrollElement.has(parent)) {
        return mapOfParentScrollElement.get(parent) || null;
      }
      if (overflowRegex.test(`${style.overflow}${style.overflowY}${style.overflowX}`)) {
        parentElements.forEach(parentElement => {
          mapOfParentScrollElement.set(parentElement, parent);
        });
        return parent;
      }
      parent = parent.parentElement;
    }
  }
  return null;
}
