import { expect } from 'vitest';
import { page } from 'vitest/browser';
import { assertNotNull } from '../assertNotNull';
import { flushPendingFrames } from './act';
import { fireEvent } from './syntheticEvents';

/*
 * Browser Mode versions of the helpers in test/component/Tooltip/tooltipTestHelpers.tsx.
 * Keep the two files in sync: the jsdom tests still use the original.
 *
 * The show/hide helpers dispatch synthetic events, not userEvent, because the tests
 * mock getBoundingClientRect and depend on exact pointer coordinates. See ./syntheticEvents.ts.
 */

export function getTooltip(container: Element): HTMLElement {
  const allWrappers = container.querySelectorAll('.recharts-tooltip-wrapper');
  expect(allWrappers).toHaveLength(1);
  const element = allWrappers[0];
  assertNotNull(element);
  if (!(element instanceof HTMLElement)) {
    throw new Error(`Expected instance of HTMLElement, instead received: [${element}]`);
  }
  return element;
}

export type MouseCoordinate = { clientX: number; clientY: number };

const defaultCoordinates: MouseCoordinate = { clientX: 200, clientY: 200 };

async function showTooltipWithEvent(
  container: Element,
  selector: string | undefined,
  maybeCoordinate: MouseCoordinate | undefined,
  event: 'click' | 'touch' | 'hover',
  debug?: () => void,
): Promise<Element> {
  const tooltipTriggerElement = selector != null ? container.querySelector(selector) : container;
  if (tooltipTriggerElement == null && debug != null) {
    debug();
  }
  assertNotNull(tooltipTriggerElement);
  await expect.element(page.elementLocator(tooltipTriggerElement)).toBeVisible();
  const coordinate = maybeCoordinate ?? defaultCoordinates;
  switch (event) {
    case 'click': {
      await fireEvent.click(tooltipTriggerElement, coordinate);
      break;
    }
    case 'touch': {
      await fireEvent.touchMove(tooltipTriggerElement, [coordinate]);
      break;
    }
    case 'hover': {
      await fireEvent.mouseOver(tooltipTriggerElement, coordinate);
      break;
    }
    default: {
      throw new Error('Unexpected event type');
    }
  }
  // The mouse event triggers a requestAnimationFrame in the middleware. Flush it so the tooltip state is updated.
  await flushPendingFrames();
  return tooltipTriggerElement;
}

/**
 * Simulates a mouse over event on a given element, which should show the tooltip.
 *
 * Tests usually mock the bounding rect too, so that the chart layout matches the coordinates. Example:
 *
 * mockGetBoundingClientRect({ width: 100, height: 100 });
 *
 * @param container Element rendered in the test
 * @param selector Tooltip reacts to different triggers based on props, this is the selector that will be used to find the trigger element. If undefined then uses the container element itself.
 * @param coordinates X, Y coordinate of the mouse event
 * @param debug Optional function that will be called if the tooltip trigger element is not found
 * @returns Tooltip trigger element
 */
export function showTooltipOnCoordinate(
  container: Element,
  selector: string | undefined,
  coordinates: MouseCoordinate | undefined,
  debug?: () => void,
): Promise<Element> {
  return showTooltipWithEvent(container, selector, coordinates, 'hover', debug);
}

/**
 * Simulates a touch move event on a given element, which should show the tooltip.
 *
 * @param container Element rendered in the test
 * @param selector Tooltip reacts to different triggers based on props, this is the selector that will be used to find the trigger element. If undefined then uses the container element itself.
 * @param coordinates X, Y coordinate of the touch event
 * @param debug Optional function that will be called if the tooltip trigger element is not found
 * @returns Tooltip trigger element
 */
export function showTooltipOnCoordinateTouch(
  container: Element,
  selector: string | undefined,
  coordinates: MouseCoordinate | undefined,
  debug?: () => void,
): Promise<Element> {
  return showTooltipWithEvent(container, selector, coordinates, 'touch', debug);
}

/**
 * Simulates a mouse over event at the default coordinates of 200, 200.
 *
 * @param container Element rendered in the test
 * @param selector Tooltip reacts to different triggers based on props, this is the selector that will be used to find the trigger element. If undefined then uses the container element itself.
 * @param debug Optional function that will be called if the tooltip trigger element is not found
 * @returns Tooltip trigger element
 */
export function showTooltip(container: Element, selector?: string, debug?: () => void): Promise<Element> {
  return showTooltipOnCoordinate(container, selector, defaultCoordinates, debug);
}

export async function hideTooltip(container: Element, mouseHoverSelector: string): Promise<void> {
  const element = container.querySelector(mouseHoverSelector);
  assertNotNull(element);
  await fireEvent.mouseLeave(element);
}

export function showTooltipClick(container: Element, selector?: string, debug?: () => void): Promise<Element> {
  return showTooltipWithEvent(container, selector, defaultCoordinates, 'click', debug);
}

export async function expectTooltipNotVisible(container: Element): Promise<void> {
  await expect.element(page.elementLocator(getTooltip(container))).not.toBeVisible();
}

export async function expectTooltipPayload(
  container: Element,
  expectedTooltipTitle: string,
  expectedTooltipContent: ReadonlyArray<string>,
): Promise<void> {
  const tooltip = getTooltip(container);
  await expect.element(page.elementLocator(tooltip)).toBeVisible();
  // Exact text checks. toHaveTextContent only checks that the text is included.
  expect.soft(tooltip.querySelector('.recharts-tooltip-label')?.textContent).toBe(expectedTooltipTitle);
  const tooltipItems = tooltip.querySelectorAll('.recharts-tooltip-item');
  expect.soft(Array.from(tooltipItems).map(item => item.textContent)).toEqual(expectedTooltipContent);
}
