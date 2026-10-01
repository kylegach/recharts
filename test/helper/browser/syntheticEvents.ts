import { act } from './act';

/*
 * Synthetic DOM events for Browser Mode tests.
 *
 * Prefer `userEvent` from 'vitest/browser'. It drives a real pointer.
 * Use these only when a test needs exact pointer coordinates: many tests mock getBoundingClientRect,
 * and a real pointer would report real coordinates that do not match the mocked layout.
 * If the event that opened something (for example a mouseover) was synthetic, close it with a synthetic event too.
 *
 * Each event runs inside act, like testing-library's fireEvent.
 * The API matches testing-library's fireEvent, so it reads the same as the jsdom tests.
 */

type PointerInit = Pick<MouseEventInit, 'clientX' | 'clientY'>;

async function dispatch(target: Element | Window | Document, event: Event): Promise<void> {
  await act(() => {
    target.dispatchEvent(event);
  });
}

function mouse(type: string, bubbles = true) {
  return (target: Element | Window | Document, init: PointerInit = {}) =>
    dispatch(target, new MouseEvent(type, { bubbles, cancelable: true, view: window, ...init }));
}

const mouseEnter = mouse('mouseenter', false);
const mouseLeave = mouse('mouseleave', false);
const mouseOver = mouse('mouseover');
const mouseOut = mouse('mouseout');

export const fireEvent = {
  click: mouse('click'),
  mouseDown: mouse('mousedown'),
  mouseUp: mouse('mouseup'),
  mouseMove: mouse('mousemove'),
  mouseOver,
  mouseOut,
  /** React builds onMouseEnter from mouseover, so dispatch both, as testing-library does. */
  async mouseEnter(target: Element, init: PointerInit = {}) {
    await mouseEnter(target, init);
    await mouseOver(target, init);
  },
  /** React builds onMouseLeave from mouseout, so dispatch both, as testing-library does. */
  async mouseLeave(target: Element, init: PointerInit = {}) {
    await mouseLeave(target, init);
    await mouseOut(target, init);
  },
  touchMove(target: Element, coordinates: ReadonlyArray<PointerInit>) {
    // Real browsers require Touch instances, not plain objects
    const touches = coordinates.map((coordinate, identifier) => new Touch({ identifier, target, ...coordinate }));
    return dispatch(target, new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches }));
  },
};
