import React, { ComponentType, ReactNode, useState } from 'react';
import { beforeEach, describe, expect, it, test } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  ComposedChart,
  DefaultZIndexes,
  Funnel,
  FunnelChart,
  Legend,
  Line,
  LineChart,
  LineDrawShape,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  Sankey,
  Scatter,
  ScatterChart,
  SunburstChart,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from '../../../src';
import { mockGetBoundingClientRect } from '../../helper/mockGetBoundingClientRect';
import { exampleSankeyData, exampleSunburstData, exampleTreemapData, PageData } from '../../_data';
import {
  expectTooltipNotVisible,
  getTooltip,
  MouseCoordinate,
  showTooltip,
  showTooltipOnCoordinate,
  showTooltipOnCoordinateTouch,
} from '../../helper/browser/tooltipTestHelpers';
import { fireEvent } from '../../helper/browser/syntheticEvents';
import { act, flushPendingFrames } from '../../helper/browser/act';
import {
  areaChartMouseHoverTooltipSelector,
  barChartMouseHoverTooltipSelector,
  composedChartMouseHoverTooltipSelector,
  funnelChartMouseHoverTooltipSelector,
  lineChartMouseHoverTooltipSelector,
  MouseHoverTooltipTriggerSelector,
  pieChartMouseHoverTooltipSelector,
  radarChartMouseHoverTooltipSelector,
  radialBarChartMouseHoverTooltipSelector,
  sankeyNodeMouseHoverTooltipSelector,
  scatterChartMouseHoverTooltipSelector,
  sunburstChartMouseHoverTooltipSelector,
  treemapNodeChartMouseHoverTooltipSelector,
} from './tooltipMouseHoverSelectors';
import { createSelectorTestCase } from '../../helper/browser/createSelectorTestCase';
import { expectScreenshot, expectTooltipScreenshot } from '../../helper/browser/screenshot';
import {
  selectTooltipAxisDomain,
  selectTooltipAxisDomainIncludingNiceTicks,
  selectTooltipAxisRangeWithReverse,
  selectTooltipAxisRealScaleType,
  selectTooltipAxisScale,
  selectTooltipAxisTicks,
  selectTooltipCategoricalDomain,
} from '../../../src/state/selectors/tooltipSelectors';
import { selectChartDataWithIndexes } from '../../../src/state/selectors/dataSelectors';
import {
  selectActiveCoordinate,
  selectActiveLabel,
  selectIsTooltipActive,
} from '../../../src/state/selectors/selectors';
import { expectLastCalledWithScale } from '../../helper/expectScale';
import { selectChartLayout } from '../../../src/context/chartLayoutContext';
import { TooltipIndex, TooltipState } from '../../../src/state/tooltipSlice';
import { selectTooltipState } from '../../../src/state/selectors/selectTooltipState';
import { selectChartOffsetInternal } from '../../../src/state/selectors/selectChartOffsetInternal';
import {
  selectLegendPayload,
  selectLegendSettings,
  selectLegendSize,
} from '../../../src/state/selectors/legendSelectors';
import { mockTouchingElement } from '../../helper/mockTouchingElement';
import { assertNotNull } from '../../helper/assertNotNull';
import { LegendSettings } from '../../../src/state/legendSlice';
import { selectTooltipAxisId } from '../../../src/state/selectors/selectTooltipAxisId';
import { selectTooltipAxisType } from '../../../src/state/selectors/selectTooltipAxisType';
import { expectLastCalledWith } from '../../helper/expectLastCalledWith';
import { selectTooltipAxis } from '../../../src/state/selectors/axisSelectors';
import { noop } from '../../../src/util/DataUtils';

type TooltipVisibilityTestCase = {
  // For identifying which test is running
  name: string;
  mouseHoverSelector: MouseHoverTooltipTriggerSelector;
  mouseCoordinate?: MouseCoordinate;
  Wrapper: ComponentType<{ children: ReactNode }>;
  tooltipIndex: NonNullable<TooltipIndex>;
};

const commonChartProps = {
  throttledEvents: [],
  width: 400,
  height: 400,
  data: PageData,
};

const AreaChartTestCase: TooltipVisibilityTestCase = {
  name: 'AreaChart',
  Wrapper: ({ children }) => (
    <AreaChart {...commonChartProps}>
      <Area dataKey="uv" id="my-item-id" />
      {children}
    </AreaChart>
  ),
  mouseHoverSelector: areaChartMouseHoverTooltipSelector,
  tooltipIndex: '0',
};

const BarChartTestCase: TooltipVisibilityTestCase = {
  name: 'BarChart',
  Wrapper: ({ children }) => (
    <BarChart {...commonChartProps}>
      <Bar dataKey="uv" id="my-item-id" />
      {children}
    </BarChart>
  ),
  mouseHoverSelector: barChartMouseHoverTooltipSelector,
  tooltipIndex: '0',
};

const LineChartHorizontalTestCase: TooltipVisibilityTestCase = {
  name: 'horizontal LineChart',
  Wrapper: ({ children }) => (
    <LineChart {...commonChartProps}>
      <XAxis dataKey="name" />
      <YAxis />
      <CartesianGrid strokeDasharray="3 3" />
      {children}
      <Legend />
      <Line type="monotone" dataKey="uv" stroke="#82ca9d" id="my-item-id" />
    </LineChart>
  ),
  mouseHoverSelector: lineChartMouseHoverTooltipSelector,
  tooltipIndex: '0',
};

