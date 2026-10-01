import React, { ComponentType } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { PageData } from '../../_data';
import { getTooltip, hideTooltip, showTooltip } from '../../helper/browser/tooltipTestHelpers';
import {
  Bar,
  BarChart,
  Funnel,
  FunnelChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  Scatter,
  ScatterChart,
  Tooltip,
} from '../../../src';
import {
  barChartItemMouseHoverTooltipSelector,
  barChartMouseHoverTooltipSelector,
  funnelChartMouseHoverTooltipSelector,
  pieChartMouseHoverTooltipSelector,
  radialBarMouseHoverTooltipSelector,
  scatterChartMouseHoverTooltipSelector,
} from './tooltipMouseHoverSelectors';
import { TooltipTrigger } from '../../../src/chart/types';
import { assertNotNull } from '../../helper/assertNotNull';
import { mockGetBoundingClientRect } from '../../helper/mockGetBoundingClientRect';
import { fireEvent } from '../../helper/browser/syntheticEvents';
import { flushPendingFrames } from '../../helper/browser/act';
import { expectTooltipScreenshot } from '../../helper/browser/screenshot';

type TooltipEventTypeTestCase = {
  testName: string;
  Component: ComponentType<{ tooltipTrigger: TooltipTrigger | undefined }>;
};

type TooltipEventTypeItemTestCase = TooltipEventTypeTestCase & {
  itemSelector: string;
};

const axisTestCases: ReadonlyArray<TooltipEventTypeTestCase> = [
  {
    testName: 'BarChart',
    Component: ({ tooltipTrigger }) => (
      <BarChart width={500} height={500} data={PageData}>
        <Bar isAnimationActive={false} dataKey="uv" />
        <Tooltip trigger={tooltipTrigger} />
      </BarChart>
    ),
  },
  {
    testName: 'RadialBarChart',
    Component: ({ tooltipTrigger }) => (
      <RadialBarChart width={500} height={500} data={PageData}>
        <RadialBar dataKey="uv" />
        <Tooltip trigger={tooltipTrigger} />
      </RadialBarChart>
    ),
  },
];

const itemTestCases: ReadonlyArray<TooltipEventTypeItemTestCase> = [
  {
    testName: 'BarChart Bar with tooltip.shared=false',
    Component: ({ tooltipTrigger }) => (
      <BarChart width={500} height={500} data={PageData}>
        <Bar isAnimationActive={false} dataKey="uv" />
        <Tooltip shared={false} trigger={tooltipTrigger} />
      </BarChart>
    ),
    itemSelector: barChartItemMouseHoverTooltipSelector,
  },
  {
    // This is a special case - Bar shows tooltip when rendering over its background, too.
    testName: 'BarChart Background with tooltip.shared=false',
    Component: ({ tooltipTrigger }) => (
      <BarChart width={500} height={500} data={PageData}>
        <Bar isAnimationActive={false} dataKey="uv" background={{ stroke: 'red' }} />
        <Tooltip shared={false} trigger={tooltipTrigger} />
      </BarChart>
    ),
    itemSelector: '.recharts-bar-background-rectangle',
  },
  {
    testName: 'FunnelChart',
    Component: ({ tooltipTrigger }) => (
      <FunnelChart width={500} height={500}>
        <Funnel dataKey="uv" data={PageData} />
        <Tooltip trigger={tooltipTrigger} />
      </FunnelChart>
    ),
    itemSelector: funnelChartMouseHoverTooltipSelector,
  },
  {
    testName: 'PieChart',
    Component: ({ tooltipTrigger }) => (
      <PieChart width={500} height={500}>
        <Pie
          isAnimationActive={false}
          cx={250}
          cy={250}
          innerRadius={0}
          outerRadius={200}
          data={PageData}
          dataKey="uv"
        />
        <Tooltip trigger={tooltipTrigger} />
      </PieChart>
    ),
    itemSelector: pieChartMouseHoverTooltipSelector,
  },
  {
    testName: 'ScatterChart',
    Component: ({ tooltipTrigger }) => (
      <ScatterChart width={500} height={500}>
        <Scatter data={PageData} dataKey="uv" />
        <Tooltip trigger={tooltipTrigger} />
      </ScatterChart>
    ),
    itemSelector: scatterChartMouseHoverTooltipSelector,
  },
  {
    testName: 'RadialBarChart with shared=false',
    Component: ({ tooltipTrigger }) => (
      <RadialBarChart width={500} height={500} data={PageData}>
        <RadialBar dataKey="uv" isAnimationActive={false} />
        <Tooltip shared={false} trigger={tooltipTrigger} />
      </RadialBarChart>
    ),
    itemSelector: radialBarMouseHoverTooltipSelector,
  },
];

