import { expect } from 'vitest';
import { page } from 'vitest/browser';
import { takeSnapshot } from '@chromatic-com/vitest';

/*
 * Visual tests run in Chromatic. Each takeSnapshot() call captures the DOM of the whole page,
 * and Chromatic compares it with the accepted baseline. The test itself does not fail when the snapshot changes.
 *
 * Tests call takeSnapshot() directly to snapshot the chart. These helpers first check that the element is shown,
 * so that a snapshot of the wrong state fails here, not only in Chromatic.
 *
 * @see {@link https://www.chromatic.com/docs/vitest/}
 */

function getOnly(container: Element, selector: string): Element {
  const all = container.querySelectorAll(selector);
  expect(all).toHaveLength(1);
  return all[0]!;
}

/**
 * Checks that the tooltip is visible, then takes a snapshot. Use it to check what the tooltip shows.
 */
export async function snapshotTooltip(container: Element, name?: string): Promise<void> {
  await expect.element(page.elementLocator(getOnly(container, '.recharts-tooltip-wrapper'))).toBeVisible();
  await takeSnapshot(name);
}

/**
 * Checks that the chart has one legend, then takes a snapshot. Use it to check the legend items, their order and their colors.
 */
export async function snapshotLegend(container: Element, name?: string): Promise<void> {
  getOnly(container, '.recharts-legend-wrapper');
  await takeSnapshot(name);
}
