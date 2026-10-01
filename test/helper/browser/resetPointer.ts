import { beforeEach } from 'vitest';
import { userEvent } from 'vitest/browser';

/*
 * The real pointer stays where the last pointer action left it. When a test renders a chart under it,
 * Chromium sends that chart real mouse events, which override the synthetic events the test dispatches.
 * Tests then fail at random, depending on where the pointer was.
 *
 * Moving the pointer to an empty spot does not help: a large chart can cover any spot in the viewport.
 * So park it on a small element that stays on top of everything. Charts render below it and never get hit.
 * This runs after vitest-browser-react has cleaned up the previous test.
 */
function getPointerParking(): HTMLElement {
  const existing = document.querySelector<HTMLElement>('[data-pointer-parking]');
  if (existing) {
    return existing;
  }
  const parking = document.createElement('div');
  parking.setAttribute('data-pointer-parking', '');
  parking.style.cssText = 'position: fixed; top: 0; left: 0; width: 4px; height: 4px; z-index: 2147483647;';
  document.body.appendChild(parking);
  return parking;
}

beforeEach(async () => {
  await userEvent.hover(getPointerParking());
});