const LineChartVerticalTestCase: TooltipVisibilityTestCase = {
  name: 'vertical LineChart',
  Wrapper: ({ children }) => (
    <LineChart
      layout="vertical"
      {...commonChartProps}
      margin={{
        top: 20,
        right: 30,
        left: 20,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis type="number" />
      <YAxis dataKey="name" type="category" />
      {children}
      <Legend />
      <Line dataKey="uv" stroke="#82ca9d" id="my-item-id" />
    </LineChart>
  ),
  mouseHoverSelector: lineChartMouseHoverTooltipSelector,
  tooltipIndex: '0',
};

const ComposedChartWithAreaTestCase: TooltipVisibilityTestCase = {
  name: 'ComposedChart with Area',
  Wrapper: ({ children }) => (
    <ComposedChart {...commonChartProps}>
      <XAxis dataKey="name" type="category" />
      <YAxis dataKey="uv" />
      {children}
      <Area dataKey="pv" id="my-item-id" />
    </ComposedChart>
  ),
  mouseHoverSelector: composedChartMouseHoverTooltipSelector,
  tooltipIndex: '0',
};

const ComposedChartWithBarTestCase: TooltipVisibilityTestCase = {
  name: 'ComposedChart with Bar',
  Wrapper: ({ children }) => (
    <ComposedChart {...commonChartProps}>
      <XAxis dataKey="name" type="category" />
      <YAxis dataKey="uv" />
      {children}
      <Bar dataKey="amt" id="my-item-id" />
    </ComposedChart>
  ),
  mouseHoverSelector: composedChartMouseHoverTooltipSelector,
  tooltipIndex: '0',
};

const ComposedChartWithLineTestCase: TooltipVisibilityTestCase = {
  name: 'ComposedChart with Line',
  Wrapper: ({ children }) => (
    <ComposedChart {...commonChartProps}>
      <XAxis dataKey="name" type="category" />
      <YAxis dataKey="amt" />
      {children}
      <Line dataKey="pv" id="my-item-id" />
    </ComposedChart>
  ),
  mouseHoverSelector: composedChartMouseHoverTooltipSelector,
  tooltipIndex: '0',
};

const FunnelChartTestCase: TooltipVisibilityTestCase = {
  name: 'FunnelChart',
  Wrapper: ({ children }) => (
    <FunnelChart width={700} height={500} throttledEvents={[]}>
      <Funnel isAnimationActive={false} dataKey="uv" nameKey="name" data={PageData} id="my-item-id" />
      {children}
    </FunnelChart>
  ),
  mouseHoverSelector: funnelChartMouseHoverTooltipSelector,
  tooltipIndex: '0',
};

const PieChartTestCase: TooltipVisibilityTestCase = {
  name: 'PieChart',
  Wrapper: ({ children }) => (
    <PieChart height={400} width={400}>
      <Pie data={PageData} isAnimationActive={false} dataKey="uv" nameKey="name" cx={200} cy={200} id="my-item-id" />
      {children}
    </PieChart>
  ),
  mouseHoverSelector: pieChartMouseHoverTooltipSelector,
  tooltipIndex: '0',
};

const RadarChartTestCase: TooltipVisibilityTestCase = {
  name: 'RadarChart',
  Wrapper: ({ children }) => (
    <RadarChart height={600} width={600} data={PageData} throttledEvents={[]}>
      <PolarGrid />
      <PolarAngleAxis dataKey="name" />
      <PolarRadiusAxis />
      <Radar name="Mike" dataKey="uv" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} id="my-item-id" />
      {children}
    </RadarChart>
  ),
  mouseHoverSelector: radarChartMouseHoverTooltipSelector,
  tooltipIndex: '0',
};

const RadialBarChartTestCase: TooltipVisibilityTestCase = {
  name: 'RadialBarChart',
  Wrapper: ({ children }) => (
    <RadialBarChart height={600} width={600} data={PageData} throttledEvents={[]}>
      <PolarGrid />
      <PolarAngleAxis />
      <PolarRadiusAxis dataKey="name" />
      <RadialBar name="Mike" dataKey="uv" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} id="my-item-id" />
      {children}
    </RadialBarChart>
  ),
  mouseHoverSelector: radialBarChartMouseHoverTooltipSelector,
  tooltipIndex: '0',
};

const SankeyTestCase: TooltipVisibilityTestCase = {
  name: 'Sankey',
  Wrapper: ({ children }) => (
    <Sankey
      width={400}
      height={400}
      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      data={exampleSankeyData}
      throttledEvents={[]}
    >
      {children}
    </Sankey>
  ),
  mouseHoverSelector: sankeyNodeMouseHoverTooltipSelector,
  tooltipIndex: '0',
};

const ScatterChartTestCase: TooltipVisibilityTestCase = {
  name: 'ScatterChart',
  Wrapper: ({ children }) => (
    <ScatterChart width={400} height={400} margin={{ top: 20, right: 20, bottom: 20, left: 20 }} throttledEvents={[]}>
      <XAxis dataKey="uv" name="stature" unit="cm" />
      <YAxis dataKey="pv" name="weight" unit="kg" />
      <Scatter line name="A school" data={PageData} fill="#ff7300" id="my-item-id" />
      {children}
    </ScatterChart>
  ),
  mouseHoverSelector: scatterChartMouseHoverTooltipSelector,
  tooltipIndex: '0',
};

const SunburstChartTestCase: TooltipVisibilityTestCase = {
  name: 'SunburstChart',
  Wrapper: ({ children }) => (
    <SunburstChart width={400} height={400} data={exampleSunburstData} throttledEvents={[]}>
      {children}
    </SunburstChart>
  ),
  mouseHoverSelector: sunburstChartMouseHoverTooltipSelector,
  tooltipIndex: '0',
};

const TreemapTestCase: TooltipVisibilityTestCase = {
  name: 'Treemap',
  Wrapper: ({ children }) => (
    <Treemap
      width={400}
      height={400}
      data={exampleTreemapData}
      isAnimationActive={false}
      nameKey="name"
      dataKey="value"
      throttledEvents={[]}
    >
      {children}
    </Treemap>
  ),
  mouseHoverSelector: treemapNodeChartMouseHoverTooltipSelector,
  tooltipIndex: 'children[0]children[0]',
};

const testCases: ReadonlyArray<TooltipVisibilityTestCase> = [
  AreaChartTestCase,
  BarChartTestCase,
  LineChartHorizontalTestCase,
  LineChartVerticalTestCase,
  ComposedChartWithAreaTestCase,
  ComposedChartWithBarTestCase,
  ComposedChartWithLineTestCase,
  FunnelChartTestCase,
  PieChartTestCase,
  RadarChartTestCase,
  RadialBarChartTestCase,
  SankeyTestCase,
  ScatterChartTestCase,
  SunburstChartTestCase,
  TreemapTestCase,
];

