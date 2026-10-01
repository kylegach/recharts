import { beforeEach, describe, expect, it, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import {
  Area,
  AreaChart,
  LineDrawShape,
  DefaultLegendContentProps,
  DefaultZIndexes,
  Legend,
  LegendPayload,
  Line,
  LineChart,
} from '../../../src';
import { numericalData } from '../../_data';
import { createSelectorTestCase } from '../../helper/browser/createSelectorTestCase';
import { flushPendingFrames } from '../../helper/browser/act';
import { expectLastCalledWith } from '../../helper/expectLastCalledWith';
import { assertNotNull } from '../../helper/assertNotNull';
import { snapshotLegend } from '../../helper/browser/snapshot';

describe('Legend.itemSorter', () => {
  describe('with default content', () => {
    test('sorts legend items by label value by default', async () => {
      const { container } = await render(
        <LineChart width={500} height={500} data={numericalData}>
          <Legend />
          <Line dataKey="percent" name="B" />
          <Line dataKey="value" name="A" />
        </LineChart>,
      );

      await snapshotLegend(container);
    });

    test('sorts legend items when itemSorter=dataKey', async () => {
      const { container } = await render(
        <LineChart width={500} height={500} data={numericalData}>
          <Legend itemSorter="dataKey" />
          <Line dataKey="percent" name="B" />
          <Line dataKey="value" name="A" />
        </LineChart>,
      );

      await snapshotLegend(container);
    });
  });

  describe('when Legend content is a function', () => {
    it('should pass legend items sorted by label value by default', async () => {
      // this should sort by label value, but it does not
      const customContent = vi.fn();

      await render(
        <LineChart width={500} height={500} data={numericalData}>
          <Legend content={customContent} />
          <Line dataKey="percent" name="B" />
          <Line dataKey="value" name="A" />
        </LineChart>,
      );

      expect(customContent).toHaveBeenLastCalledWith(
        {
          align: 'center',
          chartHeight: 500,
          chartWidth: 500,
          content: customContent,
          iconSize: 14,
          inactiveColor: '#ccc',
          itemSorter: 'value',
          labelStyle: {},
          layout: 'horizontal',
          margin: {
            bottom: 5,
            left: 5,
            right: 5,
            top: 5,
          },
          offset: 0,
          payload: [
            {
              color: '#3182bd',
              dataKey: 'value',
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
                dataKey: 'value',
                dot: true,
                fill: '#fff',
                hide: false,
                isAnimationActive: 'auto',
                label: false,
                legendType: 'line',
                name: 'A',
                shape: LineDrawShape,
                stroke: '#3182bd',
                strokeWidth: 1,
                type: 'linear',
                xAxisId: 0,
                yAxisId: 0,
                zIndex: DefaultZIndexes.line,
              },
              type: 'line',
              value: 'A',
            },
            {
              color: '#3182bd',
              dataKey: 'percent',
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
                dataKey: 'percent',
                dot: true,
                fill: '#fff',
                hide: false,
                isAnimationActive: 'auto',
                label: false,
                legendType: 'line',
                name: 'B',
                shape: LineDrawShape,
                stroke: '#3182bd',
                strokeWidth: 1,
                type: 'linear',
                xAxisId: 0,
                yAxisId: 0,
                zIndex: DefaultZIndexes.line,
              },
              type: 'line',
              value: 'B',
            },
          ],
          verticalAlign: 'bottom',
          width: 490,
        },
        {},
      );
    });

    it('should pass legend items sorted by dataKey when itemSorter is set', async () => {
      const customContent = vi.fn();

      await render(
        <LineChart width={500} height={500} data={numericalData}>
          <Legend content={customContent} itemSorter="dataKey" />
          <Line dataKey="percent" name="B" />
          <Line dataKey="value" name="A" />
        </LineChart>,
      );

      expect(customContent).toHaveBeenLastCalledWith(
        {
          align: 'center',
          chartHeight: 500,
          chartWidth: 500,
          content: customContent,
          iconSize: 14,
          inactiveColor: '#ccc',
          itemSorter: 'dataKey',
          labelStyle: {},
          layout: 'horizontal',
          margin: {
            bottom: 5,
            left: 5,
            right: 5,
            top: 5,
          },
          offset: 0,
          payload: [
            {
              color: '#3182bd',
              dataKey: 'percent',
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
                dataKey: 'percent',
                dot: true,
                fill: '#fff',
                hide: false,
                isAnimationActive: 'auto',
                label: false,
                legendType: 'line',
                name: 'B',
                shape: LineDrawShape,
                stroke: '#3182bd',
                strokeWidth: 1,
                type: 'linear',
                xAxisId: 0,
                yAxisId: 0,
                zIndex: DefaultZIndexes.line,
              },
              type: 'line',
              value: 'B',
            },
            {
              color: '#3182bd',
              dataKey: 'value',
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
                dataKey: 'value',
                dot: true,
                fill: '#fff',
                hide: false,
                isAnimationActive: 'auto',
                label: false,
                legendType: 'line',
                name: 'A',
                shape: LineDrawShape,
                stroke: '#3182bd',
                strokeWidth: 1,
                type: 'linear',
                xAxisId: 0,
                yAxisId: 0,
                zIndex: DefaultZIndexes.line,
              },
              type: 'line',
              value: 'A',
            },
          ],
          verticalAlign: 'bottom',
          width: 490,
        },
        {},
      );
    });
  });

  describe('when Legend content hides and shows items on click', () => {
    function MyLegendHidingComponent({ children }: { children: ReactNode }) {
      const [hiddenItems, setHiddenItems] = React.useState<ReadonlyArray<string>>([]);

      const handleClick = React.useCallback(({ dataKey }: LegendPayload) => {
        if (typeof dataKey !== 'string') {
          return;
        }
        setHiddenItems(prev => (prev.includes(dataKey) ? prev.filter(key => key !== dataKey) : [...prev, dataKey]));
      }, []);

      return (
        <LineChart width={500} height={500} data={numericalData}>
          <Legend itemSorter="dataKey" onClick={handleClick} />
          <Line
            dataKey="percent"
            name="B"
            stroke={hiddenItems.includes('percent') ? 'gold' : 'red'}
            hide={hiddenItems.includes('percent')}
          />
          <Line
            dataKey="value"
            name="A"
            stroke={hiddenItems.includes('value') ? 'silver' : 'blue'}
            hide={hiddenItems.includes('value')}
          />
          {children}
        </LineChart>
      );
    }

    const renderTestCase = createSelectorTestCase(MyLegendHidingComponent);

    describe('on initial render', () => {
      it('should render all items sorted by dataKey', async () => {
        const { container } = await renderTestCase();

        await snapshotLegend(container);
      });
    });

    describe('after clicking on legend items', () => {
      it('should hide the clicked item and keep the order', async () => {
        const { container, getByText } = await renderTestCase();

        await getByText('A', { exact: true }).click();
        await flushPendingFrames();
        await snapshotLegend(container);

        await getByText('B', { exact: true }).click();
        await flushPendingFrames();
        await snapshotLegend(container);
      });

      it('should show the clicked item again and keep the order', async () => {
        const { container, getByText } = await renderTestCase();

        await getByText('A', { exact: true }).click();
        await getByText('B', { exact: true }).click();
        await flushPendingFrames();
        await snapshotLegend(container);

        await getByText('B', { exact: true }).click();
        await flushPendingFrames();
        await snapshotLegend(container);

        await getByText('A', { exact: true }).click();
        await flushPendingFrames();
        await snapshotLegend(container);
      });
    });
  });

  describe('when Legend content hides and shows items on click and also it has a custom content', () => {
    const spy = vi.fn();

    beforeEach(() => {
      spy.mockClear();
    });

    const LegendClickContext = createContext<(entry: LegendPayload) => void>(() => {});

    function useItemHiding() {
      const [hiddenItems, setHiddenItems] = useState<ReadonlyArray<string>>([]);

      const handleClick = useCallback(({ dataKey }: LegendPayload) => {
        if (typeof dataKey !== 'string') {
          return;
        }
        setHiddenItems(prev => (prev.includes(dataKey) ? prev.filter(key => key !== dataKey) : [...prev, dataKey]));
      }, []);

      return { hiddenItems, handleClick };
    }

    const MyCustomLegendContent = (props: DefaultLegendContentProps) => {
      const handleClick = useContext(LegendClickContext);
      spy(props);
      assertNotNull(props.payload);
      return (
        <ul>
          {props.payload.map(entry => (
            <li key={entry.value} style={{ color: entry.color }}>
              <button type="button" onClick={() => handleClick(entry)}>
                {entry.value}
              </button>
            </li>
          ))}
          {props.children}
        </ul>
      );
    };

    describe('in LineChart', () => {
      /*
       * https://github.com/recharts/recharts/issues/5992
       */
      function MyLegendHidingLineChartTestCase({ children }: { children: ReactNode }) {
        const { hiddenItems, handleClick } = useItemHiding();

        return (
          <LegendClickContext.Provider value={handleClick}>
            <LineChart width={500} height={500} data={numericalData}>
              <Legend itemSorter="dataKey" content={MyCustomLegendContent} />
              <Line
                dataKey="percent"
                name="B"
                stroke={hiddenItems.includes('percent') ? 'gold' : 'red'}
                hide={hiddenItems.includes('percent')}
              />
              <Line
                dataKey="value"
                name="A"
                stroke={hiddenItems.includes('value') ? 'silver' : 'blue'}
                hide={hiddenItems.includes('value')}
              />
              {children}
            </LineChart>
          </LegendClickContext.Provider>
        );
      }

      const renderTestCase = createSelectorTestCase(MyLegendHidingLineChartTestCase);

      describe('on initial render', () => {
        it('should render all items sorted by dataKey', async () => {
          await renderTestCase();

          expectLastCalledWith(
            spy,
            expect.objectContaining({
              payload: [
                expect.objectContaining({ value: 'B', dataKey: 'percent', color: 'red', inactive: false }),
                expect.objectContaining({ value: 'A', dataKey: 'value', color: 'blue', inactive: false }),
              ],
            }),
          );
        });
      });

      describe('after clicking on legend items', () => {
        it('should hide the clicked item and keep the order', async () => {
          const { getByText } = await renderTestCase();

          await getByText('A', { exact: true }).click();
          await flushPendingFrames();
          expectLastCalledWith(
            spy,
            expect.objectContaining({
              payload: [
                expect.objectContaining({ value: 'B', dataKey: 'percent', color: 'red', inactive: false }),
                expect.objectContaining({ value: 'A', dataKey: 'value', color: 'silver', inactive: true }),
              ],
            }),
          );

          await getByText('B', { exact: true }).click();
          await flushPendingFrames();
          expectLastCalledWith(
            spy,
            expect.objectContaining({
              payload: [
                expect.objectContaining({ value: 'B', dataKey: 'percent', color: 'gold', inactive: true }),
                expect.objectContaining({ value: 'A', dataKey: 'value', color: 'silver', inactive: true }),
              ],
            }),
          );
        });
      });
    });

    describe('in stacked AreaChart', () => {
      function MyLegendHidingAreaChartTestCase({ children }: { children: ReactNode }) {
        const { hiddenItems, handleClick } = useItemHiding();

        return (
          <LegendClickContext.Provider value={handleClick}>
            <AreaChart width={500} height={500} data={numericalData}>
              <Legend itemSorter="dataKey" content={MyCustomLegendContent} />
              <Area
                dataKey="percent"
                name="B"
                stackId="1"
                stroke={hiddenItems.includes('percent') ? 'gold' : 'red'}
                hide={hiddenItems.includes('percent')}
              />
              <Area
                dataKey="value"
                name="A"
                stackId="1"
                stroke={hiddenItems.includes('value') ? 'silver' : 'blue'}
                hide={hiddenItems.includes('value')}
              />
              {children}
            </AreaChart>
          </LegendClickContext.Provider>
        );
      }

      const renderTestCase = createSelectorTestCase(MyLegendHidingAreaChartTestCase);

      describe('on initial render', () => {
        it('should render all items sorted by dataKey', async () => {
          await renderTestCase();

          expectLastCalledWith(
            spy,
            expect.objectContaining({
              payload: [
                expect.objectContaining({ value: 'B', dataKey: 'percent', color: 'red', inactive: false }),
                expect.objectContaining({ value: 'A', dataKey: 'value', color: 'blue', inactive: false }),
              ],
            }),
          );
        });
      });

      describe('after clicking on legend items', () => {
        it('should hide the clicked item and keep the order', async () => {
          const { getByText } = await renderTestCase();

          await getByText('A', { exact: true }).click();
          await flushPendingFrames();
          expectLastCalledWith(
            spy,
            expect.objectContaining({
              payload: [
                expect.objectContaining({ value: 'B', dataKey: 'percent', color: 'red', inactive: false }),
                expect.objectContaining({ value: 'A', dataKey: 'value', color: 'silver', inactive: true }),
              ],
            }),
          );

          await getByText('B', { exact: true }).click();
          await flushPendingFrames();
          expectLastCalledWith(
            spy,
            expect.objectContaining({
              payload: [
                expect.objectContaining({ value: 'B', dataKey: 'percent', color: 'gold', inactive: true }),
                expect.objectContaining({ value: 'A', dataKey: 'value', color: 'silver', inactive: true }),
              ],
            }),
          );
        });

        it('should show the clicked item again and keep the order', async () => {
          const { getByText } = await renderTestCase();

          await getByText('A', { exact: true }).click();
          await getByText('B', { exact: true }).click();
          await flushPendingFrames();
          expectLastCalledWith(
            spy,
            expect.objectContaining({
              payload: [
                expect.objectContaining({ value: 'B', dataKey: 'percent', color: 'gold', inactive: true }),
                expect.objectContaining({ value: 'A', dataKey: 'value', color: 'silver', inactive: true }),
              ],
            }),
          );

          await getByText('B', { exact: true }).click();
          await flushPendingFrames();
          expectLastCalledWith(
            spy,
            expect.objectContaining({
              payload: [
                expect.objectContaining({ value: 'B', dataKey: 'percent', color: 'red', inactive: false }),
                expect.objectContaining({ value: 'A', dataKey: 'value', color: 'silver', inactive: true }),
              ],
            }),
          );

          await getByText('A', { exact: true }).click();
          await flushPendingFrames();
          expectLastCalledWith(
            spy,
            expect.objectContaining({
              payload: [
                expect.objectContaining({ value: 'B', dataKey: 'percent', color: 'red', inactive: false }),
                expect.objectContaining({ value: 'A', dataKey: 'value', color: 'blue', inactive: false }),
              ],
            }),
          );
        });
      });
    });
  });
});
