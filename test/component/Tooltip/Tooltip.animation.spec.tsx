import React from 'react';
import { takeSnapshot } from '@chromatic-com/vitest';
import { describe, it, expect, beforeEach } from 'vitest';
import { createSelectorTestCase } from '../../helper/browser/createSelectorTestCase';
import { Line, LineChart, Tooltip } from '../../../src';
import {
  expectTooltipNotVisible,
  getTooltip,
  hideTooltip,
  showTooltipOnCoordinate,
} from '../../helper/browser/tooltipTestHelpers';
import { lineChartMouseHoverTooltipSelector } from './tooltipMouseHoverSelectors';
import { selectIsTooltipActive } from '../../../src/state/selectors/selectors';
import { mockGetBoundingClientRect } from '../../helper/mockGetBoundingClientRect';
import { expectLastCalledWith } from '../../helper/expectLastCalledWith';

describe('Tooltip animation', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({
      width: 10,
      height: 10,
    });
  });

  describe('with default content', () => {
    const renderTestCase = createSelectorTestCase(({ children }) => (
      <LineChart
        width={100}
        height={100}
        data={[
          { name: 'A', value: 1 },
          { name: 'B', value: 2 },
        ]}
      >
        <Line dataKey="value" />
        {children}
        <Tooltip />
      </LineChart>
    ));

    describe('when tooltip is displayed first time', () => {
      async function prime(container: Element) {
        await showTooltipOnCoordinate(container, lineChartMouseHoverTooltipSelector, {
          clientX: 20,
          clientY: 20,
        });
      }

      it('should select isActive: true', async () => {
        const { container, spy } = await renderTestCase(state =>
          selectIsTooltipActive(state, 'axis', 'hover', undefined),
        );
        expectLastCalledWith(spy, { activeIndex: null, isActive: false });
        await prime(container);
        expectLastCalledWith(spy, { activeIndex: '0', isActive: true });
      });

      it('should animate towards the final position', async () => {
        const { container } = await renderTestCase();
        await prime(container);

        await takeSnapshot();
      });

      it('should start at 0,0', async () => {
        const { container } = await renderTestCase();
        await prime(container);

        const tooltip = getTooltip(container);
        // toHaveStyle reads the computed style, which shows the in-progress transition. Check what the component set.
        expect(tooltip.style).toMatchObject({
          top: '0px',
          left: '0px',
          transform: 'translate(15px, 30px)',
          transition: 'transform 400ms',
        });
      });
    });

    describe('when tooltip hides, and then shows again', () => {
      async function prime(container: Element) {
        await expectTooltipNotVisible(container);
        await showTooltipOnCoordinate(container, lineChartMouseHoverTooltipSelector, {
          clientX: 20,
          clientY: 20,
        });
        await hideTooltip(container, lineChartMouseHoverTooltipSelector);
        await expectTooltipNotVisible(container);

        await showTooltipOnCoordinate(container, lineChartMouseHoverTooltipSelector, {
          clientX: 80,
          clientY: 80,
        });
        return getTooltip(container);
      }

      it('should animate towards the final position', async () => {
        const { container } = await renderTestCase();
        const tooltip = await prime(container);

        // The snapshot shows the final position, after the transition ends. It cannot show the transition itself.
        // toHaveStyle reads the computed style, which shows the in-progress transition. Check what the component set.
        expect(tooltip.style).toMatchObject({
          top: '0px',
          left: '0px',
          transition: 'transform 400ms',
        });
        await takeSnapshot();
      });
    });
  });

  describe('with custom content', () => {
    const MyCustomContent = () => <p>My Custom Content</p>;
    const renderTestCase = createSelectorTestCase(({ children }) => (
      <LineChart
        width={100}
        height={100}
        data={[
          { name: 'A', value: 1 },
          { name: 'B', value: 2 },
        ]}
      >
        <Line dataKey="value" />
        {children}
        <Tooltip content={MyCustomContent} />
      </LineChart>
    ));

    describe('when tooltip is displayed first time', () => {
      async function prime(container: Element) {
        await showTooltipOnCoordinate(container, lineChartMouseHoverTooltipSelector, {
          clientX: 20,
          clientY: 20,
        });
      }

      it('should select isActive: true', async () => {
        const { container, spy } = await renderTestCase(state =>
          selectIsTooltipActive(state, 'axis', 'hover', undefined),
        );
        expectLastCalledWith(spy, { activeIndex: null, isActive: false });
        await prime(container);
        expectLastCalledWith(spy, { activeIndex: '0', isActive: true });
      });

      it('should animate towards the final position', async () => {
        const { container } = await renderTestCase();
        await prime(container);

        await takeSnapshot();
      });

      it('should start at 0,0', async () => {
        const { container } = await renderTestCase();
        await prime(container);

        const tooltip = getTooltip(container);
        // toHaveStyle reads the computed style, which shows the in-progress transition. Check what the component set.
        expect(tooltip.style).toMatchObject({
          top: '0px',
          left: '0px',
          transform: 'translate(15px, 30px)',
          transition: 'transform 400ms',
        });
      });
    });

    describe('when tooltip hides, and then shows again', () => {
      async function prime(container: Element) {
        await expectTooltipNotVisible(container);
        await showTooltipOnCoordinate(container, lineChartMouseHoverTooltipSelector, {
          clientX: 20,
          clientY: 20,
        });
        await hideTooltip(container, lineChartMouseHoverTooltipSelector);
        await expectTooltipNotVisible(container);

        await showTooltipOnCoordinate(container, lineChartMouseHoverTooltipSelector, {
          clientX: 80,
          clientY: 80,
        });
        return getTooltip(container);
      }

      it('should animate towards the final position', async () => {
        const { container } = await renderTestCase();
        const tooltip = await prime(container);

        // The snapshot shows the final position, after the transition ends. It cannot show the transition itself.
        // toHaveStyle reads the computed style, which shows the in-progress transition. Check what the component set.
        expect(tooltip.style).toMatchObject({
          top: '0px',
          left: '0px',
          transition: 'transform 400ms',
        });
        await takeSnapshot();
      });
    });
  });
});