describe('Tooltip visibility', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 100, height: 100 });
  });

  describe.each(testCases)('as a child of $name', ({ name, Wrapper, mouseHoverSelector, tooltipIndex }) => {
    test('Without an event, the tooltip wrapper is rendered but not visible', async () => {
      const { container } = await render(
        <Wrapper>
          <Tooltip />
        </Wrapper>,
      );

      const wrapper = page.elementLocator(getTooltip(container));
      await expect.element(wrapper).toBeInTheDocument();
      await expect.element(wrapper).not.toBeVisible();
    });

    test('No content is rendered without an explicit event', async () => {
      await render(
        <Wrapper>
          <Tooltip />
        </Wrapper>,
      );

      await expect.element(page.getByCSS('.recharts-tooltip-item-name')).not.toBeInTheDocument();
      await expect.element(page.getByCSS('.recharts-tooltip-item-value')).not.toBeInTheDocument();
    });

    test(`Mouse over element ${mouseHoverSelector} renders content`, async () => {
      const { container, debug } = await render(
        <Wrapper>
          <Tooltip />
        </Wrapper>,
      );

      await showTooltip(container, mouseHoverSelector, debug);

      await expectTooltipScreenshot(container);
    });

    test('Should move when the mouse moves', async () => {
      mockGetBoundingClientRect({
        width: 10,
        height: 10,
      });
      const { container } = await render(
        <Wrapper>
          <Tooltip />
        </Wrapper>,
      );

      const tooltipTriggerElement = await showTooltip(container, mouseHoverSelector);

      await expectScreenshot(container);

      await fireEvent.mouseMove(tooltipTriggerElement, { clientX: 201, clientY: 201 });

      await flushPendingFrames();

      await expectScreenshot(container);
    });

    it(`should move tooltip onTouchMove with active tooltip index ${tooltipIndex}`, async context => {
      // TODO: these charts currently do not work onTouchMove. Did they before?
      // This is because these are set via item rather than axis. The middleware currently only sets axis coordinates.
      if (name === 'SunburstChart' || name === 'FunnelChart' || name === 'Sankey' || name === 'ScatterChart') {
        context.skip();
      }

      mockTouchingElement(tooltipIndex, 'my-item-id');

      mockGetBoundingClientRect({
        width: 10,
        height: 10,
      });
      const { container } = await render(
        <Wrapper>
          <Tooltip />
        </Wrapper>,
      );

      await showTooltipOnCoordinateTouch(container, mouseHoverSelector, {
        clientX: 200,
        clientY: 200,
      });

      await expectScreenshot(container);

      await showTooltipOnCoordinateTouch(container, mouseHoverSelector, {
        clientX: 201,
        clientY: 201,
      });

      await expectScreenshot(container);
    });

    it('should render customized tooltip when content is set to be a react element', async () => {
      const Customized = () => {
        return <div className="customized" />;
      };
      const { container } = await render(
        <Wrapper>
          <Tooltip content={<Customized />} />
        </Wrapper>,
      );

      await showTooltip(container, mouseHoverSelector);

      await expect.element(page.getByCSS('.customized')).toBeInTheDocument();
    });

    describe('portal prop', () => {
      it('should render outside of SVG, as a direct child of recharts-wrapper by default', async () => {
        const { container } = await render(
          <Wrapper>
            <Tooltip />
          </Wrapper>,
        );
        await showTooltip(container, mouseHoverSelector);

        await expect.element(page.getByCSS('.recharts-wrapper svg .recharts-tooltip-wrapper')).not.toBeInTheDocument();
        await expect.element(page.getByCSS('.recharts-wrapper > .recharts-tooltip-wrapper')).toBeVisible();
      });

      it('should render in a custom portal if "portal" prop is set', async () => {
        function Example() {
          const [portalRef, setPortalRef] = useState<HTMLElement | null>(null);

          return (
            <>
              <Wrapper>
                <Tooltip portal={portalRef} />
              </Wrapper>
              <div
                data-testid="my-custom-portal-target"
                ref={node => {
                  if (portalRef == null && node != null) {
                    setPortalRef(node);
                  }
                }}
              />
            </>
          );
        }
        const { container } = await render(<Example />);
        await showTooltip(container, mouseHoverSelector);

        await expect.element(page.getByCSS('.recharts-wrapper .recharts-tooltip-wrapper')).not.toBeInTheDocument();
        await expect
          .element(page.getByCSS('[data-testid="my-custom-portal-target"] > .recharts-tooltip-wrapper'))
          .toBeVisible();
      });

      it('should keep custom portal visible when active is true after mouseOut, should no longer have absolute styles', async () => {
        function Example() {
          const [portalRef, setPortalRef] = useState<HTMLElement | null>(null);

          return (
            <>
              <Wrapper>
                <Tooltip portal={portalRef} active />
              </Wrapper>
              <div
                data-testid="my-custom-portal-target"
                ref={node => {
                  if (portalRef == null && node != null) {
                    setPortalRef(node);
                  }
                }}
              />
            </>
          );
        }
        const { container } = await render(<Example />);
        await showTooltip(container, mouseHoverSelector);

        await expectScreenshot(container);

        await fireEvent.mouseLeave(container);

        await expectScreenshot(container);

        await expect
          .element(page.getByCSS('[data-testid="my-custom-portal-target"] > .recharts-tooltip-wrapper'))
          .toBeVisible();
      });
    });

    describe('active prop', () => {
      test('with active=true it should render tooltip even after moving the mouse out of the chart.', async () => {
        const { container } = await render(
          <Wrapper>
            <Tooltip active />
          </Wrapper>,
        );

        const tooltip = page.elementLocator(getTooltip(container));
        await expect.element(tooltip).not.toBeVisible();

        await showTooltip(container, mouseHoverSelector);

        await expectTooltipScreenshot(container);

        const tooltipTriggerElementAfterHover = container.querySelector(mouseHoverSelector);
        assertNotNull(tooltipTriggerElementAfterHover);
        await fireEvent.mouseOut(tooltipTriggerElementAfterHover);
        await act(() => {
          vi.runAllTimers();
        });

        // Still visible after moving out of the chart, because active is true.
        await expectTooltipScreenshot(container);
      });

      test('with active=false it should never render tooltip', async () => {
        const { container } = await render(
          <Wrapper>
            <Tooltip active={false} />
          </Wrapper>,
        );

        const tooltip = page.elementLocator(getTooltip(container));
        await expect.element(tooltip).not.toBeVisible();

        await showTooltip(container, mouseHoverSelector);

        await expect.element(tooltip).not.toBeVisible();

        const tooltipTriggerElementAfterHover = container.querySelector(mouseHoverSelector);
        assertNotNull(tooltipTriggerElementAfterHover);
        await fireEvent.mouseOut(tooltipTriggerElementAfterHover);
        await act(() => {
          vi.runAllTimers();
        });

        await expect.element(tooltip).not.toBeVisible();
      });

      test('with active=undefined it should render the Tooltip only while in the chart', async () => {
        const { container } = await render(
          <Wrapper>
            <Tooltip />
          </Wrapper>,
        );

        const tooltip = page.elementLocator(getTooltip(container));
        await expect.element(tooltip).not.toBeVisible();

        await showTooltip(container, mouseHoverSelector);

        await expectTooltipScreenshot(container);

        const tooltipTriggerElementAfterHover = container.querySelector(mouseHoverSelector);
        assertNotNull(tooltipTriggerElementAfterHover);
        await fireEvent.mouseOut(tooltipTriggerElementAfterHover);
        await act(() => {
          vi.runAllTimers();
        });

        await expect.element(tooltip).not.toBeVisible();
      });
    });

    describe('defaultIndex prop', () => {
      it('should show tooltip from the beginning if defaultIndex is set to a valid value', async context => {
        if (name === 'Sankey') {
          /*
           * Sankey chart won't work with numerical indexes and it will need a different format
           */
          context.skip();
        }
        const { container } = await render(
          <Wrapper>
            <Tooltip defaultIndex={tooltipIndex} />
          </Wrapper>,
        );

        const tooltip = page.elementLocator(getTooltip(container));

        // Tooltip should be visible, since defaultIndex was set
        await expectTooltipScreenshot(container);

        const tooltipTriggerElement = await showTooltip(container, mouseHoverSelector);

        // Tooltip should be able to move when the mouse moves over the chart
        await expectTooltipScreenshot(container);

        await fireEvent.mouseOver(tooltipTriggerElement, { clientX: 350, clientY: 200 });

        // Tooltip should be able to move when the mouse moves over the chart
        await expectTooltipScreenshot(container);

        const tooltipTriggerElementAfterHover = container.querySelector(mouseHoverSelector);
        assertNotNull(tooltipTriggerElementAfterHover);
        await fireEvent.mouseOut(tooltipTriggerElementAfterHover);
        await act(() => {
          vi.runAllTimers();
        });

        // Since active is false, the tooltip can be dismissed by mousing out
        await expect.element(tooltip).not.toBeVisible();
      });

      it('should ignore invalid defaultIndex value', async () => {
        const { container } = await render(
          <Wrapper>
            <Tooltip defaultIndex={NaN} />
          </Wrapper>,
        );

        const tooltip = page.elementLocator(getTooltip(container));
        await expect.element(tooltip).toBeInTheDocument();
        await expect.element(tooltip).not.toBeVisible();
      });

      it('should show the last item when defaultIndex is same or larger than the data.length', async context => {
        if (name === 'FunnelChart') {
          // FunnelChart throws an error when called with defaultIndex
          context.skip();
        }
        if (name === 'Sankey') {
          /*
           * Sankey chart does not support numeric tooltip indexes
           */
          context.skip();
        }
        if (name === 'Treemap') {
          /*
           * Treemap chart does not support numeric tooltip indexes
           */
          context.skip();
        }
        if (name === 'SunburstChart') {
          /*
           * SunburstChart does not support numeric tooltip indexes
           */
          context.skip();
        }
        const { container } = await render(
          <Wrapper>
            <Tooltip defaultIndex={commonChartProps.data.length} />
          </Wrapper>,
        );

        await expectTooltipScreenshot(container);
      });
    });
  });

  describe(`as a child of vertical LineChart`, () => {
    const renderTestCase = createSelectorTestCase(({ children }) => (
      <LineChartVerticalTestCase.Wrapper>
        <Tooltip />
        {children}
      </LineChartVerticalTestCase.Wrapper>
    ));

    it('should select chart layout', async () => {
      const { spy } = await renderTestCase(selectChartLayout);
      expectLastCalledWith(spy, 'vertical');
    });

    it('should select chart offset', async () => {
      const { spy } = await renderTestCase(selectChartOffsetInternal);
      expectLastCalledWith(spy, {
        bottom: 135,
        brushBottom: 35,
        height: 245,
        left: 80,
        right: 30,
        top: 20,
        width: 290,
      });
    });

    it('should select legend settings', async () => {
      const { spy } = await renderTestCase(selectLegendSettings);
      const expected: LegendSettings = {
        align: 'center',
        itemSorter: 'value',
        layout: 'horizontal',
        verticalAlign: 'bottom',
        offset: 0,
        position: undefined,
      };
      expectLastCalledWith(spy, expected);
    });

    it('should select legend size', async () => {
      const { spy } = await renderTestCase(selectLegendSize);
      expectLastCalledWith(spy, {
        height: 100,
        width: 100,
      });
    });

    it('should select legend payload', async () => {
      const { spy } = await renderTestCase(selectLegendPayload);
      expectLastCalledWith(spy, [
        {
          color: '#82ca9d',
          dataKey: 'uv',
          inactive: false,
          payload: {
            activeDot: true,
            animateNewValues: true,
            animationBegin: 0,
            animationDuration: 1500,
            animationEasing: 'ease',
            animationInterpolateFn: expect.any(Function),
            animationMatchBy: 'index',
            connectNulls: false,
            dataKey: 'uv',
            dot: true,
            fill: '#fff',
            hide: false,
            id: 'my-item-id',
            isAnimationActive: 'auto',
            label: false,
            legendType: 'line',
            shape: LineDrawShape,
            stroke: '#82ca9d',
            strokeWidth: 1,
            type: 'linear',
            xAxisId: 0,
            yAxisId: 0,
            zIndex: DefaultZIndexes.line,
          },
          type: 'line',
          value: 'uv',
        },
      ]);
    });

    it('should select tooltip axis type', async () => {
      const { spy } = await renderTestCase(selectTooltipAxisType);
      expectLastCalledWith(spy, 'yAxis');
    });

    it('should select tooltip axis ID', async () => {
      const { spy } = await renderTestCase(selectTooltipAxisId);
      expectLastCalledWith(spy, 0);
    });

    it('should select dataStartIndex and dataEndIndex', async () => {
      const { spy } = await renderTestCase(selectChartDataWithIndexes);
      expectLastCalledWith(spy, {
        chartData: [
          {
            amt: 2400,
            name: 'Page A',
            pv: 2400,
            uv: 400,
          },
          {
            amt: 2400,
            name: 'Page B',
            pv: 4567,
            uv: 300,
          },
          {
            amt: 2400,
            name: 'Page C',
            pv: 1398,
            uv: 300,
          },
          {
            amt: 2400,
            name: 'Page D',
            pv: 9800,
            uv: 200,
          },
          {
            amt: 2400,
            name: 'Page E',
            pv: 3908,
            uv: 278,
          },
          {
            amt: 2400,
            name: 'Page F',
            pv: 4800,
            uv: 189,
          },
        ],
        computedData: undefined,
        dataEndIndex: 5,
        dataStartIndex: 0,
      });
    });

    it('should select active label', async () => {
      const { spy } = await renderTestCase(state => selectActiveLabel(state, 'axis', 'hover', '2'));
      expectLastCalledWith(spy, 'Page C');
    });

    it('should select active coordinate', async () => {
      const { container, spy } = await renderTestCase(state =>
        selectActiveCoordinate(state, 'axis', 'hover', undefined),
      );
      expectLastCalledWith(spy, undefined);
      expect(spy).toHaveBeenCalledTimes(1);

      await showTooltipOnCoordinate(
        container,
        LineChartVerticalTestCase.mouseHoverSelector,
        LineChartVerticalTestCase.mouseCoordinate,
      );

      expectLastCalledWith(spy, {
        x: 200,
        y: 216,
      });
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('should select tooltip axis range', async () => {
      const { spy } = await renderTestCase(selectTooltipAxisRangeWithReverse);
      expectLastCalledWith(spy, [20, 265]);
    });

    it('should select tooltip axis scale', async () => {
      const { spy } = await renderTestCase(selectTooltipAxisScale);
      expectLastCalledWithScale(spy, {
        domain: ['Page A', 'Page B', 'Page C', 'Page D', 'Page E', 'Page F'],
        range: [20, 265],
      });
    });

    it('should select categorical domain', async () => {
      const { spy } = await renderTestCase(selectTooltipCategoricalDomain);
      expectLastCalledWith(spy, undefined);
    });

    it('should select tooltip axis ticks', async () => {
      const { spy } = await renderTestCase(selectTooltipAxisTicks);

      expectLastCalledWith(spy, [
        {
          coordinate: 20,
          index: 0,
          offset: 0,
          value: 'Page A',
        },
        {
          coordinate: 69,
          index: 1,
          offset: 0,
          value: 'Page B',
        },
        {
          coordinate: 118,
          index: 2,
          offset: 0,
          value: 'Page C',
        },
        {
          coordinate: 167,
          index: 3,
          offset: 0,
          value: 'Page D',
        },
        {
          coordinate: 216,
          index: 4,
          offset: 0,
          value: 'Page E',
        },
        {
          coordinate: 265,
          index: 5,
          offset: 0,
          value: 'Page F',
        },
      ]);
    });

    it('should select isActive and activeIndex, and update it after mouse hover', async () => {
      const { container, spy } = await renderTestCase(state =>
        selectIsTooltipActive(state, 'axis', 'hover', undefined),
      );
      expectLastCalledWith(spy, {
        activeIndex: null,
        isActive: false,
      });
      expect(spy).toHaveBeenCalledTimes(3);

      await showTooltipOnCoordinate(
        container,
        LineChartVerticalTestCase.mouseHoverSelector,
        LineChartVerticalTestCase.mouseCoordinate,
      );

      expectLastCalledWith(spy, {
        activeIndex: '4',
        isActive: true,
      });
      expect(spy).toHaveBeenCalledTimes(4);
    });
  });

  describe('as a child of RadarChart', () => {
    const renderTestCase = createSelectorTestCase(({ children }) => (
      <RadarChartTestCase.Wrapper>
        <Tooltip />
        {children}
      </RadarChartTestCase.Wrapper>
    ));

    it('should select tooltip axis type', async () => {
      const { spy } = await renderTestCase(selectTooltipAxisType);
      expectLastCalledWith(spy, 'angleAxis');
    });

    it('should select tooltip axis ID', async () => {
      const { spy } = await renderTestCase(selectTooltipAxisId);
      expectLastCalledWith(spy, 0);
    });

    it('should select tooltip axis settings', async () => {
      const { spy } = await renderTestCase(selectTooltipAxis);
      expectLastCalledWith(spy, {
        allowDataOverflow: false,
        allowDecimals: false,
        allowDuplicatedCategory: false,
        dataKey: 'name',
        domain: undefined,
        id: 0,
        includeHidden: false,
        name: undefined,
        reversed: false,
        niceTicks: 'auto',
        scale: 'auto',
        tick: true,
        tickCount: undefined,
        ticks: undefined,
        type: 'category',
        unit: undefined,
      });
    });

    it('should select tooltip axis range', async () => {
      const { spy } = await renderTestCase(selectTooltipAxisRangeWithReverse);
      expectLastCalledWith(spy, [90, -270]);
    });

    it('should select tooltip axis scale', async () => {
      const { spy } = await renderTestCase(selectTooltipAxisScale);
      expectLastCalledWithScale(spy, {
        domain: ['Page A', 'Page B', 'Page C', 'Page D', 'Page E', 'Page F'],
        range: [-270, 90],
      });
    });

    it('should select tooltip axis ticks', async () => {
      const { spy } = await renderTestCase(selectTooltipAxisTicks);
      expectLastCalledWith(spy, [
        {
          coordinate: 90,
          index: 0,
          offset: 60,
          value: 'Page A',
        },
        {
          coordinate: 30,
          index: 1,
          offset: 60,
          value: 'Page B',
        },
        {
          coordinate: -30,
          index: 2,
          offset: 60,
          value: 'Page C',
        },
        {
          coordinate: -90,
          index: 3,
          offset: 60,
          value: 'Page D',
        },
        {
          coordinate: -150,
          index: 4,
          offset: 60,
          value: 'Page E',
        },
        {
          coordinate: -210,
          index: 5,
          offset: 60,
          value: 'Page F',
        },
      ]);
    });

    it('should select tooltip state before & after hover', async () => {
      const { container, spy } = await renderTestCase(selectTooltipState);

      const expectedBeforeHover: TooltipState = {
        axisInteraction: {
          click: {
            active: false,
            dataKey: undefined,
            index: null,
            coordinate: undefined,
            graphicalItemId: undefined,
          },
          hover: {
            active: false,
            dataKey: undefined,
            index: null,
            coordinate: undefined,
            graphicalItemId: undefined,
          },
        },
        itemInteraction: {
          click: {
            active: false,
            index: null,
            dataKey: undefined,
            coordinate: undefined,
            graphicalItemId: undefined,
          },
          hover: {
            active: false,
            index: null,
            dataKey: undefined,
            coordinate: undefined,
            graphicalItemId: undefined,
          },
        },
        keyboardInteraction: {
          active: false,
          dataKey: undefined,
          index: null,
          coordinate: undefined,
          graphicalItemId: undefined,
        },
        syncInteraction: {
          active: false,
          dataKey: undefined,
          index: null,
          coordinate: undefined,
          label: undefined,
          sourceViewBox: undefined,
          graphicalItemId: undefined,
        },
        settings: {
          axisId: 0,
          shared: undefined,
          trigger: 'hover',
          active: undefined,
          defaultIndex: undefined,
        },
        tooltipItemPayloads: [
          {
            dataDefinedOnItem: undefined,
            getPosition: noop,
            settings: {
              color: '#8884d8',
              dataKey: 'uv',
              fill: '#8884d8',
              graphicalItemId: 'my-item-id',
              hide: false,
              name: 'Mike',
              nameKey: undefined,
              stroke: '#8884d8',
              strokeWidth: undefined,
              type: undefined,
              unit: '',
            },
          },
        ],
      };
      expectLastCalledWith(spy, expectedBeforeHover);

      await showTooltip(container, RadarChartTestCase.mouseHoverSelector);

      const expectedAfterHover: TooltipState = {
        axisInteraction: {
          click: {
            active: false,
            dataKey: undefined,
            index: null,
            coordinate: undefined,
            graphicalItemId: undefined,
          },
          hover: {
            active: true,
            dataKey: undefined,
            index: '5',
            coordinate: {
              angle: -210,
              clockWise: false,
              cx: 300,
              cy: 300,
              endAngle: -270,
              innerRadius: 0,
              outerRadius: 236,
              radius: 141.4213562373095,
              startAngle: 90,
              x: 177.5255128608411,
              y: 229.28932188134524,
            },
            graphicalItemId: undefined,
          },
        },
        itemInteraction: {
          click: {
            active: false,
            index: null,
            dataKey: undefined,
            coordinate: undefined,
            graphicalItemId: undefined,
          },
          hover: {
            active: false,
            index: null,
            dataKey: undefined,
            coordinate: undefined,
            graphicalItemId: undefined,
          },
        },
        keyboardInteraction: {
          active: false,
          dataKey: undefined,
          index: null,
          coordinate: undefined,
          graphicalItemId: undefined,
        },
        syncInteraction: {
          active: false,
          dataKey: undefined,
          index: null,
          coordinate: undefined,
          label: undefined,
          sourceViewBox: undefined,
          graphicalItemId: undefined,
        },
        settings: {
          axisId: 0,
          shared: undefined,
          trigger: 'hover',
          active: undefined,
          defaultIndex: undefined,
        },
        tooltipItemPayloads: [
          {
            dataDefinedOnItem: undefined,
            getPosition: noop,
            settings: {
              color: '#8884d8',
              dataKey: 'uv',
              fill: '#8884d8',
              graphicalItemId: 'my-item-id',
              hide: false,
              name: 'Mike',
              nameKey: undefined,
              stroke: '#8884d8',
              strokeWidth: undefined,
              type: undefined,
              unit: '',
            },
          },
        ],
      };
      expectLastCalledWith(spy, expectedAfterHover);
    });

    it('should select active label', async () => {
      const { spy } = await renderTestCase(state => selectActiveLabel(state, 'axis', 'hover', '2'));
      expectLastCalledWith(spy, 'Page C');
    });

    it('should select active coordinate', async () => {
      const { container, spy } = await renderTestCase(state =>
        selectActiveCoordinate(state, 'axis', 'hover', undefined),
      );
      expectLastCalledWith(spy, undefined);
      expect(spy).toHaveBeenCalledTimes(1);

      await showTooltipOnCoordinate(
        container,
        RadarChartTestCase.mouseHoverSelector,
        RadarChartTestCase.mouseCoordinate,
      );

      expectLastCalledWith(spy, {
        angle: -210,
        clockWise: false,
        cx: 300,
        cy: 300,
        endAngle: -270,
        innerRadius: 0,
        outerRadius: 236,
        radius: 141.4213562373095,
        startAngle: 90,
        x: 177.5255128608411,
        y: 229.28932188134524,
      });
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });

  describe('as a child of RadialBarChart', () => {
    const renderTestCase = createSelectorTestCase(({ children }) => (
      <RadialBarChartTestCase.Wrapper>
        <Tooltip />
        {children}
      </RadialBarChartTestCase.Wrapper>
    ));

    it('should select chart layout', async () => {
      const { spy } = await renderTestCase(selectChartLayout);
      expectLastCalledWith(spy, 'radial');
    });

    it('should select tooltip axis type', async () => {
      const { spy } = await renderTestCase(selectTooltipAxisType);
      expectLastCalledWith(spy, 'radiusAxis');
    });

    it('should select tooltip axis ID', async () => {
      const { spy } = await renderTestCase(selectTooltipAxisId);
      expectLastCalledWith(spy, 0);
    });

    it('should select tooltip axis settings', async () => {
      const { spy } = await renderTestCase(selectTooltipAxis);
      expectLastCalledWith(spy, {
        allowDataOverflow: false,
        allowDecimals: false,
        allowDuplicatedCategory: true,
        dataKey: 'name',
        domain: undefined,
        id: 0,
        includeHidden: false,
        name: undefined,
        reversed: false,
        niceTicks: 'auto',
        scale: 'auto',
        tick: true,
        tickCount: 5,
        ticks: undefined,
        type: 'category',
        unit: undefined,
      });
    });

    it('should select tooltip axis range', async () => {
      const { spy } = await renderTestCase(selectTooltipAxisRangeWithReverse);
      expectLastCalledWith(spy, [0, 236]);
    });

    test('selectTooltipAxisDomainIncludingNiceTicks', async () => {
      const { spy } = await renderTestCase(selectTooltipAxisDomainIncludingNiceTicks);
      expectLastCalledWith(spy, ['Page A', 'Page B', 'Page C', 'Page D', 'Page E', 'Page F']);
    });

    test('selectTooltipAxisDomain', async () => {
      const { spy } = await renderTestCase(selectTooltipAxisDomain);
      expectLastCalledWith(spy, ['Page A', 'Page B', 'Page C', 'Page D', 'Page E', 'Page F']);
    });

    it('should select tooltip axis scale', async () => {
      const { spy } = await renderTestCase(selectTooltipAxisScale);
      expectLastCalledWithScale(spy, {
        domain: ['Page A', 'Page B', 'Page C', 'Page D', 'Page E', 'Page F'],
        range: [0, 236],
      });
    });

    it('should select categoricalDomain = undefined', async () => {
      const { spy } = await renderTestCase(selectTooltipCategoricalDomain);
      expectLastCalledWith(spy, undefined);
    });

    it('should select tooltip axis ticks', async () => {
      const { spy } = await renderTestCase(selectTooltipAxisTicks);
      expectLastCalledWith(spy, [
        {
          coordinate: 19.666666666666668,
          index: 0,
          offset: 19.666666666666668,
          value: 'Page A',
        },
        {
          coordinate: 59,
          index: 1,
          offset: 19.666666666666668,
          value: 'Page B',
        },
        {
          coordinate: 98.33333333333334,
          index: 2,
          offset: 19.666666666666668,
          value: 'Page C',
        },
        {
          coordinate: 137.66666666666666,
          index: 3,
          offset: 19.666666666666668,
          value: 'Page D',
        },
        {
          coordinate: 177,
          index: 4,
          offset: 19.666666666666668,
          value: 'Page E',
        },
        {
          coordinate: 216.33333333333334,
          index: 5,
          offset: 19.666666666666668,
          value: 'Page F',
        },
      ]);
    });

    it('should move when the mouse moves over the radial bars', async () => {
      mockGetBoundingClientRect({
        width: 10,
        height: 10,
      });
      const { container } = await renderTestCase();

      await showTooltipOnCoordinate(container, RadialBarChartTestCase.mouseHoverSelector, {
        clientX: 200,
        clientY: 200,
      });

      await expectScreenshot(container);

      await showTooltipOnCoordinate(container, RadialBarChartTestCase.mouseHoverSelector, {
        clientX: 201,
        clientY: 201,
      });

      await expectScreenshot(container);
    });

    it('should move onTouchMove', async () => {
      mockGetBoundingClientRect({
        width: 10,
        height: 10,
      });
      const { container } = await renderTestCase();

      await showTooltipOnCoordinateTouch(container, RadialBarChartTestCase.mouseHoverSelector, {
        clientX: 200,
        clientY: 200,
      });

      await expectScreenshot(container);

      await showTooltipOnCoordinateTouch(container, RadialBarChartTestCase.mouseHoverSelector, {
        clientX: 201,
        clientY: 201,
      });

      await expectScreenshot(container);
    });
  });

  describe('includeHidden prop', () => {
    describe('when includeHidden = true', () => {
      const renderTestCase = createSelectorTestCase(({ children }) => (
        <ComposedChart width={400} height={400} data={PageData}>
          <Area dataKey="uv" hide name="1" />
          <Bar dataKey="pv" hide name="2" />
          <Line dataKey="amt" hide name="3" />
          <Scatter dataKey="uv" hide name="4" />
          <Line dataKey="pv" name="5" />
          <XAxis type="number" dataKey="amt" name="stature" unit="cm" />
          <YAxis type="number" dataKey="pv" name="weight" unit="kg" />
          <Tooltip includeHidden />
          {children}
        </ComposedChart>
      ));

      it('should select tooltip axis ID', async () => {
        const { spy } = await renderTestCase(selectTooltipAxisId);
        expectLastCalledWith(spy, 0);
      });

      it('should select tooltip axis type', async () => {
        const { spy } = await renderTestCase(selectTooltipAxisType);
        expectLastCalledWith(spy, 'xAxis');
      });

      it('should select active label when given explicit index', async () => {
        const { spy } = await renderTestCase(state => selectActiveLabel(state, 'axis', 'hover', '2'));
        expectLastCalledWith(spy, 2400);
      });

      it('should select active coordinate', async () => {
        const { container, spy } = await renderTestCase(state =>
          selectActiveCoordinate(state, 'axis', 'hover', undefined),
        );
        expectLastCalledWith(spy, undefined);
        expect(spy).toHaveBeenCalledTimes(1);

        await showTooltip(container, composedChartMouseHoverTooltipSelector);

        expectLastCalledWith(spy, {
          x: 395,
          y: 200,
        });
        expect(spy).toHaveBeenCalledTimes(2);
      });

      it('should select tooltip axis scale', async () => {
        const { spy } = await renderTestCase(selectTooltipAxisScale);
        expectLastCalledWithScale(spy, {
          domain: [0, 2400],
          range: [65, 395],
        });
      });

      it('should select tooltip axis settings', async () => {
        const { spy } = await renderTestCase(selectTooltipAxis);
        expectLastCalledWith(spy, {
          allowDataOverflow: false,
          allowDecimals: true,
          allowDuplicatedCategory: true,
          angle: 0,
          dataKey: 'amt',
          domain: undefined,
          height: 30,
          hide: false,
          id: 0,
          includeHidden: false,
          interval: 'preserveEnd',
          minTickGap: 5,
          mirror: false,
          name: 'stature',
          orientation: 'bottom',
          padding: {
            left: 0,
            right: 0,
          },
          reversed: false,
          niceTicks: 'auto',
          scale: 'auto',
          tick: true,
          tickCount: 5,
          tickFormatter: undefined,
          ticks: undefined,
          type: 'number',
          unit: 'cm',
        });
      });

      it('should select tooltip axis real scale type', async () => {
        const { spy } = await renderTestCase(selectTooltipAxisRealScaleType);
        expectLastCalledWith(spy, 'linear');
      });

      it('should select tooltip axis ticks', async () => {
        const { spy } = await renderTestCase(selectTooltipAxisTicks);
        expectLastCalledWith(spy, [
          { coordinate: 395, value: 2400, index: 0, offset: 0 },
          { coordinate: 395, value: 2400, index: 1, offset: 0 },
          { coordinate: 395, value: 2400, index: 2, offset: 0 },
          { coordinate: 395, value: 2400, index: 3, offset: 0 },
          { coordinate: 395, value: 2400, index: 4, offset: 0 },
          { coordinate: 395, value: 2400, index: 5, offset: 0 },
        ]);
      });

      it('should select isActive', async () => {
        const { container, spy } = await renderTestCase(state =>
          selectIsTooltipActive(state, 'axis', 'hover', undefined),
        );
        expectLastCalledWith(spy, {
          activeIndex: null,
          isActive: false,
        });
        expect(spy).toHaveBeenCalledTimes(3);

        await showTooltip(container, composedChartMouseHoverTooltipSelector);

        expectLastCalledWith(spy, {
          activeIndex: '0',
          isActive: true,
        });
        expect(spy).toHaveBeenCalledTimes(4);
      });

      it('should render tooltip payload for hidden items', async () => {
        const { container } = await renderTestCase();

        await expectTooltipNotVisible(container);

        await showTooltip(container, composedChartMouseHoverTooltipSelector);

        await expectTooltipScreenshot(container);
      });
    });

    describe('when includeHidden = false', () => {
      const renderTestCase = createSelectorTestCase(({ children }) => (
        <ComposedChart width={400} height={400} data={PageData}>
          <Area dataKey="uv" hide name="1" />
          <Bar dataKey="pv" hide name="2" />
          <Line dataKey="amt" hide name="3" />
          <Scatter dataKey="uv" hide name="4" />
          <Line dataKey="pv" name="5" />
          <XAxis type="number" dataKey="amt" name="stature" unit="cm" />
          <YAxis type="number" dataKey="pv" name="weight" unit="kg" />
          <Tooltip includeHidden={false} />
          {children}
        </ComposedChart>
      ));

      it('should hide tooltip for hidden items', async () => {
        const { container } = await renderTestCase();

        await expectTooltipNotVisible(container);

        await showTooltip(container, composedChartMouseHoverTooltipSelector);

        await expectTooltipScreenshot(container);
      });
    });
  });

  it('Should display the data selected by Brush', async () => {
    const { container, debug } = await render(
      <LineChart width={600} height={300} data={PageData}>
        <XAxis dataKey="name" />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Legend />
        <Brush dataKey="name" startIndex={1} height={30} stroke="#8884d8" />
        <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
        <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
      </LineChart>,
    );

    const line = container.querySelector('.recharts-cartesian-grid-horizontal line')!;
    await showTooltipOnCoordinate(
      container,
      lineChartMouseHoverTooltipSelector,
      {
        clientX: +line.getAttribute('x')! + 1,
        clientY: 50,
      },
      debug,
    );
    await expectTooltipScreenshot(container);
  });

  test('defaultIndex can be updated by parent control', async () => {
    const data2 = [
      { x: 100, y: 200, z: 200 },
      { x: 120, y: 100, z: 260 },
      { x: 170, y: 300, z: 400 },
      { x: 140, y: 250, z: 280 },
      { x: 150, y: 400, z: 500 },
      { x: 110, y: 280, z: 200 },
    ];
    const Example = () => {
      const [defaultIndex, setDefaultIndex] = useState(0);

      return (
        <div>
          <ScatterChart width={400} height={400} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis dataKey="x" name="stature" unit="cm" />
            <YAxis dataKey="y" name="weight" unit="kg" />
            <Scatter line name="A school" data={data2} fill="#ff7300" />
            <Tooltip defaultIndex={defaultIndex} active />
          </ScatterChart>
          <button type="button" id="goRight" onClick={() => setDefaultIndex(defaultIndex + 1)}>
            Go right
          </button>
        </div>
      );
    };
    const { container } = await render(<Example />);

    // The tooltip and the cursor should be visible, since defaultIndex was set
    await expectScreenshot(container);

    /*
     * Synthetic click, not userEvent: a real pointer stays where the button was,
     * and Chromium sends hover events to charts that later tests render under it.
     */
    await fireEvent.click(container.querySelector('#goRight') as HTMLButtonElement);

    // The tooltip should show the next data point
    await expectScreenshot(container);
  });
});

describe('Active element visibility', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 100, height: 100 });
  });

  describe.each([
    AreaChartTestCase,
    LineChartHorizontalTestCase,
    LineChartVerticalTestCase,
    ComposedChartWithAreaTestCase,
    ComposedChartWithLineTestCase,
    RadarChartTestCase,
  ])('as a child of $name', ({ Wrapper, mouseHoverSelector }) => {
    it('should display activeDot', async () => {
      const { container, debug } = await render(
        <Wrapper>
          <Tooltip />
        </Wrapper>,
      );
      await expect.element(page.getByCSS('.recharts-active-dot')).not.toBeInTheDocument();

      await showTooltip(container, mouseHoverSelector, debug);

      await expectScreenshot(container);
    });
  });

  describe.each([
    BarChartTestCase,
    ComposedChartWithBarTestCase,
    PieChartTestCase,
    RadialBarChartTestCase,
    SankeyTestCase,
    ScatterChartTestCase,
    SunburstChartTestCase,
    TreemapTestCase,
  ])('as a child of $name', ({ Wrapper, mouseHoverSelector }) => {
    it('should not display activeDot', async () => {
      const { container, debug } = await render(
        <Wrapper>
          <Tooltip />
        </Wrapper>,
      );
      await expect.element(page.getByCSS('.recharts-active-dot')).not.toBeInTheDocument();

      await showTooltip(container, mouseHoverSelector, debug);

      await expect.element(page.getByCSS('.recharts-active-dot')).not.toBeInTheDocument();
    });
  });
});

describe('Cursor visibility', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 100, height: 100 });
  });

  describe.each([
    AreaChartTestCase,
    BarChartTestCase,
    LineChartHorizontalTestCase,
    LineChartVerticalTestCase,
    ComposedChartWithAreaTestCase,
    ComposedChartWithLineTestCase,
    RadarChartTestCase,
  ])('as a child of $name', ({ Wrapper, mouseHoverSelector }) => {
    it('should display cursor inside of the SVG', async () => {
      const { container, debug } = await render(
        <Wrapper>
          <Tooltip />
        </Wrapper>,
      );
      await expect.element(page.getByCSS('.recharts-tooltip-cursor')).not.toBeInTheDocument();

      await showTooltip(container, mouseHoverSelector, debug);

      await expectScreenshot(container);
    });

    it('should not display cursor when cursor=false', async () => {
      const { container, debug } = await render(
        <Wrapper>
          <Tooltip cursor={false} />
        </Wrapper>,
      );
      await expect.element(page.getByCSS('.recharts-tooltip-cursor')).not.toBeInTheDocument();

      await showTooltip(container, mouseHoverSelector, debug);

      await expect.element(page.getByCSS('.recharts-tooltip-cursor')).not.toBeInTheDocument();
    });
  });
});
