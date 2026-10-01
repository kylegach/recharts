import React, { ComponentType, CSSProperties, ReactNode, useState } from 'react';
import { takeSnapshot } from '@chromatic-com/vitest';
import { describe, expect, it, Mock, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import {
  Area,
  AreaChart,
  AreaRevealShape,
  Bar,
  BarChart,
  ComposedChart,
  LineDrawShape,
  DefaultZIndexes,
  Legend,
  LegendProps,
  LegendType,
  Line,
  LineChart,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  Scatter,
  ScatterChart,
  Surface,
  LegendPayload,
  XAxis,
  YAxis,
} from '../../../src';
import { mockGetBoundingClientRect, mockSequenceOfGetBoundingClientRect } from '../../helper/mockGetBoundingClientRect';
import { assertNotNull } from '../../helper/assertNotNull';
import { useAppSelector } from '../../../src/state/hooks';
import { selectAxisRangeWithReverse } from '../../../src/state/selectors/axisSelectors';
import { selectLegendPayload, selectLegendSize } from '../../../src/state/selectors/legendSelectors';
import { dataWithSpecialNameAndFillProperties, numericalData } from '../../_data';
import { createSelectorTestCase, rechartsTestRender } from '../../helper/browser/createSelectorTestCase';
import { CartesianLayout, CartesianViewBox, ChartOffsetInternal, Size } from '../../../src/util/types';
import { assertHasLegend, expectLegendLabels } from '../../helper/expectLegendLabels';
import { expectLastCalledWith } from '../../helper/expectLastCalledWith';
import { HorizontalAlignmentType, VerticalAlignmentType } from '../../../src/component/DefaultLegendContent';
import { useChartHeight, useChartWidth, useOffsetInternal, useViewBox } from '../../../src/context/chartLayoutContext';
import { useClipPathId } from '../../../src/container/ClipPathProvider';
import { snapshotLegend } from '../../helper/browser/snapshot';

type LegendTypeTestCases = ReadonlyArray<{
  legendType: LegendType;
  selector: string;
}>;

/**
 * The element that each legendType renders as its legend icon.
 * Snapshots check the shape and the color of the icon.
 */
const legendTypeSymbols: LegendTypeTestCases = [
  { legendType: 'circle', selector: 'path.recharts-symbols' },
  { legendType: 'cross', selector: 'path.recharts-symbols' },
  { legendType: 'diamond', selector: 'path.recharts-symbols' },
  { legendType: 'line', selector: 'path.recharts-legend-icon' },
  { legendType: 'plainline', selector: 'line.recharts-legend-icon' },
  { legendType: 'rect', selector: 'path.recharts-legend-icon' },
  { legendType: 'square', selector: 'path.recharts-symbols' },
  { legendType: 'star', selector: 'path.recharts-symbols' },
  { legendType: 'triangle', selector: 'path.recharts-symbols' },
  { legendType: 'wye', selector: 'path.recharts-symbols' },
];

function getLegendTypeSelector(legendType: LegendType): string {
  const testCase = legendTypeSymbols.find(tc => tc.legendType === legendType);
  assertNotNull(testCase);
  return testCase.selector;
}

type AllContextPropertiesMixed = {
  clipPathId: string | undefined;
  viewBox: CartesianViewBox | undefined;
  width: number | undefined;
  height: number | undefined;
  offset: ChartOffsetInternal | null;
};

/**
 * Browser Mode copy of `testChartLayoutContext` from test/util/context.tsx, which renders with @testing-library/react.
 * @param ChartParentComponent Parent component that provides the chart context.
 * @param assertions Callback that receives the context properties and should contain assertions to test them.
 * @returns An async function that renders the component and runs assertions on the context.
 */
function testChartLayoutContext(
  ChartParentComponent: ComponentType<{ children: ReactNode }>,
  assertions: (context: AllContextPropertiesMixed) => void,
) {
  return async () => {
    // Fails the test if recharts silently does not render the child, so the assertions never run.
    expect.hasAssertions();
    function Spy() {
      const clipPathId = useClipPathId();
      const viewBox = useViewBox();
      const width = useChartWidth();
      const height = useChartHeight();
      const offset = useOffsetInternal();
      const context: AllContextPropertiesMixed = { clipPathId, viewBox, width, height, offset };
      assertions(context);
      return <></>;
    }
    await render(
      <ChartParentComponent>
        <Spy />
      </ChartParentComponent>,
    );
  };
}

/**
 * Checks the element that the first legend item renders as its icon. A snapshot checks how it looks.
 */
function assertLegendIcon(container: HTMLElement, selector: string) {
  const [legendItem] = assertHasLegend(container);
  expect(legendItem.querySelector(selector)).not.toBeNull();
}

describe('<Legend />', () => {
  const categoricalData = [
    { value: 'Apple', color: '#ff7300' },
    { value: 'Samsung', color: '#bb7300' },
    { value: 'Huawei', color: '#887300' },
    { value: 'Sony', color: '#667300' },
  ];

  const numericalData2 = [
    { title: 'Luftbaloons', value: 99 },
    { title: 'Miles I would walk', value: 500 },
    { title: 'Days a week', value: 8 },
    { title: 'Mambo number', value: 5 },
    { title: 'Seas of Rhye', value: 7 },
  ];

  describe('outside of chart context', () => {
    it('should ignore payload prop', async () => {
      // @ts-expect-error payload is now omitted from Legend types
      const { container } = await rechartsTestRender(<Legend width={500} height={30} payload={categoricalData} />);

      expect(container.querySelectorAll('.recharts-default-legend')).toHaveLength(0);
      expect(container.querySelectorAll('.recharts-default-legend .recharts-legend-item')).toHaveLength(0);
    });
  });

  describe('custom content as a react element', () => {
    it('should render result in a portal', async () => {
      const CustomizedLegend = () => <div className="customized-legend">customized legend item</div>;

      function Example() {
        const [portalRef, setPortalRef] = useState<HTMLElement | null>(null);

        return (
          <>
            <AreaChart width={600} height={300} data={categoricalData}>
              <Legend width={500} height={30} content={<CustomizedLegend />} portal={portalRef} />
            </AreaChart>
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

      const { container } = await rechartsTestRender(<Example />);

      expect(container.querySelectorAll('.recharts-default-legend')).toHaveLength(0);
      expect(container.querySelectorAll('[data-testid="my-custom-portal-target"] .customized-legend')).toHaveLength(1);
    });

    it('should render a custom component wrapped legend', async () => {
      const CustomLegend = (props: LegendProps) => <Legend {...props} />;
      const { container } = await rechartsTestRender(
        <LineChart width={600} height={300} data={categoricalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CustomLegend />
          <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} strokeDasharray="5 5" />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
        </LineChart>,
      );

      await snapshotLegend(container);
    });

    it('should inject extra sneaky props - but none of them are actual HTML props so they get ignored by React', async () => {
      const CustomizedLegend = () => <div className="customized-legend">customized legend item</div>;
      const { container } = await rechartsTestRender(
        <LineChart width={600} height={300} data={categoricalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <Legend content={<CustomizedLegend />} />
          <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} strokeDasharray="5 5" />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
        </LineChart>,
      );

      expect(container.querySelectorAll('.recharts-default-legend')).toHaveLength(0);
      const legendItem = container.querySelectorAll('.customized-legend')[0];
      expect(legendItem.getAttributeNames().sort()).toEqual(['class'].sort());
    });
  });

  describe('content as a function', () => {
    it('should render result', async () => {
      const customizedLegend = () => {
        return 'custom return value';
      };
      const { container } = await rechartsTestRender(
        <LineChart width={600} height={300} data={categoricalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <Legend content={customizedLegend} />
          <Line dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} strokeDasharray="5 5" />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
        </LineChart>,
      );

      expect(container.querySelectorAll('.recharts-default-legend')).toHaveLength(0);
      await snapshotLegend(container);
    });

    it('should pass parameters to the function', async () => {
      mockGetBoundingClientRect({ width: 70, height: 20 });
      const spy = vi.fn();
      const customContent = (params: unknown): null => {
        spy(params);
        return null;
      };
      await rechartsTestRender(
        <LineChart width={600} height={300} data={categoricalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <Legend content={customContent} />
          <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} strokeDasharray="5 5" />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
        </LineChart>,
      );
      expect(spy).toHaveBeenCalledTimes(2);
      expectLastCalledWith(spy, {
        align: 'center',
        chartHeight: 300,
        chartWidth: 600,
        content: customContent,
        iconSize: 14,
        inactiveColor: '#ccc',
        itemSorter: 'value',
        labelStyle: {},
        layout: 'horizontal',
        margin: {
          bottom: 5,
          left: 20,
          right: 30,
          top: 5,
        },
        offset: 0,
        payload: [
          {
            color: '#8884d8',
            dataKey: 'pv',
            inactive: false,
            payload: {
              activeDot: {
                r: 8,
              },
              animateNewValues: true,
              animationBegin: 0,
              animationDuration: 1500,
              animationEasing: 'ease',
              animationInterpolateFn: expect.any(Function),
              animationMatchBy: 'index',
              connectNulls: false,
              dataKey: 'pv',
              dot: true,
              fill: '#fff',
              hide: false,
              isAnimationActive: 'auto',
              label: false,
              legendType: 'line',
              shape: LineDrawShape,
              stroke: '#8884d8',
              strokeDasharray: '5 5',
              strokeWidth: 1,
              type: 'monotone',
              xAxisId: 0,
              yAxisId: 0,
              zIndex: DefaultZIndexes.line,
            },
            type: 'line',
            value: 'pv',
          },
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
              isAnimationActive: 'auto',
              label: false,
              legendType: 'line',
              shape: LineDrawShape,
              stroke: '#82ca9d',
              strokeWidth: 1,
              type: 'monotone',
              xAxisId: 0,
              yAxisId: 0,
              zIndex: DefaultZIndexes.line,
            },
            type: 'line',
            value: 'uv',
          },
        ],
        verticalAlign: 'bottom',
        width: 550,
      });
    });
  });

  describe('position prop', () => {
    beforeEach(() => {
      // Give the legend a fixed size so the expected positions do not depend on fonts
      mockGetBoundingClientRect({ width: 100, height: 20 });
    });

    it('should set absolute position based on position="top"', async () => {
      await rechartsTestRender(
        <LineChart width={500} height={500} data={numericalData}>
          <Legend position="top" />
          <Line dataKey="value" />
        </LineChart>,
      );
      // top center of 500x500
      // x: 250, y: 0
      // anchor middle/start (cartesian hook logic for top) -> horizontal: middle, vertical: end
      // For Label "top", verticalAnchor is 'end' (above the point y).
      // useCartesianPosition(top) -> y is y - offset. If input y is 0 (from chart dimensions?), wait.
      // In Legend.tsx we pass viewBox { x: 0, y: 0, width: chartWidth, height: chartHeight }.
      // useCartesianPosition logic:
      // x = 0 + 500/2 = 250
      // y = 0
      // position="top" -> y = y - offset = 0.
      // Logic from hook:
      // if position === 'top':
      // x = center
      // y = y - offset
      // vAnchor = 'end'
      // CSS translate for vAnchor='end' is -100%.
      // So top: 0, left: 250, transform: translate(-50%, -100%)
      // This places it *above* the chart. Which might be clipped.
      // The snapshot shows where the legend ends up.
      // Expected inline style: top: 25px, left: 250px, transform: translate(-50%, -100%)
      await takeSnapshot();
    });

    it('should set absolute position offset by margin', async () => {
      await rechartsTestRender(
        <LineChart width={500} height={500} data={numericalData} margin={{ top: 3, right: 0, bottom: 11, left: 30 }}>
          <Legend position="top" />
          <Line dataKey="value" />
        </LineChart>,
      );
      // Expected inline style: top: 23px, left: 265px, transform: translate(-50%, -100%)
      await takeSnapshot();
    });

    it('should set absolute position based on position="insideBottomRight"', async () => {
      await rechartsTestRender(
        <LineChart width={500} height={500} data={numericalData}>
          <Legend position="insideBottomRight" />
          <Line dataKey="value" />
        </LineChart>,
      );
      // insideBottomRight
      // x = width = 500
      // y = height = 500
      // hAnchor = end, vAnchor = end
      // translate(-100%, -100%)
      // default margins are 5px
      // Expected inline style: top: 495px, left: 495px, transform: translate(-100%, -100%)
      await takeSnapshot();
    });

    it('should keep insideBottomRight within the plot area after margins and axes', async () => {
      await rechartsTestRender(
        <LineChart width={500} height={500} data={numericalData} margin={{ top: 3, right: 7, bottom: 11, left: 30 }}>
          <XAxis />
          <YAxis />
          <Legend position="insideBottomRight" />
          <Line dataKey="value" />
        </LineChart>,
      );
      // Expected inline style: top: 459px, left: 493px, transform: translate(-100%, -100%)
      await takeSnapshot();
    });

    it('should apply offset', async () => {
      await rechartsTestRender(
        <LineChart width={500} height={500} data={numericalData}>
          <Legend position="left" offset={10} />
          <Line dataKey="value" />
        </LineChart>,
      );
      // Left
      // The left offset reserves space between the legend and the plot, so the
      // legend itself remains aligned with the chart margin.
      // y = 250
      // hAnchor = end (-100%), vAnchor = middle (-50%)
      // Expected inline style: top: 250px, left: 105px, transform: translate(-100%, -50%)
      await takeSnapshot();
    });

    it('should position outside legends beyond the axes', async () => {
      await rechartsTestRender(
        <LineChart width={500} height={500} data={numericalData} margin={{ top: 3, right: 0, bottom: 11, left: 30 }}>
          <XAxis />
          <YAxis />
          <Legend position="bottom" />
          <Line dataKey="value" />
        </LineChart>,
      );
      // Expected inline style: top: 469px, left: 265px, transform: translate(-50%, 0px)
      await takeSnapshot();
    });

    it('should default left and top positions to vertical and horizontal layouts', async () => {
      await rechartsTestRender(
        <>
          <LineChart width={500} height={500} data={numericalData}>
            <Legend position="left" />
            <Line dataKey="value" />
            <Line dataKey="title" />
          </LineChart>
          <LineChart width={500} height={500} data={numericalData}>
            <Legend position="insideTop" />
            <Line dataKey="value" />
            <Line dataKey="title" />
          </LineChart>
        </>,
      );

      // The left legend stacks its items, and the top legend puts them in one row
      await takeSnapshot();
    });

    it('should allow coordinate object position', async () => {
      await rechartsTestRender(
        <LineChart width={500} height={500} data={numericalData}>
          <Legend position={{ x: 100, y: 100 }} />
          <Line dataKey="value" />
        </LineChart>,
      );
      // x: 100, y: 100
      // default anchors are end/end for object position in useCartesianPosition
      // Expected inline style: top: 105px, left: 105px, transform: translate(-100%, -100%)
      await takeSnapshot();
    });
  });

  describe('content as a React Component', () => {
    it('should render result', async () => {
      const CustomizedLegend = () => {
        return <>custom return value</>;
      };
      const { container } = await rechartsTestRender(
        <LineChart width={600} height={300} data={categoricalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <Legend content={CustomizedLegend} />
          <Line dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} strokeDasharray="5 5" />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
        </LineChart>,
      );

      expect(container.querySelectorAll('.recharts-default-legend')).toHaveLength(0);
      await snapshotLegend(container);
    });
  });

  describe('as a child of LineChart', () => {
    test('Renders `strokeDasharray` (if present) in Legend when iconType is set to `plainline`', async () => {
      const { container } = await rechartsTestRender(
        <LineChart width={600} height={300} data={categoricalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <Legend iconType="plainline" />
          <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} strokeDasharray="5 5" />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
        </LineChart>,
      );

      await snapshotLegend(container);
    });

    test('Does not render `strokeDasharray` (if not present) when iconType is not set to `plainline`', async () => {
      const { container } = await rechartsTestRender(
        <LineChart width={600} height={300} data={categoricalData}>
          <Legend iconType="line" />
          <Line dataKey="pv" />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
        </LineChart>,
      );

      await snapshotLegend(container);
    });

    test('Renders name value of siblings when dataKey is a function', async () => {
      const { container } = await rechartsTestRender(
        <LineChart width={500} height={500} data={categoricalData}>
          <Legend />
          <Line dataKey={row => row.value} name="My Line Data" />
          <Line dataKey={row => row.color} name="My Other Line Data" />
        </LineChart>,
      );
      await snapshotLegend(container);
    });

    test('Legend defaults are read correctly', async () => {
      const { container } = await rechartsTestRender(
        <LineChart width={500} height={500} data={categoricalData}>
          <Legend />
          <Line dataKey={row => row.value} name="My Line Data" />
          <Line dataKey={row => row.color} name="My Other Line Data" />
        </LineChart>,
      );
      const legendItem = container.getElementsByClassName('legend-item-0')[0];
      const surface = legendItem.getElementsByClassName('recharts-surface')[0];
      await expect.element(page.elementLocator(surface)).toHaveAttribute('aria-label', 'My Line Data legend icon');
      await snapshotLegend(container);
    });

    test('aria-label uses the raw entry value even when formatter returns a React element', async () => {
      const { container } = await rechartsTestRender(
        <LineChart width={500} height={500} data={numericalData}>
          <Legend formatter={value => <strong>{value}</strong>} />
          <Line dataKey="value" name="UV" />
        </LineChart>,
      );

      const legendItem = container.getElementsByClassName('legend-item-0')[0];
      const surface = legendItem.getElementsByClassName('recharts-surface')[0];
      await expect.element(page.elementLocator(surface)).toHaveAttribute('aria-label', 'UV legend icon');
    });

    test('aria-label drops the value when the legend entry has no name or string dataKey', async () => {
      const { container } = await rechartsTestRender(
        <LineChart width={500} height={500} data={numericalData}>
          <Legend />
          <Line dataKey={row => row.value} />
        </LineChart>,
      );

      const legendItem = container.getElementsByClassName('legend-item-0')[0];
      const surface = legendItem.getElementsByClassName('recharts-surface')[0];
      await expect.element(page.elementLocator(surface)).toHaveAttribute('aria-label', 'legend icon');
    });

    it('should render one line legend item for each Line, with default class and style attributes', async () => {
      const { container } = await rechartsTestRender(
        <LineChart width={500} height={500} data={numericalData}>
          <Legend />
          <Line dataKey="percent" />
          <Line dataKey="value" />
        </LineChart>,
      );

      const legendItems = assertHasLegend(container);

      expect.soft(legendItems[0].getAttributeNames()).toEqual(['class', 'style']);
      await expect
        .element(page.elementLocator(legendItems[0]))
        .toHaveAttribute('class', 'recharts-legend-item legend-item-0');
      expect.soft(legendItems[1].getAttributeNames()).toEqual(['class', 'style']);
      await expect
        .element(page.elementLocator(legendItems[1]))
        .toHaveAttribute('class', 'recharts-legend-item legend-item-1');

      // in absence of explicit `legendType`, Line should default to line
      assertLegendIcon(container, getLegendTypeSelector('line'));
      await snapshotLegend(container);
    });

    it('should render a legend item even if the dataKey does not match anything from the data', async () => {
      const { container } = await rechartsTestRender(
        <LineChart width={500} height={500} data={numericalData}>
          <Legend />
          <Line dataKey="unknown" />
        </LineChart>,
      );
      await snapshotLegend(container);
    });

    it('should change color and className of hidden Line', async () => {
      const { container } = await rechartsTestRender(
        <LineChart width={500} height={500} data={numericalData}>
          <Legend inactiveColor="yellow" />
          {/* this will ignore the stroke and use inactive color on legend */}
          <Line dataKey="percent" stroke="red" hide />
        </LineChart>,
      );
      const legendItems = assertHasLegend(container);

      expect.soft(legendItems[0].getAttributeNames()).toEqual(['class', 'style']);
      await expect
        .element(page.elementLocator(legendItems[0]))
        .toHaveAttribute('class', 'recharts-legend-item legend-item-0 inactive');

      // in absence of explicit `legendType`, Line should default to line
      assertLegendIcon(container, getLegendTypeSelector('line'));
      await snapshotLegend(container);
    });

    it('should have a default inactive Line legend color', async () => {
      const { container } = await rechartsTestRender(
        <LineChart width={500} height={500} data={numericalData}>
          <Legend />
          {/* this will ignore the stroke and use inactive color on legend */}
          <Line dataKey="percent" stroke="red" hide />
        </LineChart>,
      );
      const legendItems = assertHasLegend(container);

      expect.soft(legendItems[0].getAttributeNames()).toEqual(['class', 'style']);
      await expect
        .element(page.elementLocator(legendItems[0]))
        .toHaveAttribute('class', 'recharts-legend-item legend-item-0 inactive');

      // in absence of explicit `legendType`, Line should default to rect
      assertLegendIcon(container, getLegendTypeSelector('line'));
      await snapshotLegend(container);
    });

    it('should render one empty legend item if Line has no dataKey', async () => {
      const { container } = await rechartsTestRender(
        <LineChart width={500} height={500} data={numericalData}>
          <Legend />
          {/* I wonder if dataKey should be required here, like it is in Radar? */}
          <Line />
        </LineChart>,
      );
      await snapshotLegend(container);
    });

    it('should set legend item from `name` prop on Line, and update it after rerender', async () => {
      const { container, rerender } = await rechartsTestRender(
        <LineChart width={500} height={500} data={numericalData}>
          <Legend />
          <Line dataKey="percent" name="%" />
        </LineChart>,
      );
      await snapshotLegend(container);

      await rerender(
        <LineChart width={500} height={500} data={numericalData}>
          <Legend />
          <Line dataKey="percent" name="Percent" />
        </LineChart>,
      );
      await snapshotLegend(container);
    });

    it('should not implicitly read `name` and `fill` properties from the data array', async () => {
      const { container } = await rechartsTestRender(
        <LineChart width={500} height={500} data={dataWithSpecialNameAndFillProperties}>
          <Legend />
          <Line dataKey="value" />
        </LineChart>,
      );
      await snapshotLegend(container);
    });

    it('should disappear after Line element is removed', async () => {
      const { container, rerender } = await rechartsTestRender(
        <LineChart width={500} height={500} data={dataWithSpecialNameAndFillProperties}>
          <Legend />
          <Line dataKey="name" />
          <Line dataKey="value" />
        </LineChart>,
      );
      await snapshotLegend(container);

      await rerender(
        <LineChart width={500} height={500} data={dataWithSpecialNameAndFillProperties}>
          <Legend />
          <Line dataKey="value" />
        </LineChart>,
      );
      await snapshotLegend(container);
    });

    it('should update legend if Line data changes', async () => {
      const { container, rerender } = await rechartsTestRender(
        <LineChart width={500} height={500} data={numericalData}>
          <Legend />
          <Line dataKey="value" />
        </LineChart>,
      );
      await snapshotLegend(container);

      await rerender(
        <LineChart width={500} height={500} data={numericalData}>
          <Legend />
          <Line dataKey="percent" />
        </LineChart>,
      );
      await snapshotLegend(container);
    });

    it('should pass parameters to the Component', async () => {
      mockGetBoundingClientRect({ width: 80, height: 30 });
      const spy = vi.fn();
      const CustomContent = (props: unknown): null => {
        spy(props);
        return null;
      };
      await rechartsTestRender(
        <LineChart width={600} height={300} data={categoricalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <Legend content={CustomContent} />
          <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} strokeDasharray="5 5" />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
        </LineChart>,
      );
      expect.soft(spy).toHaveBeenCalledTimes(2);
      expectLastCalledWith(spy, {
        align: 'center',
        chartHeight: 300,
        chartWidth: 600,
        content: expect.any(Function),
        iconSize: 14,
        inactiveColor: '#ccc',
        itemSorter: 'value',
        labelStyle: {},
        layout: 'horizontal',
        margin: {
          bottom: 5,
          left: 20,
          right: 30,
          top: 5,
        },
        offset: 0,
        payload: [
          {
            color: '#8884d8',
            dataKey: 'pv',
            inactive: false,
            payload: {
              activeDot: {
                r: 8,
              },
              animateNewValues: true,
              animationBegin: 0,
              animationDuration: 1500,
              animationEasing: 'ease',
              animationInterpolateFn: expect.any(Function),
              animationMatchBy: 'index',
              connectNulls: false,
              dataKey: 'pv',
              dot: true,
              fill: '#fff',
              hide: false,
              isAnimationActive: 'auto',
              label: false,
              legendType: 'line',
              shape: LineDrawShape,
              stroke: '#8884d8',
              strokeDasharray: '5 5',
              strokeWidth: 1,
              type: 'monotone',
              xAxisId: 0,
              yAxisId: 0,
              zIndex: DefaultZIndexes.line,
            },
            type: 'line',
            value: 'pv',
          },
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
              isAnimationActive: 'auto',
              label: false,
              legendType: 'line',
              shape: LineDrawShape,
              stroke: '#82ca9d',
              strokeWidth: 1,
              type: 'monotone',
              xAxisId: 0,
              yAxisId: 0,
              zIndex: DefaultZIndexes.line,
            },
            type: 'line',
            value: 'uv',
          },
        ],
        verticalAlign: 'bottom',
        width: 550,
      });
    });

    it('should render legend labels', async () => {
      const { container } = await rechartsTestRender(
        <LineChart width={600} height={300} data={categoricalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <Legend iconType="plainline" />
          <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} strokeDasharray="5 5" />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
        </LineChart>,
      );
      await snapshotLegend(container);
    });

    it('should render legend labels with same text color', async () => {
      const { container } = await rechartsTestRender(
        <LineChart width={600} height={300} data={categoricalData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <Legend iconType="plainline" labelStyle={{ color: '#666' }} />
          <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} strokeDasharray="5 5" />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
        </LineChart>,
      );
      await snapshotLegend(container);
    });

    it('should not forward ID and className to the DOM', async () => {
      // This is arguably a bug - so this test is just documenting the current behavior
      const { container } = await rechartsTestRender(
        <LineChart width={600} height={300} data={categoricalData}>
          {/* @ts-expect-error TypeScript is correct here since these props don't do anything */}
          <Legend id="foo" className="bar" />
          <Line dataKey="uv" />
        </LineChart>,
      );

      await expect.element(page.elementLocator(container).getByCSS('#foo')).not.toBeInTheDocument();
      await expect.element(page.elementLocator(container).getByCSS('.bar')).not.toBeInTheDocument();
    });

    test('label style should not change color of hidden Line', async () => {
      const { container } = await rechartsTestRender(
        <LineChart width={500} height={500} data={numericalData}>
          <Legend inactiveColor="yellow" labelStyle={{ color: '#666' }} />
          <Line dataKey="percent" stroke="red" hide />
        </LineChart>,
      );
      assertLegendIcon(container, getLegendTypeSelector('line'));
      await snapshotLegend(container);
    });

    describe('legendType symbols', () => {
      test.each(legendTypeSymbols)(
        'should render element $selector for legendType $legendType',
        async ({ legendType, selector }) => {
          const { container } = await rechartsTestRender(
            <LineChart width={500} height={500} data={categoricalData}>
              <Legend />
              <Line dataKey="value" legendType={legendType} />
            </LineChart>,
          );
          assertLegendIcon(container, selector);
          await snapshotLegend(container);
        },
      );
    });

    it('should prefer Legend.iconType over Line.legendType', async () => {
      const { container } = await rechartsTestRender(
        <LineChart width={500} height={500} data={numericalData}>
          <Legend iconType="circle" />
          <Line dataKey="value" legendType="square" />
        </LineChart>,
      );
      assertLegendIcon(container, getLegendTypeSelector('circle'));
      await snapshotLegend(container);
    });
  });

  describe('as a child of LineChart when data is passed to Line child instead of the root', () => {
    it('should render labels', async () => {
      const { container } = await rechartsTestRender(
        <LineChart width={600} height={300} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <Legend iconType="plainline" />
          <Line
            type="monotone"
            data={categoricalData}
            dataKey="pv"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
            strokeDasharray="5 5"
          />
          <Line data={categoricalData} type="monotone" dataKey="uv" stroke="#82ca9d" />
        </LineChart>,
      );
      await snapshotLegend(container);
    });
  });

  describe('as a child of BarChart', () => {
    it('should render one rect legend item for each Bar, with default class and style attributes', async () => {
      const { container } = await rechartsTestRender(
        <BarChart width={500} height={500} data={numericalData}>
          <Legend />
          <Bar dataKey="percent" />
          <Bar dataKey="value" />
        </BarChart>,
      );

      const legendItems = assertHasLegend(container);

      expect.soft(legendItems[0].getAttributeNames()).toEqual(['class', 'style']);
      await expect
        .element(page.elementLocator(legendItems[0]))
        .toHaveAttribute('class', 'recharts-legend-item legend-item-0');
      expect.soft(legendItems[1].getAttributeNames()).toEqual(['class', 'style']);
      await expect
        .element(page.elementLocator(legendItems[1]))
        .toHaveAttribute('class', 'recharts-legend-item legend-item-1');

      // in absence of explicit `legendType`, Bar should default to rect
      assertLegendIcon(container, getLegendTypeSelector('rect'));
      await snapshotLegend(container);
    });

    it('should not render items with a type of `none`', async () => {
      const { container } = await rechartsTestRender(
        <BarChart width={500} height={500} data={categoricalData}>
          <Legend />
          <Bar dataKey="value" legendType="star" />
          <Bar dataKey="color" legendType="none" />
        </BarChart>,
      );
      await snapshotLegend(container);
    });

    it('should push away Bars to make space', async () => {
      mockGetBoundingClientRect({ width: 0, height: 10 });
      const yAxisRangeSpy = vi.fn();
      const Comp = (): null => {
        yAxisRangeSpy(useAppSelector(state => selectAxisRangeWithReverse(state, 'yAxis', 0, false)));
        return null;
      };

      const { container, rerender } = await rechartsTestRender(
        <BarChart width={500} height={500} data={numericalData}>
          <Legend />
          <Bar isAnimationActive={false} dataKey="percent" />
          <Comp />
        </BarChart>,
      );

      expect(yAxisRangeSpy).toHaveBeenLastCalledWith([485, 5]);
      expect(yAxisRangeSpy).toHaveBeenCalledTimes(2);

      await takeSnapshot();

      await rerender(
        <BarChart width={500} height={500} data={numericalData}>
          <Bar isAnimationActive={false} dataKey="percent" />
          <Comp />
        </BarChart>,
      );

      expect(container.querySelectorAll('.recharts-default-legend')).toHaveLength(0);

      expect(yAxisRangeSpy).toHaveBeenLastCalledWith([495, 5]);
      expect(yAxisRangeSpy).toHaveBeenCalledTimes(3);

      await takeSnapshot();
    });

    it('should render a legend item even if the dataKey does not match anything from the data', async () => {
      const { container } = await rechartsTestRender(
        <BarChart width={500} height={500} data={numericalData}>
          <Legend />
          <Bar dataKey="unknown" />
        </BarChart>,
      );
      await snapshotLegend(container);
    });

    it('should change color and className of hidden Bar', async () => {
      const { container } = await rechartsTestRender(
        <BarChart width={500} height={500} data={numericalData}>
          <Legend inactiveColor="yellow" />
          {/* this will ignore the stroke and use inactive color on legend */}
          <Bar dataKey="percent" stroke="red" hide />
        </BarChart>,
      );
      const legendItems = assertHasLegend(container);

      expect.soft(legendItems[0].getAttributeNames()).toEqual(['class', 'style']);
      await expect
        .element(page.elementLocator(legendItems[0]))
        .toHaveAttribute('class', 'recharts-legend-item legend-item-0 inactive');

      // in absence of explicit `legendType`, Bar should default to rect
      assertLegendIcon(container, getLegendTypeSelector('rect'));
      await snapshotLegend(container);
    });

    it('should have a default inactive Bar legend color', async () => {
      const { container } = await rechartsTestRender(
        <BarChart width={500} height={500} data={numericalData}>
          <Legend />
          {/* this will ignore the stroke and use inactive color on legend */}
          <Bar dataKey="percent" stroke="red" hide />
        </BarChart>,
      );
      const legendItems = assertHasLegend(container);

      expect.soft(legendItems[0].getAttributeNames()).toEqual(['class', 'style']);
      await expect
        .element(page.elementLocator(legendItems[0]))
        .toHaveAttribute('class', 'recharts-legend-item legend-item-0 inactive');

      // in absence of explicit `legendType`, Bar should default to rect
      assertLegendIcon(container, getLegendTypeSelector('rect'));
      await snapshotLegend(container);
    });

    it('should render one empty legend item if Bar has no dataKey', async () => {
      const { container } = await rechartsTestRender(
        <BarChart width={500} height={500} data={numericalData}>
          <Legend />
          <Bar />
        </BarChart>,
      );
      await snapshotLegend(container);
    });

    it('should set legend item from `name` prop on Bar, and update it after rerender', async () => {
      const { rerender, container } = await rechartsTestRender(
        <BarChart width={500} height={500} data={numericalData}>
          <Legend />
          <Bar dataKey="percent" name="%" />
        </BarChart>,
      );
      await snapshotLegend(container);

      await rerender(
        <BarChart width={500} height={500} data={numericalData}>
          <Legend />
          <Bar dataKey="percent" name="Percent" />
        </BarChart>,
      );
      await snapshotLegend(container);
    });

    it('should not implicitly read `name` and `fill` properties from the data array', async () => {
      const { container, getByText } = await rechartsTestRender(
        <BarChart width={500} height={500} data={dataWithSpecialNameAndFillProperties}>
          <Legend />
          <Bar dataKey="color" />
        </BarChart>,
      );
      await snapshotLegend(container);
      await expect.element(getByText('name1', { exact: true })).not.toBeInTheDocument();
      await expect.element(getByText('name2', { exact: true })).not.toBeInTheDocument();
      await expect.element(getByText('name3', { exact: true })).not.toBeInTheDocument();
      await expect.element(getByText('name4', { exact: true })).not.toBeInTheDocument();
      await expect.element(page.getByCSS('[fill="fill1"]')).not.toBeInTheDocument();
      await expect.element(page.getByCSS('[fill="fill2"]')).not.toBeInTheDocument();
      await expect.element(page.getByCSS('[fill="fill3"]')).not.toBeInTheDocument();
      await expect.element(page.getByCSS('[fill="fill4"]')).not.toBeInTheDocument();
    });

    it('should disappear after Bar element is removed', async () => {
      const { container, rerender } = await rechartsTestRender(
        <BarChart width={500} height={500} data={dataWithSpecialNameAndFillProperties}>
          <Legend />
          <Bar dataKey="name" />
          <Bar dataKey="value" />
        </BarChart>,
      );
      await snapshotLegend(container);

      await rerender(
        <BarChart width={500} height={500} data={dataWithSpecialNameAndFillProperties}>
          <Legend />
          <Bar dataKey="value" />
        </BarChart>,
      );
      await snapshotLegend(container);
    });

    it('should update legend if Bar data changes', async () => {
      const { container, rerender } = await rechartsTestRender(
        <BarChart width={500} height={500} data={numericalData}>
          <Legend />
          <Bar dataKey="value" />
        </BarChart>,
      );
      await snapshotLegend(container);

      await rerender(
        <BarChart width={500} height={500} data={numericalData}>
          <Legend />
          <Bar dataKey="percent" />
        </BarChart>,
      );
      await snapshotLegend(container);
    });

    describe('wrapper props', () => {
      it('should provide default props', async () => {
        const { container } = await rechartsTestRender(
          <BarChart width={500} height={500} data={numericalData}>
            <Legend />
            <Bar dataKey="value" />
          </BarChart>,
        );
        const wrapper = container.querySelector('.recharts-legend-wrapper');
        assertNotNull(wrapper);
        expect.soft(wrapper.getAttributeNames()).toEqual(['class', 'style']);
        await expect.element(page.elementLocator(wrapper)).toHaveAttribute('class', 'recharts-legend-wrapper');
        await takeSnapshot();
      });

      it('should change width and height based on chart width and height and margin and bounding box size', async () => {
        mockGetBoundingClientRect({
          width: 3,
          height: 5,
        });
        const { container } = await rechartsTestRender(
          <BarChart width={300} height={200} margin={{ top: 11, right: 13, left: 17, bottom: 19 }} data={numericalData}>
            <Legend />
            <Bar dataKey="value" />
          </BarChart>,
        );
        const wrapper = container.querySelector('.recharts-legend-wrapper');
        assertNotNull(wrapper);
        expect.soft(wrapper.getAttributeNames()).toEqual(['class', 'style']);
        await expect.element(page.elementLocator(wrapper)).toHaveAttribute('class', 'recharts-legend-wrapper');
        await takeSnapshot();
      });

      it('should change width and height based on explicit Legend props', async () => {
        const { container } = await rechartsTestRender(
          <BarChart width={500} height={500} margin={{ top: 11, right: 13, left: 17, bottom: 19 }} data={numericalData}>
            <Legend width={90} height={20} />
            <Bar dataKey="value" />
          </BarChart>,
        );
        const wrapper = container.querySelector('.recharts-legend-wrapper');
        assertNotNull(wrapper);
        expect.soft(wrapper.getAttributeNames()).toEqual(['class', 'style']);
        await expect.element(page.elementLocator(wrapper)).toHaveAttribute('class', 'recharts-legend-wrapper');
        await takeSnapshot();
      });

      it('should append wrapperStyle', async () => {
        const { container } = await rechartsTestRender(
          <BarChart width={500} height={500} data={numericalData}>
            <Legend wrapperStyle={{ backgroundColor: 'red' }} />
            <Bar dataKey="value" />
          </BarChart>,
        );
        const wrapper = container.querySelector('.recharts-legend-wrapper');
        assertNotNull(wrapper);
        expect.soft(wrapper.getAttributeNames()).toEqual(['class', 'style']);
        await expect.element(page.elementLocator(wrapper)).toHaveAttribute('class', 'recharts-legend-wrapper');
        await takeSnapshot();
      });

      const wrapperStyleTestCases: ReadonlyArray<{
        wrapperStyle: CSSProperties;
        align?: LegendProps['align'];
        name: string;
      }> = [
        {
          wrapperStyle: { left: '31px', right: '33px', bottom: '37px', top: '41px' },
          name: 'all provided',
          // The browser collapses all four sides into the `inset` shorthand
        },
        {
          wrapperStyle: { left: '31px', right: '33px', bottom: '37px' },
          name: 'missing top',
        },
        {
          wrapperStyle: { left: '31px', right: '33px', top: '41px' },
          name: 'missing bottom',
        },
        {
          wrapperStyle: { left: '31px', right: '33px' },
          name: 'missing top and bottom',
        },
        {
          wrapperStyle: { left: '31px', bottom: '37px', top: '41px' },
          name: 'missing right',
        },
        {
          wrapperStyle: { right: '33px', bottom: '37px', top: '41px' },
          name: 'missing left',
        },
        {
          wrapperStyle: { left: '31px', bottom: '37px', top: '41px' },
          align: 'right',
          name: 'missing right, align right',
        },
        {
          wrapperStyle: { bottom: '37px', top: '41px' },
          name: 'missing left and right',
        },
      ];
      test.each(wrapperStyleTestCases)(
        'should calculate position if wrapperStyle is $name',
        async ({ wrapperStyle, align }) => {
          const { container } = await rechartsTestRender(
            <BarChart
              width={500}
              height={500}
              margin={{ top: 11, right: 13, left: 17, bottom: 19 }}
              data={numericalData}
            >
              <Legend wrapperStyle={wrapperStyle} align={align} />
              <Bar dataKey="value" />
            </BarChart>,
          );
          const wrapper = container.querySelector('.recharts-legend-wrapper');
          assertNotNull(wrapper);
          expect.soft(wrapper.getAttributeNames()).toEqual(['class', 'style']);
          await expect.element(page.elementLocator(wrapper)).toHaveAttribute('class', 'recharts-legend-wrapper');
          await takeSnapshot();
        },
      );

      type LegendPositionTextCase = {
        align: HorizontalAlignmentType;
        verticalAlign: VerticalAlignmentType;
        layout: CartesianLayout;
      };

      const layoutPositionCartesianTests: ReadonlyArray<LegendPositionTextCase> = [
        {
          align: 'center',
          verticalAlign: 'top',
          layout: 'horizontal',
        },
        {
          align: 'left',
          verticalAlign: 'top',
          layout: 'horizontal',
        },
        {
          align: 'right',
          verticalAlign: 'top',
          layout: 'horizontal',
        },
        {
          align: 'center',
          verticalAlign: 'bottom',
          layout: 'horizontal',
        },
        {
          align: 'left',
          verticalAlign: 'bottom',
          layout: 'horizontal',
        },
        {
          align: 'right',
          verticalAlign: 'bottom',
          layout: 'horizontal',
        },
        {
          align: 'center',
          verticalAlign: 'middle',
          layout: 'horizontal',
        },
        {
          align: 'left',
          verticalAlign: 'middle',
          layout: 'horizontal',
        },
        {
          align: 'right',
          verticalAlign: 'middle',
          layout: 'horizontal',
        },
        {
          align: 'center',
          verticalAlign: 'top',
          layout: 'vertical',
        },
        {
          align: 'left',
          verticalAlign: 'top',
          layout: 'vertical',
        },
        {
          align: 'right',
          verticalAlign: 'top',
          layout: 'vertical',
        },
        {
          align: 'center',
          verticalAlign: 'bottom',
          layout: 'vertical',
        },
        {
          align: 'left',
          verticalAlign: 'bottom',
          layout: 'vertical',
        },
        {
          align: 'right',
          verticalAlign: 'bottom',
          layout: 'vertical',
        },
        {
          align: 'center',
          verticalAlign: 'middle',
          layout: 'vertical',
        },
        {
          align: 'left',
          verticalAlign: 'middle',
          layout: 'vertical',
        },
        {
          align: 'right',
          verticalAlign: 'middle',
          layout: 'vertical',
        },
      ];
      test('test cases should be complete and unique', () => {
        const horizontalAlignmentVariants = 3;
        const verticalAlignmentVariants = 3;
        const layoutVariants = 2; // polar variants do not make sense for cartesian chart
        expect
          .soft(layoutPositionCartesianTests)
          .toHaveLength(horizontalAlignmentVariants * verticalAlignmentVariants * layoutVariants);
        const set = new Set(
          layoutPositionCartesianTests.map(({ align, verticalAlign, layout }) => align + verticalAlign + layout),
        );
        expect(set.size).toEqual(layoutPositionCartesianTests.length);
      });

      test.each(layoutPositionCartesianTests)(
        'should calculate position for align=$align, verticalAlign=$verticalAlign, layout=$layout',
        async ({ align, verticalAlign, layout }) => {
          mockGetBoundingClientRect({
            width: 23,
            height: 29,
          });
          const { container, rerender } = await rechartsTestRender(
            <BarChart
              width={500}
              height={700}
              margin={{ top: 11, right: 13, left: 17, bottom: 19 }}
              data={numericalData}
            >
              <Legend align={align} verticalAlign={verticalAlign} layout={layout} />
              <Bar dataKey="value" />
            </BarChart>,
          );
          const wrapper = container.querySelector('.recharts-legend-wrapper');
          assertNotNull(wrapper);
          expect.soft(wrapper.getAttributeNames()).toEqual(['class', 'style']);
          await expect.element(page.elementLocator(wrapper)).toHaveAttribute('class', 'recharts-legend-wrapper');
          await takeSnapshot();
          /*
           * Because the bounding box is set as a class property instead of a state,
           * reading the legend width and height does not trigger re-render!
           * Instead we have to trigger manually here.
           */
          await rerender(
            <BarChart
              width={500}
              height={700}
              margin={{ top: 11, right: 13, left: 17, bottom: 19 }}
              data={numericalData}
            >
              <Legend align={align} verticalAlign={verticalAlign} layout={layout} />
              <Bar dataKey="value" />
            </BarChart>,
          );
          const wrapper2 = container.querySelector('.recharts-legend-wrapper');
          assertNotNull(wrapper2);
          expect.soft(wrapper2.getAttributeNames()).toEqual(['class', 'style']);
          await expect.element(page.elementLocator(wrapper2)).toHaveAttribute('class', 'recharts-legend-wrapper');
          await takeSnapshot();
        },
      );
    });

    describe('offset calculation', () => {
      it('should reduce vertical offset by the height of legend', async () => {
        mockGetBoundingClientRect({
          height: 13,
          width: 17,
        });
        const spy = vi.fn();
        await testChartLayoutContext(
          props => (
            <BarChart width={500} height={500} data={categoricalData}>
              {props.children}
              <Legend layout="horizontal" width={200} />
              <Bar dataKey="value" />
            </BarChart>
          ),
          ({ offset }) => {
            spy(offset);
          },
        )();
        expect(spy).toHaveBeenCalledTimes(2);
        expectLastCalledWith(spy, {
          brushBottom: 5,
          top: 5,
          bottom: 5 + 13,
          left: 5,
          right: 5,
          width: 490,
          height: 490 - 13,
        });
      });
      it('should ignore height of legend if it has verticalAlign == middle', async () => {
        mockGetBoundingClientRect({
          height: 13,
          width: 17,
        });
        const spy = vi.fn();
        await testChartLayoutContext(
          props => (
            <BarChart width={500} height={500} data={categoricalData}>
              {props.children}
              <Legend layout="horizontal" verticalAlign="middle" width={200} />
              <Bar dataKey="value" />
            </BarChart>
          ),
          ({ offset }) => {
            spy(offset);
          },
        )();
        expect(spy).toHaveBeenCalledTimes(3);
        expectLastCalledWith(spy, {
          brushBottom: 5,
          top: 5,
          bottom: 5,
          left: 5,
          right: 5,
          width: 490,
          height: 490,
        });
      });
      it('should reduce vertical offset by the width of vertical legend', async () => {
        mockGetBoundingClientRect({
          height: 13,
          width: 17,
        });
        const spy = vi.fn();
        await testChartLayoutContext(
          props => (
            <BarChart width={500} height={500} data={categoricalData}>
              {props.children}
              <Legend layout="vertical" align="left" width={200} />
              <Bar dataKey="value" />
            </BarChart>
          ),
          ({ offset }) => {
            spy(offset);
          },
        )();
        expect(spy).toHaveBeenCalledTimes(3);
        expectLastCalledWith(spy, {
          brushBottom: 5,
          top: 5,
          bottom: 5,
          left: 5 + 17,
          right: 5,
          width: 490 - 17,
          height: 490,
        });
      });
      it('should ignore width of vertical legend if it has align == center', async () => {
        mockGetBoundingClientRect({
          height: 13,
          width: 17,
        });
        const spy = vi.fn();
        await testChartLayoutContext(
          props => (
            <BarChart width={500} height={500} data={categoricalData}>
              {props.children}
              <Legend layout="vertical" align="center" width={200} />
              <Bar dataKey="value" />
            </BarChart>
          ),
          ({ offset }) => {
            spy(offset);
          },
        )();
        expect(spy).toHaveBeenCalledTimes(3);
        expectLastCalledWith(spy, {
          brushBottom: 5,
          top: 5,
          bottom: 5 + 13,
          left: 5,
          right: 5,
          width: 490,
          height: 490 - 13,
        });
      });

      it('should update bottom offset when legend height increases after resize (regression #7200)', async () => {
        // Simulate legend wrapping: first render has small height, then height increases
        mockSequenceOfGetBoundingClientRect([
          { height: 20, width: 200 },
          { height: 60, width: 200 },
        ]);
        const spy = vi.fn();
        await testChartLayoutContext(
          props => (
            <BarChart width={500} height={500} data={categoricalData}>
              {props.children}
              <Legend layout="horizontal" />
              <Bar dataKey="value" />
            </BarChart>
          ),
          ({ offset }) => {
            spy(offset);
          },
        )();
        // The final offset should reflect the larger legend height (60px)
        expectLastCalledWith(spy, {
          brushBottom: 5,
          top: 5,
          bottom: 5 + 60,
          left: 5,
          right: 5,
          width: 490,
          height: 490 - 60,
        });
      });
    });

    describe('legendType symbols', () => {
      test.each(legendTypeSymbols)(
        'should render element $selector for legendType $legendType',
        async ({ legendType, selector }) => {
          const { container } = await rechartsTestRender(
            <BarChart width={500} height={500} data={categoricalData}>
              <Legend />
              <Bar dataKey="value" legendType={legendType} />
            </BarChart>,
          );
          assertLegendIcon(container, selector);
          await snapshotLegend(container);
        },
      );

      it('should prefer Legend.iconType over Bar.legendType', async () => {
        const { container } = await rechartsTestRender(
          <BarChart width={500} height={500} data={numericalData}>
            <Legend iconType="circle" />
            <Bar dataKey="value" legendType="square" />
          </BarChart>,
        );
        assertLegendIcon(container, getLegendTypeSelector('circle'));
        await snapshotLegend(container);
      });
    });
  });

  describe('as a child of AreaChart', () => {
    describe('with two Areas', () => {
      const renderTestCase = createSelectorTestCase(({ children }) => (
        <AreaChart width={500} height={500} data={numericalData}>
          <Legend />
          <Area dataKey="percent" />
          <Area dataKey="value" />
          {children}
        </AreaChart>
      ));

      it('should render one legend item for each Area', async () => {
        const { container } = await renderTestCase();
        await snapshotLegend(container);
      });

      it('should add class and style attributes to each element', async () => {
        const { container } = await renderTestCase();

        const legendItems = assertHasLegend(container);

        expect.soft(legendItems[0].getAttributeNames()).toEqual(['class', 'style']);
        await expect
          .element(page.elementLocator(legendItems[0]))
          .toHaveAttribute('class', 'recharts-legend-item legend-item-0');
        expect.soft(legendItems[1].getAttributeNames()).toEqual(['class', 'style']);
        await expect
          .element(page.elementLocator(legendItems[1]))
          .toHaveAttribute('class', 'recharts-legend-item legend-item-1');
        await snapshotLegend(container);
      });

      it('should render Line symbols and colors in absence of explicit legendType', async () => {
        const { container } = await renderTestCase();
        assertLegendIcon(container, getLegendTypeSelector('line'));
        await snapshotLegend(container);
      });
    });

    it('should render a legend item even if the dataKey does not match anything from the data', async () => {
      const { container } = await rechartsTestRender(
        <AreaChart width={500} height={500} data={numericalData}>
          <Legend />
          <Area dataKey="unknown" />
        </AreaChart>,
      );
      await snapshotLegend(container);
    });

    it('should change color and className of hidden Area', async () => {
      const { container } = await rechartsTestRender(
        <AreaChart width={500} height={500} data={numericalData}>
          <Legend inactiveColor="yellow" />
          {/* this will ignore the stroke and use inactive color on legend */}
          <Area dataKey="percent" stroke="red" hide />
        </AreaChart>,
      );
      const legendItems = assertHasLegend(container);

      expect.soft(legendItems[0].getAttributeNames()).toEqual(['class', 'style']);
      await expect
        .element(page.elementLocator(legendItems[0]))
        .toHaveAttribute('class', 'recharts-legend-item legend-item-0 inactive');

      // in absence of explicit `legendType`, Area should default to line
      assertLegendIcon(container, getLegendTypeSelector('line'));
      await snapshotLegend(container);
    });

    it('should have a default inactive Area legend color', async () => {
      const { container } = await rechartsTestRender(
        <AreaChart width={500} height={500} data={numericalData}>
          <Legend />
          {/* this will ignore the stroke and use inactive color on legend */}
          <Area dataKey="percent" stroke="red" hide />
        </AreaChart>,
      );
      const legendItems = assertHasLegend(container);

      expect.soft(legendItems[0].getAttributeNames()).toEqual(['class', 'style']);
      await expect
        .element(page.elementLocator(legendItems[0]))
        .toHaveAttribute('class', 'recharts-legend-item legend-item-0 inactive');

      // in absence of explicit `legendType`, Area should default to line
      assertLegendIcon(container, getLegendTypeSelector('line'));
      await snapshotLegend(container);
    });

    it('should render one empty legend item if Area has no dataKey', async () => {
      const { container } = await rechartsTestRender(
        <AreaChart width={500} height={500} data={numericalData}>
          <Legend />
          {/* @ts-expect-error Indeed Typescript is correct, Area requires a dataKey */}
          <Area />
        </AreaChart>,
      );
      await snapshotLegend(container);
    });

    describe('with `name` prop on Area', () => {
      const renderTestCase = createSelectorTestCase(({ children }) => (
        <AreaChart width={500} height={500} data={numericalData}>
          <Legend />
          <Area dataKey="percent" name="%" />
          {children}
        </AreaChart>
      ));

      it('should set legend item from `name` prop on Area, and update it after rerender', async () => {
        const { container, rerender } = await renderTestCase();
        await snapshotLegend(container);
        await rerender(({ children }) => (
          <AreaChart width={500} height={500} data={numericalData}>
            <Legend />
            <Area dataKey="percent" name="Percent" />
            {children}
          </AreaChart>
        ));
        await snapshotLegend(container);
      });

      it('should select legend payload', async () => {
        const { spy } = await renderTestCase(selectLegendPayload);
        expectLastCalledWith(spy, [
          {
            inactive: false,
            dataKey: 'percent',
            type: 'line',
            color: 'hotpink',
            value: '%',
            payload: {
              dataKey: 'percent',
              name: '%',
              shape: AreaRevealShape,
              activeDot: true,
              animationBegin: 0,
              animationDuration: 1500,
              animationEasing: 'ease',
              animationInterpolateFn: expect.any(Function),
              animationMatchBy: 'index',
              connectNulls: false,
              dot: false,
              fill: 'hotpink',
              fillOpacity: 0.6,
              hide: false,
              isAnimationActive: 'auto',
              label: false,
              legendType: 'line',
              stroke: 'hotpink',
              strokeWidth: 1,
              type: 'linear',
              xAxisId: 0,
              yAxisId: 0,
              zIndex: DefaultZIndexes.area,
            },
          },
        ]);
      });
    });

    it('should not implicitly read `name` and `fill` properties from the data array', async () => {
      const { container, getByText } = await rechartsTestRender(
        <AreaChart width={500} height={500} data={dataWithSpecialNameAndFillProperties}>
          <Legend />
          <Area dataKey="value" />
        </AreaChart>,
      );
      await snapshotLegend(container);
      await expect.element(getByText('name1', { exact: true })).not.toBeInTheDocument();
      await expect.element(getByText('name2', { exact: true })).not.toBeInTheDocument();
      await expect.element(getByText('name3', { exact: true })).not.toBeInTheDocument();
      await expect.element(getByText('name4', { exact: true })).not.toBeInTheDocument();
      await expect.element(page.getByCSS('[fill="fill1"]')).not.toBeInTheDocument();
      await expect.element(page.getByCSS('[fill="fill2"]')).not.toBeInTheDocument();
      await expect.element(page.getByCSS('[fill="fill3"]')).not.toBeInTheDocument();
      await expect.element(page.getByCSS('[fill="fill4"]')).not.toBeInTheDocument();
    });

    it('should disappear after Area element is removed', async () => {
      const { container, rerender } = await rechartsTestRender(
        <AreaChart width={500} height={500} data={dataWithSpecialNameAndFillProperties}>
          <Legend />
          <Area dataKey="name" />
          <Area dataKey="value" />
        </AreaChart>,
      );
      await snapshotLegend(container);

      await rerender(
        <AreaChart width={500} height={500} data={dataWithSpecialNameAndFillProperties}>
          <Legend />
          <Area dataKey="value" />
        </AreaChart>,
      );
      await snapshotLegend(container);
    });

    it('should update legend if Area data changes', async () => {
      const { container, rerender } = await rechartsTestRender(
        <AreaChart width={500} height={500} data={numericalData}>
          <Legend />
          <Area dataKey="value" />
        </AreaChart>,
      );
      await snapshotLegend(container);

      await rerender(
        <AreaChart width={500} height={500} data={numericalData}>
          <Legend />
          <Area dataKey="percent" />
        </AreaChart>,
      );
      await snapshotLegend(container);
    });

    describe('legendType symbols', () => {
      describe('with default color', () => {
        test.each(legendTypeSymbols)(
          'should render element $selector for legendType $legendType',
          async ({ legendType, selector }) => {
            const { container } = await rechartsTestRender(
              <AreaChart width={500} height={500} data={categoricalData}>
                <Legend />
                <Area dataKey="value" legendType={legendType} />
              </AreaChart>,
            );
            assertLegendIcon(container, selector);
            await snapshotLegend(container);
          },
        );
      });

      describe('with explicit fill and undefined stroke, should still use default stroke', () => {
        test.each(legendTypeSymbols)(
          'should render legend colors for $selector for legendType $legendType',
          async ({ legendType, selector }) => {
            const { container } = await rechartsTestRender(
              <AreaChart width={500} height={500} data={numericalData}>
                <Legend />
                <Area dataKey="percent" legendType={legendType} fill="red" />
              </AreaChart>,
            );
            assertLegendIcon(container, selector);
            await snapshotLegend(container);
          },
        );
      });

      describe('with explicit stroke', () => {
        test.each(legendTypeSymbols)(
          'should render legend colors for $selector for legendType $legendType',
          async ({ legendType, selector }) => {
            const { container } = await rechartsTestRender(
              <AreaChart width={500} height={500} data={numericalData}>
                <Legend />
                <Area dataKey="percent" legendType={legendType} stroke="yellow" />
              </AreaChart>,
            );
            assertLegendIcon(container, selector);
            await snapshotLegend(container);
          },
        );
      });

      describe('with both fill and stroke', () => {
        test.each(legendTypeSymbols)(
          'should render legend colors for $selector for legendType $legendType',
          async ({ legendType, selector }) => {
            const { container } = await rechartsTestRender(
              <AreaChart width={500} height={500} data={numericalData}>
                <Legend />
                <Area dataKey="percent" legendType={legendType} stroke="gold" fill="green" />
              </AreaChart>,
            );
            assertLegendIcon(container, selector);
            await snapshotLegend(container);
          },
        );
      });

      describe('with stroke = none', () => {
        test.each(legendTypeSymbols)(
          'should render legend colors for $selector for legendType $legendType',
          async ({ legendType, selector }) => {
            const { container } = await rechartsTestRender(
              <AreaChart width={500} height={500} data={numericalData}>
                <Legend />
                <Area dataKey="percent" legendType={legendType} stroke="none" fill="green" />
              </AreaChart>,
            );
            assertLegendIcon(container, selector);
            await snapshotLegend(container);
          },
        );
      });

      it('should prefer Legend.iconType over Area.legendType', async () => {
        const { container } = await rechartsTestRender(
          <AreaChart width={500} height={500} data={numericalData}>
            <Legend iconType="circle" />
            <Area dataKey="value" legendType="square" />
          </AreaChart>,
        );
        assertLegendIcon(container, getLegendTypeSelector('circle'));
        await snapshotLegend(container);
      });
    });

    it('should render legend', async () => {
      const { container } = await rechartsTestRender(
        <AreaChart width={500} height={500} data={numericalData}>
          <Legend />
          <Area dataKey="value" />
        </AreaChart>,
      );
      await snapshotLegend(container);
    });
  });

  describe('as a child of AreaChart when data is defined on graphical item', () => {
    it('should render legend', async () => {
      const { container } = await rechartsTestRender(
        <AreaChart width={500} height={500}>
          <Legend />
          <Area dataKey="value" data={numericalData} />
        </AreaChart>,
      );
      await snapshotLegend(container);
    });
  });

  describe('as a child of ComposedChart', () => {
    it('should render one legend item for each allowed graphical element, even if their dataKey does not match the data or is undefined', async () => {
      const { container, getByText } = await rechartsTestRender(
        <ComposedChart width={500} height={500} data={categoricalData}>
          <Legend />
          <Area dataKey="value" />
          <Area dataKey="wrong" />
          <Area dataKey="wrong but invisible" name="Wrong 1" />
          <Bar dataKey="color" />
          <Bar dataKey="unknown" />
          <Bar dataKey="unknown but invisible" name="Wrong 2" />
          <Line dataKey="bad" />
          <Line dataKey="bad but invisible" name="Wrong 3" />
        </ComposedChart>,
      );
      await snapshotLegend(container);
      await expect.element(getByText('wrong but invisible', { exact: true })).not.toBeInTheDocument();
      await expect.element(getByText('unknown but invisible', { exact: true })).not.toBeInTheDocument();
      await expect.element(getByText('bad but invisible', { exact: true })).not.toBeInTheDocument();
    });

    it('should not render legend of unsupported graphical element', async () => {
      const { container } = await rechartsTestRender(
        <ComposedChart width={500} height={500} data={categoricalData}>
          <Legend />
          <Pie dataKey="pie datakey" />
          <Radar dataKey="radar datakey" />
          <RadialBar dataKey="radialbar datakey" />
        </ComposedChart>,
      );
      expectLegendLabels(container, null);
    });

    it('should render legend of Scatter even though it is not a supported graphical element inside ComposedChart', async () => {
      const { container } = await rechartsTestRender(
        <ComposedChart width={500} height={500} data={categoricalData}>
          <Legend />
          <Scatter dataKey="scatter datakey" />
        </ComposedChart>,
      );
      await snapshotLegend(container);
    });

    it('should not implicitly read `name` and `fill` properties from the data array', async () => {
      const { container, getByText } = await rechartsTestRender(
        <ComposedChart width={500} height={500} data={dataWithSpecialNameAndFillProperties}>
          <Legend />
          <Area dataKey="value" />
          <Bar dataKey="color" />
          <Line dataKey="color" />
        </ComposedChart>,
      );
      await snapshotLegend(container);
      await expect.element(getByText('name1', { exact: true })).not.toBeInTheDocument();
      await expect.element(getByText('name2', { exact: true })).not.toBeInTheDocument();
      await expect.element(getByText('name3', { exact: true })).not.toBeInTheDocument();
      await expect.element(getByText('name4', { exact: true })).not.toBeInTheDocument();
      await expect.element(page.getByCSS('[fill="fill1"]')).not.toBeInTheDocument();
      await expect.element(page.getByCSS('[fill="fill2"]')).not.toBeInTheDocument();
      await expect.element(page.getByCSS('[fill="fill3"]')).not.toBeInTheDocument();
      await expect.element(page.getByCSS('[fill="fill4"]')).not.toBeInTheDocument();
    });

    describe('legendType symbols for Area', () => {
      test.each(legendTypeSymbols)(
        'should render element $selector for legendType $legendType',
        async ({ legendType, selector }) => {
          const { container } = await rechartsTestRender(
            <ComposedChart width={500} height={500} data={categoricalData}>
              <Legend />
              <Area dataKey="value" legendType={legendType} />
            </ComposedChart>,
          );
          assertLegendIcon(container, selector);
          await snapshotLegend(container);
        },
      );

      it('should prefer Legend.iconType over Area.legendType', async () => {
        const { container } = await rechartsTestRender(
          <ComposedChart width={500} height={500} data={numericalData}>
            <Legend iconType="circle" />
            <Area dataKey="value" legendType="square" />
          </ComposedChart>,
        );
        assertLegendIcon(container, getLegendTypeSelector('circle'));
        await snapshotLegend(container);
      });
    });

    describe('legendType symbols for Bar', () => {
      test.each(legendTypeSymbols)(
        'should render element $selector for legendType $legendType',
        async ({ legendType, selector }) => {
          const { container } = await rechartsTestRender(
            <ComposedChart width={500} height={500} data={categoricalData}>
              <Legend />
              <Bar dataKey="value" legendType={legendType} />
            </ComposedChart>,
          );
          assertLegendIcon(container, selector);
          await snapshotLegend(container);
        },
      );

      it('should prefer Legend.iconType over Bar.legendType', async () => {
        const { container } = await rechartsTestRender(
          <ComposedChart width={500} height={500} data={numericalData}>
            <Legend iconType="circle" />
            <Bar dataKey="value" legendType="square" />
          </ComposedChart>,
        );
        assertLegendIcon(container, getLegendTypeSelector('circle'));
        await snapshotLegend(container);
      });
    });

    describe('legendType symbols for Line', () => {
      test.each(legendTypeSymbols)(
        'should render element $selector for legendType $legendType',
        async ({ legendType, selector }) => {
          const { container } = await rechartsTestRender(
            <ComposedChart width={500} height={500} data={categoricalData}>
              <Legend />
              <Line dataKey="value" legendType={legendType} />
            </ComposedChart>,
          );
          assertLegendIcon(container, selector);
          await snapshotLegend(container);
        },
      );

      it('should prefer Legend.iconType over Line.legendType', async () => {
        const { container } = await rechartsTestRender(
          <ComposedChart width={500} height={500} data={numericalData}>
            <Legend iconType="circle" />
            <Line dataKey="value" legendType="square" />
          </ComposedChart>,
        );
        assertLegendIcon(container, getLegendTypeSelector('circle'));
        await snapshotLegend(container);
      });
    });
  });

  describe('as a child of PieChart', () => {
    it('should render one legend item for each segment, and it should use nameKey as its label', async () => {
      const { container } = await rechartsTestRender(
        <PieChart width={500} height={500}>
          <Legend />
          <Pie data={numericalData} dataKey="percent" nameKey="value" />
        </PieChart>,
      );
      await snapshotLegend(container);
    });

    it('should render a legend item even if the dataKey does not match anything from the data', async () => {
      const { container } = await rechartsTestRender(
        <PieChart width={500} height={500}>
          <Legend />
          <Pie data={numericalData} dataKey="unknown" />
        </PieChart>,
      );

      // showing the dataKey is better than empty string I imagine - but without the user providing a nameKey, it's the best we can do
      await snapshotLegend(container);
    });

    it('should implicitly use special `name` and `fill` properties from data as legend labels and colors', async () => {
      const { container } = await rechartsTestRender(
        <PieChart width={500} height={500}>
          <Legend />
          <Pie data={dataWithSpecialNameAndFillProperties} dataKey="value" />
        </PieChart>,
      );

      expectLegendLabels(container, [
        { fill: 'fill1', textContent: 'name1' },
        { fill: 'fill2', textContent: 'name2' },
        { fill: 'fill3', textContent: 'name3' },
        { fill: 'fill4', textContent: 'name4' },
      ]);
    });

    describe('itemSorter', () => {
      it('should sort items by the special name property by default', async () => {
        const dataWithSpecialNameAndFillPropertiesInDifferentOrder = [
          { name: 'name2', fill: 'fill2', value: 34 },
          { name: 'name1', fill: 'fill1', value: 12 },
          { name: 'name4', fill: 'fill4', value: 78 },
          { name: 'name3', fill: 'fill3', value: 56 },
        ];

        const { container } = await rechartsTestRender(
          <PieChart width={500} height={500}>
            <Legend />
            <Pie data={dataWithSpecialNameAndFillPropertiesInDifferentOrder} dataKey="value" />
          </PieChart>,
        );

        expectLegendLabels(container, [
          { fill: 'fill1', textContent: 'name1' },
          { fill: 'fill2', textContent: 'name2' },
          { fill: 'fill3', textContent: 'name3' },
          { fill: 'fill4', textContent: 'name4' },
        ]);
      });

      it.each(['dataKey', null] as const)(
        'should leave items in the original data order when itemSorter=%s',
        async itemSorter => {
          const { container } = await rechartsTestRender(
            <PieChart width={500} height={500}>
              <Legend itemSorter={itemSorter} />
              <Pie data={numericalData} dataKey="percent" nameKey="value" />
            </PieChart>,
          );
          await snapshotLegend(container);
        },
      );
    });

    it('should disappear after Pie data is removed', async () => {
      const { container, rerender } = await rechartsTestRender(
        <PieChart width={500} height={500}>
          <Legend />
          <Pie data={numericalData} dataKey="percent" />
          <Pie data={numericalData2} dataKey="value" nameKey="title" />
        </PieChart>,
      );
      await snapshotLegend(container);

      await rerender(
        <PieChart width={500} height={500}>
          <Legend />
          <Pie data={[]} dataKey="percent" />
          <Pie data={numericalData2} dataKey="value" nameKey="title" />
        </PieChart>,
      );
      await snapshotLegend(container);
    });

    it('should disappear after Pie itself is removed', async () => {
      const { container, rerender } = await rechartsTestRender(
        <PieChart width={500} height={500}>
          <Legend />
          <Pie data={numericalData} dataKey="percent" />
          <Pie data={numericalData2} dataKey="value" nameKey="title" />
        </PieChart>,
      );
      await snapshotLegend(container);

      await rerender(
        <PieChart width={500} height={500}>
          <Legend />
          <Pie data={numericalData2} dataKey="value" nameKey="title" />
        </PieChart>,
      );
      await snapshotLegend(container);
    });

    it('should update legend if Pie data changes', async () => {
      const { container, rerender } = await rechartsTestRender(
        <PieChart width={500} height={500}>
          <Legend />
          <Pie data={numericalData} dataKey="percent" nameKey="value" />
        </PieChart>,
      );
      await snapshotLegend(container);

      await rerender(
        <PieChart width={500} height={500}>
          <Legend />
          <Pie data={numericalData2} dataKey="value" nameKey="title" />
        </PieChart>,
      );
      await snapshotLegend(container);
    });

    it('should update legend if nameKey changes', async () => {
      const { container, rerender } = await rechartsTestRender(
        <PieChart width={500} height={500}>
          <Legend />
          <Pie data={numericalData} dataKey="percent" nameKey="value" />
        </PieChart>,
      );
      await snapshotLegend(container);

      await rerender(
        <PieChart width={500} height={500}>
          <Legend />
          <Pie data={numericalData} dataKey="percent" nameKey="percent" />
        </PieChart>,
      );
      await snapshotLegend(container);
    });

    describe('legendType symbols', () => {
      test.each(legendTypeSymbols)(
        'should render element $selector for legendType $legendType',
        async ({ legendType, selector }) => {
          const { container } = await rechartsTestRender(
            <PieChart width={500} height={500}>
              <Legend />
              <Pie data={numericalData} dataKey="percent" legendType={legendType} />
            </PieChart>,
          );
          assertLegendIcon(container, selector);
          await snapshotLegend(container);
        },
      );

      it('should prefer Legend.iconType over Pie.legendType', async () => {
        const { container } = await rechartsTestRender(
          <PieChart width={500} height={500}>
            <Legend iconType="circle" />
            <Pie data={numericalData} dataKey="percent" legendType="square" />
          </PieChart>,
        );
        assertLegendIcon(container, getLegendTypeSelector('circle'));
        await snapshotLegend(container);
      });
    });
  });

  describe('as a child of RadarChart', () => {
    it('should render one rect legend item for each Radar, with default class and style attributes', async () => {
      const { container } = await rechartsTestRender(
        <RadarChart width={500} height={500} data={numericalData}>
          <Legend />
          <Radar dataKey="percent" />
          <Radar dataKey="value" />
        </RadarChart>,
      );

      const legendItems = assertHasLegend(container);

      expect.soft(legendItems[0].getAttributeNames()).toEqual(['class', 'style']);
      await expect
        .element(page.elementLocator(legendItems[0]))
        .toHaveAttribute('class', 'recharts-legend-item legend-item-0');
      expect.soft(legendItems[1].getAttributeNames()).toEqual(['class', 'style']);
      await expect
        .element(page.elementLocator(legendItems[1]))
        .toHaveAttribute('class', 'recharts-legend-item legend-item-1');

      // in absence of explicit `legendType`, Radar should default to rect
      assertLegendIcon(container, getLegendTypeSelector('rect'));
      await snapshotLegend(container);
    });

    it('should render a legend item even if the dataKey does not match anything from the data', async () => {
      const { container } = await rechartsTestRender(
        <RadarChart width={500} height={500} data={numericalData}>
          <Legend />
          <Radar dataKey="unknown" />
        </RadarChart>,
      );
      await snapshotLegend(container);
    });

    it('should change color and className of hidden Radar', async () => {
      const { container } = await rechartsTestRender(
        <RadarChart width={500} height={500} data={numericalData}>
          <Legend inactiveColor="yellow" />
          {/* this will ignore the stroke and use inactive color on legend */}
          <Radar dataKey="percent" stroke="red" hide />
        </RadarChart>,
      );
      const legendItems = assertHasLegend(container);

      expect.soft(legendItems[0].getAttributeNames()).toEqual(['class', 'style']);
      await expect
        .element(page.elementLocator(legendItems[0]))
        .toHaveAttribute('class', 'recharts-legend-item legend-item-0 inactive');

      // in absence of explicit `legendType`, Radar should default to rect
      assertLegendIcon(container, getLegendTypeSelector('rect'));
      await snapshotLegend(container);
    });

    it('should have a default inactive Radar legend color', async () => {
      const { container } = await rechartsTestRender(
        <RadarChart width={500} height={500} data={numericalData}>
          <Legend />
          {/* this will ignore the stroke and use inactive color on legend */}
          <Radar dataKey="percent" stroke="red" hide />
        </RadarChart>,
      );
      const legendItems = assertHasLegend(container);

      expect.soft(legendItems[0].getAttributeNames()).toEqual(['class', 'style']);
      await expect
        .element(page.elementLocator(legendItems[0]))
        .toHaveAttribute('class', 'recharts-legend-item legend-item-0 inactive');

      // in absence of explicit `legendType`, Radar should default to rect
      assertLegendIcon(container, getLegendTypeSelector('rect'));
      await snapshotLegend(container);
    });

    it('should render one empty legend item if Radar has no dataKey', async () => {
      const { container } = await rechartsTestRender(
        <RadarChart width={500} height={500} data={numericalData}>
          <Legend />
          <Radar />
        </RadarChart>,
      );
      await snapshotLegend(container);
    });

    it('should set legend item from `name` prop on Radar, and update it after rerender', async () => {
      const { rerender, container } = await rechartsTestRender(
        <RadarChart width={500} height={500} data={numericalData}>
          <Legend />
          <Radar dataKey="percent" name="%" />
        </RadarChart>,
      );
      await snapshotLegend(container);

      await rerender(
        <RadarChart width={500} height={500} data={numericalData}>
          <Legend />
          <Radar dataKey="percent" name="Percent" />
        </RadarChart>,
      );
      await snapshotLegend(container);
    });

    it('should not implicitly read `name` and `fill` properties from the data array', async () => {
      const { container } = await rechartsTestRender(
        <RadarChart width={500} height={500} data={dataWithSpecialNameAndFillProperties}>
          <Legend />
          <Radar dataKey="value" />
        </RadarChart>,
      );
      await snapshotLegend(container);
    });

    it('should disappear after Radar element is removed', async () => {
      const { container, rerender } = await rechartsTestRender(
        <RadarChart width={500} height={500} data={dataWithSpecialNameAndFillProperties}>
          <Legend />
          <Radar dataKey="name" />
          <Radar dataKey="value" />
        </RadarChart>,
      );
      await snapshotLegend(container);

      await rerender(
        <RadarChart width={500} height={500} data={dataWithSpecialNameAndFillProperties}>
          <Legend />
          <Radar dataKey="value" />
        </RadarChart>,
      );
      await snapshotLegend(container);
    });

    it('should update legend if Radar data changes', async () => {
      const { container, rerender } = await rechartsTestRender(
        <RadarChart width={500} height={500} data={numericalData}>
          <Legend />
          <Radar dataKey="value" />
        </RadarChart>,
      );
      await snapshotLegend(container);

      await rerender(
        <RadarChart width={500} height={500} data={numericalData}>
          <Legend />
          <Radar dataKey="percent" />
        </RadarChart>,
      );
      await snapshotLegend(container);
    });

    describe('legendType symbols without color', () => {
      test.each(legendTypeSymbols)(
        'should render element $selector for legendType $legendType',
        async ({ legendType, selector }) => {
          const { container } = await rechartsTestRender(
            <RadarChart width={500} height={500} data={numericalData}>
              <Legend />
              <Radar dataKey="percent" legendType={legendType} />
            </RadarChart>,
          );
          assertLegendIcon(container, selector);
          await snapshotLegend(container);
        },
      );

      it('should prefer Legend.iconType over Radar.legendType', async () => {
        const { container } = await rechartsTestRender(
          <RadarChart width={500} height={500} data={numericalData}>
            <Legend iconType="circle" />
            <Radar dataKey="value" legendType="square" />
          </RadarChart>,
        );
        assertLegendIcon(container, getLegendTypeSelector('circle'));
        await snapshotLegend(container);
      });
    });

    describe('legendType symbols with explicit fill', () => {
      test.each(legendTypeSymbols)(
        'should render legend colors for $selector for legendType $legendType',
        async ({ legendType, selector }) => {
          const { container } = await rechartsTestRender(
            <RadarChart width={500} height={500} data={numericalData}>
              <Legend />
              <Radar dataKey="percent" legendType={legendType} fill="red" />
            </RadarChart>,
          );
          assertLegendIcon(container, selector);
          await snapshotLegend(container);
        },
      );
    });

    describe('legendType symbols with explicit stroke', () => {
      test.each(legendTypeSymbols)(
        'should render legend colors for $selector for legendType $legendType',
        async ({ legendType, selector }) => {
          const { container } = await rechartsTestRender(
            <RadarChart width={500} height={500} data={numericalData}>
              <Legend />
              <Radar dataKey="percent" legendType={legendType} stroke="yellow" />
            </RadarChart>,
          );
          assertLegendIcon(container, selector);
          await snapshotLegend(container);
        },
      );
    });

    describe('legendType symbols with both fill and stroke', () => {
      test.each(legendTypeSymbols)(
        'should render legend colors for $selector for legendType $legendType',
        async ({ legendType, selector }) => {
          const { container } = await rechartsTestRender(
            <RadarChart width={500} height={500} data={numericalData}>
              <Legend />
              <Radar dataKey="percent" legendType={legendType} stroke="gold" fill="green" />
            </RadarChart>,
          );
          assertLegendIcon(container, selector);
          await snapshotLegend(container);
        },
      );
    });

    describe('legendType symbols with stroke = none', () => {
      test.each(legendTypeSymbols)(
        'should render legend colors for $selector for legendType $legendType',
        async ({ legendType, selector }) => {
          const { container } = await rechartsTestRender(
            <RadarChart width={500} height={500} data={numericalData}>
              <Legend />
              <Radar dataKey="percent" legendType={legendType} stroke="none" fill="green" />
            </RadarChart>,
          );
          assertLegendIcon(container, selector);
          await snapshotLegend(container);
        },
      );
    });
  });

  describe('as a child of RadialBarChart', () => {
    it('should render one legend item for each segment, with no label text, and rect icon with no color, by default', async () => {
      const { container } = await rechartsTestRender(
        <RadialBarChart width={500} height={500} data={numericalData}>
          <Legend />
          <RadialBar dataKey="percent" label />
        </RadialBarChart>,
      );
      assertLegendIcon(container, getLegendTypeSelector('rect'));
      await snapshotLegend(container);
    });

    it('should render a legend item even if the dataKey does not match anything from the data', async () => {
      const { container } = await rechartsTestRender(
        <RadialBarChart width={500} height={500} data={numericalData}>
          <Legend />
          <RadialBar dataKey="unknown" />
        </RadialBarChart>,
      );
      await snapshotLegend(container);
    });

    it('should use special `name` and `fill` properties from data as legend labels and colors', async () => {
      // I think this is the only way to set legend labels for RadialBarChart?
      const { container } = await rechartsTestRender(
        <RadialBarChart width={500} height={500} data={dataWithSpecialNameAndFillProperties}>
          <Legend />
          <RadialBar dataKey="percent" />
        </RadialBarChart>,
      );

      expectLegendLabels(container, [
        { fill: 'fill1', textContent: 'name1' },
        { fill: 'fill2', textContent: 'name2' },
        { fill: 'fill3', textContent: 'name3' },
        { fill: 'fill4', textContent: 'name4' },
      ]);
    });

    it('should use special `name` and `fill` properties from data as legend labels and colors, even if the dataKey does not match', async () => {
      const { container } = await rechartsTestRender(
        <RadialBarChart width={500} height={500} data={dataWithSpecialNameAndFillProperties}>
          <Legend />
          <RadialBar dataKey="unknown" />
        </RadialBarChart>,
      );
      expectLegendLabels(container, [
        { fill: 'fill1', textContent: 'name1' },
        { fill: 'fill2', textContent: 'name2' },
        { fill: 'fill3', textContent: 'name3' },
        { fill: 'fill4', textContent: 'name4' },
      ]);
    });

    it('should disappear after RadialBar itself is removed', async () => {
      const { container, rerender } = await rechartsTestRender(
        <RadialBarChart width={500} height={500} data={numericalData}>
          <Legend />
          <RadialBar dataKey="percent" />
          <RadialBar dataKey="value" />
        </RadialBarChart>,
      );
      await snapshotLegend(container);

      await rerender(
        <RadialBarChart width={500} height={500} data={numericalData}>
          <Legend />
          <RadialBar dataKey="value" />
        </RadialBarChart>,
      );
      await snapshotLegend(container);

      await rerender(
        <RadialBarChart width={500} height={500}>
          <Legend />
        </RadialBarChart>,
      );
      expectLegendLabels(container, null);
    });

    it('should update legend if RadialBarChart data changes', async () => {
      const { container, rerender } = await rechartsTestRender(
        <RadialBarChart width={500} height={500} data={numericalData}>
          <Legend />
          <RadialBar dataKey="percent" />
        </RadialBarChart>,
      );
      // all these are empty because numericalData does not have .name property
      await snapshotLegend(container);

      await rerender(
        <RadialBarChart width={500} height={500} data={dataWithSpecialNameAndFillProperties}>
          <Legend />
          <RadialBar dataKey="value" />
        </RadialBarChart>,
      );
      expectLegendLabels(container, [
        { fill: 'fill1', textContent: 'name1' },
        { fill: 'fill2', textContent: 'name2' },
        { fill: 'fill3', textContent: 'name3' },
        { fill: 'fill4', textContent: 'name4' },
      ]);
    });

    describe('legendType symbols', () => {
      test.each(legendTypeSymbols)(
        'should render element $selector for legendType $legendType',
        async ({ legendType, selector }) => {
          const { container } = await rechartsTestRender(
            <RadialBarChart width={500} height={500} data={numericalData}>
              <Legend />
              <RadialBar dataKey="percent" legendType={legendType} />
            </RadialBarChart>,
          );
          assertLegendIcon(container, selector);
          await snapshotLegend(container);
        },
      );
    });

    it('should prefer Legend.iconType over RadialBar.legendType', async () => {
      const { container } = await rechartsTestRender(
        <RadialBarChart width={500} height={500} data={numericalData}>
          <Legend iconType="circle" />
          <RadialBar dataKey="value" legendType="square" />
        </RadialBarChart>,
      );
      assertLegendIcon(container, getLegendTypeSelector('circle'));
      await snapshotLegend(container);
    });
  });

  describe('as a child of ScatterChart', () => {
    it('should render one legend item for each Scatter', async () => {
      const { container } = await rechartsTestRender(
        <ScatterChart width={500} height={500} data={numericalData}>
          <Legend />
          <Scatter dataKey="percent" />
          <Scatter dataKey="value" />
        </ScatterChart>,
      );
      await snapshotLegend(container);
    });

    it('should not use `fill` from data for the legend fill', async () => {
      const { container } = await rechartsTestRender(
        <ScatterChart width={500} height={500} data={dataWithSpecialNameAndFillProperties}>
          <Legend />
          <Scatter dataKey="value" />
        </ScatterChart>,
      );
      await snapshotLegend(container);
    });

    describe('legendType symbols', () => {
      test.each(legendTypeSymbols)(
        'should render element $selector for legendType $legendType',
        async ({ legendType, selector }) => {
          const { container } = await rechartsTestRender(
            <ScatterChart width={500} height={500} data={numericalData}>
              <Legend />
              <Scatter dataKey="percent" legendType={legendType} />
            </ScatterChart>,
          );
          assertLegendIcon(container, selector);
          await snapshotLegend(container);
        },
      );

      it('should prefer Legend.iconType over Scatter.legendType', async () => {
        const { container } = await rechartsTestRender(
          <ScatterChart width={500} height={500} data={numericalData}>
            <Legend iconType="circle" />
            <Scatter dataKey="value" legendType="square" />
          </ScatterChart>,
        );
        assertLegendIcon(container, getLegendTypeSelector('circle'));
        await snapshotLegend(container);
      });
    });

    describe('legendType symbols with explicit fill', () => {
      test.each(legendTypeSymbols)(
        'should render legend colors for $selector for legendType $legendType',
        async ({ legendType, selector }) => {
          const { container } = await rechartsTestRender(
            <ScatterChart width={500} height={500} data={numericalData}>
              <Legend />
              <Scatter dataKey="percent" legendType={legendType} fill="red" />
            </ScatterChart>,
          );
          assertLegendIcon(container, selector);
          await snapshotLegend(container);
        },
      );
    });
  });

  describe('as a child of ScatterChart with data defined on graphical item', () => {
    const renderTestCase = createSelectorTestCase(({ children }) => (
      <ScatterChart width={500} height={500}>
        <Legend />
        <Scatter dataKey="value" data={dataWithSpecialNameAndFillProperties} />
        {children}
      </ScatterChart>
    ));

    it('should render legend', async () => {
      const { container } = await renderTestCase();
      await snapshotLegend(container);
    });
  });

  describe('click events', () => {
    it('should call onClick when clicked', async () => {
      const onClick: Mock<
        (payload: LegendPayload, index: number, ev: React.MouseEvent<HTMLElement, MouseEvent>) => void
      > = vi.fn();
      const { container } = await rechartsTestRender(
        <ScatterChart width={500} height={500} data={numericalData}>
          <Legend onClick={onClick} />
          <Scatter dataKey="percent" />
        </ScatterChart>,
      );
      expect(onClick).toHaveBeenCalledTimes(0);
      const legend = container.querySelector('.recharts-legend-item');
      assertNotNull(legend);
      await userEvent.click(legend);
      expect(onClick).toHaveBeenCalledTimes(1);
      const expectedPayload: LegendPayload = {
        color: undefined,
        dataKey: 'percent',
        inactive: false,
        payload: {
          animationBegin: 0,
          animationDuration: 400,
          animationEasing: 'linear',
          animationInterpolateFn: expect.any(Function),
          animationMatchBy: 'append',
          dataKey: 'percent',
          hide: false,
          isAnimationActive: 'auto',
          label: false,
          legendType: 'circle',
          line: false,
          lineJointType: 'linear',
          lineType: 'joint',
          shape: 'circle',
          xAxisId: 0,
          yAxisId: 0,
          zAxisId: 0,
          zIndex: 600,
        },
        type: 'circle',
        value: 'percent',
      };
      expect(onClick).toHaveBeenLastCalledWith(expectedPayload, 0, expect.objectContaining({ type: 'click' }));
    });
  });

  describe('legend portal', () => {
    it('nothing is rendered if legend portal is undefined and there is no chart context', async () => {
      const { container } = await rechartsTestRender(
        <Surface height={100} width={100}>
          <Legend portal={undefined} />
          <Scatter data={numericalData} dataKey="percent" />
        </Surface>,
      );

      expect(container.querySelectorAll('.recharts-legend-wrapper')).toHaveLength(0);
    });

    it('should render outside of SVG, as a direct child of recharts-wrapper by default', async () => {
      const { container } = await rechartsTestRender(
        <ScatterChart width={500} height={500} data={numericalData}>
          <Legend />
          <Scatter dataKey="percent" />
        </ScatterChart>,
      );

      expect(container.querySelectorAll('.recharts-wrapper svg .recharts-legend-wrapper')).toHaveLength(0);
      await expect.element(page.getByCSS('.recharts-wrapper > .recharts-legend-wrapper')).toBeVisible();
    });

    it('should render in a custom portal if "portal" prop is set', async () => {
      function Example() {
        const [portalRef, setPortalRef] = useState<HTMLElement | null>(null);

        return (
          <>
            <ScatterChart width={500} height={500} data={numericalData}>
              <Legend portal={portalRef} wrapperStyle={{ margin: '20px' }} />
              <Scatter dataKey="percent" />
            </ScatterChart>
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
      await rechartsTestRender(<Example />);

      await expect.element(page.getByCSS('.recharts-wrapper .recharts-legend-wrapper')).not.toBeInTheDocument();
      // The legend has the margin from wrapperStyle, and none of the internal absolute position styles
      await takeSnapshot();
      await expect
        .element(page.getByCSS('[data-testid="my-custom-portal-target"] > .recharts-legend-wrapper'))
        .toBeVisible();
    });
  });

  describe('state integration', () => {
    it('should publish its size, and then update it when removed from DOM', async () => {
      mockGetBoundingClientRect({ width: 3, height: 11 });
      const legendSpy = vi.fn();
      const Comp = (): null => {
        legendSpy(useAppSelector(selectLegendSize));
        return null;
      };

      const { rerender } = await rechartsTestRender(
        <BarChart width={500} height={500} data={numericalData}>
          <Legend />
          <Comp />
        </BarChart>,
      );

      const expectedAfterFirstRender: Size = {
        height: 11,
        width: 3,
      };
      expect(legendSpy).toHaveBeenLastCalledWith(expectedAfterFirstRender);
      expect(legendSpy).toHaveBeenCalledTimes(2);

      await rerender(
        <BarChart width={500} height={500} data={numericalData}>
          <Comp />
        </BarChart>,
      );

      const expectedAfterSecondRender: Size = {
        height: 0,
        width: 0,
      };
      expect(legendSpy).toHaveBeenLastCalledWith(expectedAfterSecondRender);
      expect(legendSpy).toHaveBeenCalledTimes(3);
    });
  });
});
