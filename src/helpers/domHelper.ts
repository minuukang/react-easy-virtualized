export function nodeIsElement(node: Node | null): node is HTMLElement {
  return node?.nodeType === 1;
}

export function closest(node: Node, selector: string) {
  let el: Node | null = node;
  do {
    if (nodeIsElement(el) && el.matches(selector)) return el;
    el = el.parentElement || el.parentNode;
  } while (el !== null && nodeIsElement(el));
  return null;
}

export function getRootNode(node: Node): Node {
  if (typeof node.getRootNode === 'function') {
    return node.getRootNode();
  }
  if (node.parentNode !== null) {
    return getRootNode(node.parentNode);
  }

  return node;
}
