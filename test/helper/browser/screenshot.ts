import { expect } from 'vitest';
import { page } from 'vitest/browser';
import { assertNotNull } from '../assertNotNull';

/*
 * Visual assertions. Each one compares an element with a reference screenshot.
 *
 * The first run saves a new reference and fails. Look at the reference before you commit it.
 * To update references, run `npm run test-browser -- --update`.
 *
 * References are specific to the browser and the platform, for example `-chromium-darwin.png`.
 *
 * @see {@link https://vitest.dev/guide/browser/visual-regression-testing}
 */

async function matchScreenshot(element: Element, name: string | undefined): Promise<void> {
  const locator = page.elementLocator(element);
  if (name == null) {
    await expect(locator).toMatchScreenshot();
  } else {
    await expect(locator).toMatchScreenshot(name);
  }
}

function getOnly(container: Element, selector: string): Element {
  const all = container.querySelectorAll(selector);
  expect(all).toHaveLength(1);
  const element = all[0];
  assertNotNull(element);
  return element;
}

/**
 * Compares what the test rendered with a reference screenshot.
 *
 * The screenshot covers the element that the test rendered: the first child of the container.
 * If the test rendered more than one element (for example two synced charts), it covers the whole container.
 */
export function expectScreenshot(container: Element, name?: string): Promise<void> {
  const target =
    container.childElementCount === 1 && container.firstElementChild != null ? container.firstElementChild : container;
  return matchScreenshot(target, name);
}

/**
 * Compares the tooltip with a reference screenshot. Use it to check what the tooltip shows.
 * The screenshot covers only the tooltip, so it does not show where the tooltip is. To check that, use expectScreenshot.
 */
export async function expectTooltipScreenshot(container: Element, name?: string): Promise<void> {
  const tooltip = getOnly(container, '.recharts-tooltip-wrapper');
  await expect.element(page.elementLocator(tooltip)).toBeVisible();
  await matchScreenshot(tooltip, name);
}

/**
 * Compares the legend with a reference screenshot. Use it to check the legend items, their order and their colors.
 */
export function expectLegendScreenshot(container: Element, name?: string): Promise<void> {
  return matchScreenshot(getOnly(container, '.recharts-legend-wrapper'), name);
}
