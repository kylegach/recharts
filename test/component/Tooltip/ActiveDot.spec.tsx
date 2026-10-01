import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import {
  Area,
  AreaChart,
  ComposedChart,
  Line,
  LineChart,
  Radar,
  RadarChart,
  Tooltip,
  XAxis,
  YAxis,
} from '../../../src';
import { PageData } from '../../_data';
import { expectTooltipNotVisible, showTooltip } from '../../helper/browser/tooltipTestHelpers';
import {
  areaChartMouseHoverTooltipSelector,
  composedChartMouseHoverTooltipSelector,
  lineChartMouseHoverTooltipSelector,
  radarChartMouseHoverTooltipSelector,
} from './tooltipMouseHoverSelectors';
import { mockGetBoundingClientRect } from '../../helper/mockGetBoundingClientRect';
import { ActiveDotProps } from '../../../src/util/types';
import { assertNotNull } from '../../helper/assertNotNull';
import { fireEvent } from '../../helper/browser/syntheticEvents';

const commonChartProps = {
  width: 400,
  height: 400,
  data: PageData,
};

describe('ActiveDot', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 100, height: 100 });
  });

  describe('as a child of AreaChart', () => {
    it('should render default activeDot and give it props', async () => {
      const { container, debug } = await render(
        <AreaChart {...commonChartProps}>
          <Area dataKey="uv" />
          <Tooltip />
        </AreaChart>,
      );
      await expect.element(page.getByCSS('.recharts-active-dot')).not.toBeInTheDocument();
      const tooltipTrigger = await showTooltip(container, areaChartMouseHoverTooltipSelector, debug);
      const activeDot = container.querySelector('.recharts-active-dot');
      assertNotNull(activeDot);
      await expect.element(page.elementLocator(activeDot)).toBeVisible();
      expect(activeDot.getAttributeNames()).toEqual(['class']);
      await expect
        .element(page.elementLocator(activeDot))
        .toHaveAttribute('class', 'recharts-layer recharts-active-dot');

      const circle = activeDot.querySelector('circle');
      assertNotNull(circle);
      await expect.element(page.elementLocator(circle)).toBeVisible();
      expect(circle.getAttributeNames()).toEqual(['cx', 'cy', 'r', 'fill', 'stroke-width', 'stroke', 'class']);
      await expect.element(page.elementLocator(circle)).toHaveAttribute('class', 'recharts-dot');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('cx', '161');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('cy', '102.5');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('r', '4');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('fill', '#3182bd');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('stroke-width', '2');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('stroke', '#fff');

      await fireEvent.mouseOut(tooltipTrigger);
      // The active dot is removed on mouse out, and a locator cannot target a removed element, so check the element directly
      expect(activeDot).not.toBeVisible();
    });

    it('should clone custom Dot element and inject extra sneaky props', async () => {
      const { container, debug } = await render(
        <AreaChart {...commonChartProps}>
          <Area dataKey="uv" activeDot={<g data-testid="my-custom-dot" />} />
          <Tooltip />
        </AreaChart>,
      );
      await expect.element(page.getByCSS('.recharts-active-dot')).not.toBeInTheDocument();
      await expect.element(page.getByCSS('[data-testid="my-custom-dot"]')).not.toBeInTheDocument();
      const tooltipTrigger = await showTooltip(container, areaChartMouseHoverTooltipSelector, debug);
      const activeDot = container.querySelector('.recharts-active-dot');
      assertNotNull(activeDot);
      await expect.element(page.elementLocator(activeDot)).toBeVisible();
      expect(activeDot.getAttributeNames()).toEqual(['class']);
      await expect
        .element(page.elementLocator(activeDot))
        .toHaveAttribute('class', 'recharts-layer recharts-active-dot');

      const customElement = activeDot.querySelector('[data-testid="my-custom-dot"]');
      assertNotNull(customElement);
      await expect.element(page.elementLocator(customElement)).toBeVisible();
      expect(customElement.getAttributeNames()).toEqual([
        'data-testid',
        'index',
        'dataKey',
        'cx',
        'cy',
        'r',
        'fill',
        'stroke-width',
        'stroke',
        'payload',
        'value',
      ]);
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('data-testid', 'my-custom-dot');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('index', '2');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('dataKey', 'uv');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('cx', '161');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('cy', '102.5');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('r', '4');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('fill', '#3182bd');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('stroke-width', '2');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('stroke', '#fff');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('payload', '[object Object]'); // sic!
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('value', '0,300');

      await fireEvent.mouseOut(tooltipTrigger);
      await expect.element(page.getByCSS('.recharts-active-dot')).not.toBeInTheDocument();
    });

    it('should render custom Dot component, give it props, and render what it returned', async () => {
      const spy = vi.fn();
      const MyCustomDot = (props: unknown) => {
        spy(props);
        return <g data-testid="my-custom-dot" />;
      };
      const { container, debug } = await render(
        <AreaChart {...commonChartProps}>
          <Area dataKey="uv" activeDot={MyCustomDot} />
          <Tooltip />
        </AreaChart>,
      );
      expect(spy).toHaveBeenCalledTimes(0);
      await expect.element(page.getByCSS('.recharts-active-dot')).not.toBeInTheDocument();
      const tooltipTrigger = await showTooltip(container, areaChartMouseHoverTooltipSelector, debug);
      expect(spy).toHaveBeenCalledTimes(1);
      await expect.element(page.getByCSS('.recharts-active-dot')).toBeVisible();
      expect(spy).toHaveBeenCalledWith({
        cx: 161,
        cy: 102.5,
        dataKey: 'uv',
        fill: '#3182bd',
        index: 2,
        payload: {
          amt: 2400,
          name: 'Page C',
          pv: 1398,
          uv: 300,
        },
        r: 4,
        stroke: '#fff',
        strokeWidth: 2,
        value: [0, 300],
      });

      await fireEvent.mouseOut(tooltipTrigger);
      await expect.element(page.getByCSS('.recharts-active-dot')).not.toBeInTheDocument();
    });
  });

  describe('as a child of LineChart', () => {
    it('should render default activeDot and give it props', async () => {
      const { container, debug } = await render(
        <LineChart {...commonChartProps}>
          <Line dataKey="uv" />
          <Tooltip />
        </LineChart>,
      );
      await expect.element(page.getByCSS('.recharts-active-dot')).not.toBeInTheDocument();
      const tooltipTrigger = await showTooltip(container, lineChartMouseHoverTooltipSelector, debug);
      const activeDot = container.querySelector('.recharts-active-dot');
      assertNotNull(activeDot);
      await expect.element(page.elementLocator(activeDot)).toBeVisible();
      expect(activeDot.getAttributeNames()).toEqual(['class']);
      await expect
        .element(page.elementLocator(activeDot))
        .toHaveAttribute('class', 'recharts-layer recharts-active-dot');

      const circle = activeDot.querySelector('circle');
      assertNotNull(circle);
      await expect.element(page.elementLocator(circle)).toBeVisible();
      expect(circle.getAttributeNames()).toEqual(['cx', 'cy', 'r', 'fill', 'stroke-width', 'stroke', 'class']);
      await expect.element(page.elementLocator(circle)).toHaveAttribute('class', 'recharts-dot');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('cx', '161');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('cy', '102.5');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('r', '4');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('fill', '#3182bd');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('stroke-width', '2');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('stroke', '#fff');

      await fireEvent.mouseOut(tooltipTrigger);
      // The active dot is removed on mouse out, and a locator cannot target a removed element, so check the element directly
      expect(activeDot).not.toBeVisible();
    });

    it('should clone custom Dot element and inject extra sneaky props', async () => {
      const { container, debug } = await render(
        <LineChart {...commonChartProps}>
          <Line dataKey="uv" activeDot={<g data-testid="my-custom-dot" />} />
          <Tooltip />
        </LineChart>,
      );
      await expect.element(page.getByCSS('.recharts-active-dot')).not.toBeInTheDocument();
      await expect.element(page.getByCSS('[data-testid="my-custom-dot"]')).not.toBeInTheDocument();
      const tooltipTrigger = await showTooltip(container, lineChartMouseHoverTooltipSelector, debug);
      const activeDot = container.querySelector('.recharts-active-dot');
      assertNotNull(activeDot);
      await expect.element(page.elementLocator(activeDot)).toBeVisible();
      expect(activeDot.getAttributeNames()).toEqual(['class']);
      await expect
        .element(page.elementLocator(activeDot))
        .toHaveAttribute('class', 'recharts-layer recharts-active-dot');

      const customElement = activeDot.querySelector('[data-testid="my-custom-dot"]');
      assertNotNull(customElement);
      await expect.element(page.elementLocator(customElement)).toBeVisible();
      expect(customElement.getAttributeNames()).toEqual([
        'data-testid',
        'index',
        'dataKey',
        'cx',
        'cy',
        'r',
        'fill',
        'stroke-width',
        'stroke',
        'payload',
        'value',
      ]);
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('data-testid', 'my-custom-dot');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('index', '2');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('dataKey', 'uv');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('cx', '161');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('cy', '102.5');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('r', '4');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('fill', '#3182bd');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('stroke-width', '2');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('stroke', '#fff');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('payload', '[object Object]'); // sic!
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('value', '300');

      await fireEvent.mouseOut(tooltipTrigger);
      // The active dot is removed on mouse out, and a locator cannot target a removed element, so check the element directly
      expect(activeDot).not.toBeVisible();
    });

    it('should render custom Dot component, give it props, and render what it returned', async () => {
      const spy = vi.fn();
      const MyCustomDot = (props: unknown) => {
        spy(props);
        return <g data-testid="my-custom-dot" />;
      };
      const { container, debug } = await render(
        <LineChart {...commonChartProps}>
          <Line dataKey="uv" activeDot={MyCustomDot} />
          <Tooltip />
        </LineChart>,
      );
      expect(spy).toHaveBeenCalledTimes(0);
      await expect.element(page.getByCSS('.recharts-active-dot')).not.toBeInTheDocument();
      const tooltipTrigger = await showTooltip(container, lineChartMouseHoverTooltipSelector, debug);
      expect(spy).toHaveBeenCalledTimes(1);
      await expect.element(page.getByCSS('.recharts-active-dot')).toBeVisible();
      expect(spy).toHaveBeenCalledWith({
        cx: 161,
        cy: 102.5,
        dataKey: 'uv',
        fill: '#3182bd',
        index: 2,
        payload: {
          amt: 2400,
          name: 'Page C',
          pv: 1398,
          uv: 300,
        },
        r: 4,
        stroke: '#fff',
        strokeWidth: 2,
        value: 300,
      });

      await fireEvent.mouseOut(tooltipTrigger);
      await expect.element(page.getByCSS('.recharts-active-dot')).not.toBeInTheDocument();
    });
  });

  describe('LineChart domain visibility guard', () => {
    const domainTestData = [
      { x: 0.9, y: 10 },
      { x: 1.3, y: 12 },
    ];
    const chartMargin = { top: 20, right: 20, bottom: 20, left: 20 };

    it.each([true, false])(
      'should suppress active dot and tooltip when all data is outside the visible domain (allowDataOverflow=%s)',
      async allowDataOverflow => {
        const { container } = await render(
          <LineChart width={400} height={240} data={domainTestData} margin={chartMargin}>
            <XAxis dataKey="x" type="number" domain={[1.01, 1.15]} allowDataOverflow={allowDataOverflow} />
            <YAxis type="number" domain={[0, 20]} allowDataOverflow={allowDataOverflow} />
            <Tooltip />
            <Line dataKey="y" isAnimationActive={false} />
          </LineChart>,
        );

        await showTooltip(container, lineChartMouseHoverTooltipSelector);

        await expect.element(page.getByCSS('.recharts-active-dot')).not.toBeInTheDocument();
        await expect.element(page.getByCSS('.recharts-tooltip-cursor')).not.toBeInTheDocument();
        await expect.element(page.getByCSS('.recharts-tooltip-wrapper')).toBeInTheDocument();
        await expectTooltipNotVisible(container);
      },
    );
  });

  describe('as a child of ComposedChart with Line', () => {
    it('should render default activeDot and give it props', async () => {
      const { container, debug } = await render(
        <ComposedChart {...commonChartProps}>
          <Line dataKey="uv" />
          <Tooltip />
        </ComposedChart>,
      );
      await expect.element(page.getByCSS('.recharts-active-dot')).not.toBeInTheDocument();
      const tooltipTrigger = await showTooltip(container, composedChartMouseHoverTooltipSelector, debug);
      const activeDot = container.querySelector('.recharts-active-dot');
      assertNotNull(activeDot);
      await expect.element(page.elementLocator(activeDot)).toBeVisible();
      expect(activeDot.getAttributeNames()).toEqual(['class']);
      await expect
        .element(page.elementLocator(activeDot))
        .toHaveAttribute('class', 'recharts-layer recharts-active-dot');

      const circle = activeDot.querySelector('circle');
      assertNotNull(circle);
      await expect.element(page.elementLocator(circle)).toBeVisible();
      expect(circle.getAttributeNames()).toEqual(['cx', 'cy', 'r', 'fill', 'stroke-width', 'stroke', 'class']);
      await expect.element(page.elementLocator(circle)).toHaveAttribute('class', 'recharts-dot');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('cx', '161');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('cy', '102.5');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('r', '4');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('fill', '#3182bd');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('stroke-width', '2');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('stroke', '#fff');

      await fireEvent.mouseOut(tooltipTrigger);
      // The active dot is removed on mouse out, and a locator cannot target a removed element, so check the element directly
      expect(activeDot).not.toBeVisible();
    });

    it('should clone custom Dot element and inject extra sneaky props', async () => {
      const { container, debug } = await render(
        <ComposedChart {...commonChartProps}>
          <Line dataKey="uv" activeDot={<g data-testid="my-custom-dot" />} />
          <Tooltip />
        </ComposedChart>,
      );
      await expect.element(page.getByCSS('.recharts-active-dot')).not.toBeInTheDocument();
      await expect.element(page.getByCSS('[data-testid="my-custom-dot"]')).not.toBeInTheDocument();
      const tooltipTrigger = await showTooltip(container, composedChartMouseHoverTooltipSelector, debug);
      const activeDot = container.querySelector('.recharts-active-dot');
      assertNotNull(activeDot);
      await expect.element(page.elementLocator(activeDot)).toBeVisible();
      expect(activeDot.getAttributeNames()).toEqual(['class']);
      await expect
        .element(page.elementLocator(activeDot))
        .toHaveAttribute('class', 'recharts-layer recharts-active-dot');

      const customElement = activeDot.querySelector('[data-testid="my-custom-dot"]');
      assertNotNull(customElement);
      await expect.element(page.elementLocator(customElement)).toBeVisible();
      expect(customElement.getAttributeNames()).toEqual([
        'data-testid',
        'index',
        'dataKey',
        'cx',
        'cy',
        'r',
        'fill',
        'stroke-width',
        'stroke',
        'payload',
        'value',
      ]);
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('data-testid', 'my-custom-dot');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('index', '2');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('dataKey', 'uv');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('cx', '161');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('cy', '102.5');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('r', '4');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('fill', '#3182bd');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('stroke-width', '2');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('stroke', '#fff');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('payload', '[object Object]'); // sic!
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('value', '300');

      await fireEvent.mouseOut(tooltipTrigger);
      await expect.element(page.getByCSS('.recharts-active-dot')).not.toBeInTheDocument();
    });

    it('should render custom Dot component, give it props, and render what it returned', async () => {
      const spy = vi.fn();
      const MyCustomDot = (props: ActiveDotProps) => {
        spy(props);
        return <g data-testid="my-custom-dot" />;
      };
      const { container, debug } = await render(
        <ComposedChart {...commonChartProps}>
          <Line dataKey="uv" activeDot={MyCustomDot} />
          <Tooltip />
        </ComposedChart>,
      );
      expect(spy).toHaveBeenCalledTimes(0);
      await expect.element(page.getByCSS('.recharts-active-dot')).not.toBeInTheDocument();
      const tooltipTrigger = await showTooltip(container, composedChartMouseHoverTooltipSelector, debug);
      expect(spy).toHaveBeenCalledTimes(1);
      await expect.element(page.getByCSS('.recharts-active-dot')).toBeVisible();
      expect(spy).toHaveBeenCalledWith({
        cx: 161,
        cy: 102.5,
        dataKey: 'uv',
        fill: '#3182bd',
        index: 2,
        payload: {
          amt: 2400,
          name: 'Page C',
          pv: 1398,
          uv: 300,
        },
        r: 4,
        stroke: '#fff',
        strokeWidth: 2,
        value: 300,
      });

      await fireEvent.mouseOut(tooltipTrigger);
      await expect.element(page.getByCSS('.recharts-active-dot')).not.toBeInTheDocument();
    });
  });

  describe('as a child of RadarChart', () => {
    it('should render default activeDot and give it props', async () => {
      const { container, debug } = await render(
        <RadarChart height={600} width={600} data={PageData}>
          <Radar dataKey="uv" stroke="blue" fill="red" />
          <Tooltip />
        </RadarChart>,
      );
      await expect.element(page.getByCSS('.recharts-active-dot')).not.toBeInTheDocument();
      const tooltipTrigger = await showTooltip(container, radarChartMouseHoverTooltipSelector, debug);
      const activeDot = container.querySelector('.recharts-active-dot');
      assertNotNull(activeDot);
      await expect.element(page.elementLocator(activeDot)).toBeVisible();
      expect(activeDot.getAttributeNames()).toEqual(['class']);
      await expect
        .element(page.elementLocator(activeDot))
        .toHaveAttribute('class', 'recharts-layer recharts-active-dot');

      const circle = activeDot.querySelector('circle');
      assertNotNull(circle);
      await expect.element(page.elementLocator(circle)).toBeVisible();
      // Not sure why does Radar activeDot not have fill but for some reason it does not.
      expect(circle.getAttributeNames()).toEqual(['cx', 'cy', 'r', 'fill', 'stroke-width', 'stroke', 'class']);
      await expect.element(page.elementLocator(circle)).toHaveAttribute('class', 'recharts-dot');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('cx', '203.42950722399726');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('cy', '244.245');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('r', '4');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('fill', 'blue');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('stroke-width', '2');
      await expect.element(page.elementLocator(circle)).toHaveAttribute('stroke', '#fff');

      await fireEvent.mouseOut(tooltipTrigger);
      // The active dot is removed on mouse out, and a locator cannot target a removed element, so check the element directly
      expect(activeDot).not.toBeVisible();
    });

    it('should clone custom Dot element and inject extra sneaky props', async () => {
      const { container, debug } = await render(
        <RadarChart height={600} width={600} data={PageData}>
          <Radar dataKey="uv" activeDot={<g data-testid="my-custom-dot" />} stroke="blue" fill="red" />
          <Tooltip />
        </RadarChart>,
      );
      await expect.element(page.getByCSS('.recharts-active-dot')).not.toBeInTheDocument();
      await expect.element(page.getByCSS('[data-testid="my-custom-dot"]')).not.toBeInTheDocument();
      const tooltipTrigger = await showTooltip(container, radarChartMouseHoverTooltipSelector, debug);
      const activeDot = container.querySelector('.recharts-active-dot');
      assertNotNull(activeDot);
      await expect.element(page.elementLocator(activeDot)).toBeVisible();
      expect(activeDot.getAttributeNames()).toEqual(['class']);
      await expect
        .element(page.elementLocator(activeDot))
        .toHaveAttribute('class', 'recharts-layer recharts-active-dot');

      const customElement = activeDot.querySelector('[data-testid="my-custom-dot"]');
      assertNotNull(customElement);
      await expect.element(page.elementLocator(customElement)).toBeVisible();
      expect(customElement.getAttributeNames()).toEqual([
        'data-testid',
        'index',
        'dataKey',
        'cx',
        'cy',
        'r',
        'fill',
        'stroke-width',
        'stroke',
        'payload',
        'value',
      ]);
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('data-testid', 'my-custom-dot');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('index', '5');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('dataKey', 'uv');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('cx', '203.42950722399726');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('cy', '244.245');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('r', '4');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('fill', 'blue');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('stroke-width', '2');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('stroke', '#fff');
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('payload', '[object Object]'); // sic!
      await expect.element(page.elementLocator(customElement)).toHaveAttribute('value', '189');

      await fireEvent.mouseOut(tooltipTrigger);
      // The active dot is removed on mouse out, and a locator cannot target a removed element, so check the element directly
      expect(activeDot).not.toBeVisible();
    });

    it('should render custom Dot component, give it props, and render what it returned', async () => {
      const spy = vi.fn();
      const MyCustomDot = (props: unknown) => {
        spy(props);
        return <g data-testid="my-custom-dot" />;
      };
      const { container, debug } = await render(
        <RadarChart height={600} width={600} data={PageData}>
          <Radar dataKey="uv" activeDot={MyCustomDot} stroke="blue" fill="red" />
          <Tooltip />
        </RadarChart>,
      );
      expect(spy).toHaveBeenCalledTimes(0);
      await expect.element(page.getByCSS('.recharts-active-dot')).not.toBeInTheDocument();
      const tooltipTrigger = await showTooltip(container, radarChartMouseHoverTooltipSelector, debug);
      expect(spy).toHaveBeenCalledTimes(1);
      await expect.element(page.getByCSS('.recharts-active-dot')).toBeVisible();
      expect(spy).toHaveBeenCalledWith({
        cx: 203.42950722399726,
        cy: 244.245,
        dataKey: 'uv',
        index: 5,
        payload: {
          amt: 2400,
          name: 'Page F',
          pv: 4800,
          uv: 189,
        },
        r: 4,
        stroke: '#fff',
        strokeWidth: 2,
        value: 189,
        fill: 'blue',
      });

      await fireEvent.mouseOut(tooltipTrigger);
      await expect.element(page.getByCSS('.recharts-active-dot')).not.toBeInTheDocument();
    });
  });
});