describe('tooltipEventType', () => {
  describe.each(axisTestCases.concat(itemTestCases))('basic assumptions in $testName', ({ Component }) => {
    describe.each(['hover', 'click', undefined] as const)('trigger=%s', tooltipTrigger => {
      it('should not display any tooltip before user interaction', async () => {
        const { container } = await render(<Component tooltipTrigger={tooltipTrigger} />);
        const tooltip = getTooltip(container);
        await expect.element(page.elementLocator(tooltip)).not.toBeVisible();
      });

      it('should render chart area', async () => {
        await render(<Component tooltipTrigger={tooltipTrigger} />);
        await expect.element(page.getByCSS('.recharts-wrapper')).toBeInTheDocument();
        await expect.element(page.getByCSS('.recharts-wrapper')).toBeVisible();
      });
    });
  });

  describe.each(axisTestCases)('axis in $testName', ({ Component }) => {
    beforeEach(() => {
      mockGetBoundingClientRect({ width: 100, height: 100 });
    });

    describe.each(['hover', undefined] as const)('trigger=%s', tooltipTrigger => {
      it('should display tooltip when hovering over chart area, and hide it on mouse out', async () => {
        const { container } = await render(<Component tooltipTrigger={tooltipTrigger} />);
        const tooltip = getTooltip(container);

        await showTooltip(container, barChartMouseHoverTooltipSelector);

        await expectTooltipScreenshot(container);

        await hideTooltip(container, barChartMouseHoverTooltipSelector);

        await expect.element(page.elementLocator(tooltip)).not.toBeVisible();
      });

      it('should not react to mouse clicks', async () => {
        const { container } = await render(<Component tooltipTrigger={tooltipTrigger} />);

        const tooltip = getTooltip(container);
        await expect.element(page.elementLocator(tooltip)).not.toBeVisible();

        const trigger = container.querySelector('.recharts-wrapper');
        assertNotNull(trigger);

        await fireEvent.click(trigger, { clientX: 200, clientY: 200 });

        await expect.element(page.elementLocator(tooltip)).not.toBeVisible();
      });
    });

    describe('trigger=click', () => {
      const tooltipTrigger = 'click';
      it('should display tooltip when clicking anywhere on the chart, and keep it there when clicking again', async () => {
        const { container } = await render(<Component tooltipTrigger={tooltipTrigger} />);

        const tooltip = getTooltip(container);
        await expect.element(page.elementLocator(tooltip)).not.toBeVisible();

        const trigger = container.querySelector('.recharts-wrapper');
        assertNotNull(trigger);

        await fireEvent.click(trigger, { clientX: 200, clientY: 200 });

        await expectTooltipScreenshot(container);

        await fireEvent.click(trigger, { clientX: 200, clientY: 200 });

        await expectTooltipScreenshot(container);
      });

      it('should not react to mouse over', async () => {
        const { container } = await render(<Component tooltipTrigger={tooltipTrigger} />);

        const tooltip = getTooltip(container);
        await expect.element(page.elementLocator(tooltip)).not.toBeVisible();

        const trigger = container.querySelector('.recharts-wrapper');
        assertNotNull(trigger);

        await userEvent.hover(trigger);
        await flushPendingFrames();

        await expect.element(page.elementLocator(tooltip)).not.toBeVisible();
      });
    });
  });

  describe.each(itemTestCases)('item in $testName', ({ Component, itemSelector }) => {
    describe.each(['hover', 'click', undefined] as const)('trigger=%s', tooltipTrigger => {
      it('should render some items with given selector', async () => {
        await render(<Component tooltipTrigger={tooltipTrigger} />);
        await expect.element(page.getByCSS(itemSelector).first()).toBeInTheDocument();
        await expect.element(page.getByCSS(itemSelector).first()).toBeVisible();
      });

      it('should not react to mouse clicks or hovers on chart area', async () => {
        const { container } = await render(<Component tooltipTrigger={tooltipTrigger} />);

        const tooltip = getTooltip(container);

        const trigger = container.querySelector('.recharts-wrapper');
        assertNotNull(trigger);

        await fireEvent.click(trigger, { clientX: 200, clientY: 200 });
        await expect.element(page.elementLocator(tooltip)).not.toBeVisible();

        await fireEvent.mouseOver(trigger, { clientX: 200, clientY: 200 });
        await expect.element(page.elementLocator(tooltip)).not.toBeVisible();
      });
    });

    describe.each(['hover', undefined] as const)('trigger=%s', tooltipTrigger => {
      it('should display tooltip when hovering over the item element', async () => {
        const { container } = await render(<Component tooltipTrigger={tooltipTrigger} />);

        const tooltip = getTooltip(container);
        await expect.element(page.elementLocator(tooltip)).not.toBeVisible();

        const trigger = container.querySelector(itemSelector);
        assertNotNull(trigger);

        await fireEvent.mouseOver(trigger, { clientX: 20, clientY: 20 });
        await expectTooltipScreenshot(container);

        // this is needed for bar background - for some reason it needs to select the trigger twice, otherwise mouseOut does not dismiss the tooltip
        const trigger2 = container.querySelector(itemSelector);
        assertNotNull(trigger2);
        await fireEvent.mouseOut(trigger2);
        await expect.element(page.elementLocator(tooltip)).not.toBeVisible();
      });

      it('should not react to mouse clicks on the item', async () => {
        const { container } = await render(<Component tooltipTrigger={tooltipTrigger} />);

        const tooltip = getTooltip(container);
        await expect.element(page.elementLocator(tooltip)).not.toBeVisible();

        const trigger = container.querySelector(itemSelector);
        assertNotNull(trigger);

        await fireEvent.click(trigger, { clientX: 200, clientY: 200 });
        await expect.element(page.elementLocator(tooltip)).not.toBeVisible();
      });
    });

    describe('trigger=click', () => {
      const tooltipTrigger = 'click';
      it('should display tooltip when clicking on the item element, and keep it there on second click too, and after mouse over too', async () => {
        const { container } = await render(<Component tooltipTrigger={tooltipTrigger} />);

        const trigger = container.querySelector(itemSelector);
        assertNotNull(trigger);

        await fireEvent.click(trigger, { clientX: 20, clientY: 20 });
        await expectTooltipScreenshot(container);

        await fireEvent.click(trigger, { clientX: 20, clientY: 20 });
        await expectTooltipScreenshot(container);

        await fireEvent.mouseLeave(trigger);
        await expectTooltipScreenshot(container);

        await fireEvent.mouseLeave(container);
        await expectTooltipScreenshot(container);
      });

      it('should not react to mouse hover on the item', async () => {
        const { container } = await render(<Component tooltipTrigger={tooltipTrigger} />);

        const tooltip = getTooltip(container);

        const trigger = container.querySelector(itemSelector);
        assertNotNull(trigger);

        await fireEvent.mouseOver(trigger, { clientX: 20, clientY: 20 });
        await expect.element(page.elementLocator(tooltip)).not.toBeVisible();
      });
    });
  });
});
