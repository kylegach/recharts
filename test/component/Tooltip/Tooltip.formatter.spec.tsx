import { describe, it, beforeEach } from 'vitest';
import React from 'react';
import { BarChart, YAxis, XAxis, Tooltip, Bar } from '../../../src';
import { PageData } from '../../_data';
import { expectTooltipNotVisible, showTooltip } from '../../helper/browser/tooltipTestHelpers';
import { barChartMouseHoverTooltipSelector } from './tooltipMouseHoverSelectors';
import { mockGetBoundingClientRect } from '../../helper/mockGetBoundingClientRect';
import { createSelectorTestCase } from '../../helper/browser/createSelectorTestCase';
import { selectTooltipPayload } from '../../../src/state/selectors/selectors';
import { expectLastCalledWith } from '../../helper/expectLastCalledWith';
import { snapshotTooltip } from '../../helper/browser/snapshot';

describe('Tooltip.formatter reproducing https://github.com/recharts/recharts/issues/5658', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 100, height: 100 });
  });
  const dataKeyAsFunction = (x: any) => x.pv;

  describe('with a name prop', () => {
    const renderTestCase = createSelectorTestCase(({ children }) => (
      <BarChart
        width={500}
        height={300}
        data={PageData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={() => 'FORMATTED'} />
        <Bar dataKey={dataKeyAsFunction} name="ultraviolet" fill="#8884d8" id="bar-with-function" />
        <Bar dataKey="pv" fill="#8ff4d8" id="bar-pv" />
        {children}
      </BarChart>
    ));

    it('should render inside tooltip value what the formatter returned', async () => {
      const { container } = await renderTestCase();

      await expectTooltipNotVisible(container);

      await showTooltip(container, barChartMouseHoverTooltipSelector);

      await snapshotTooltip(container);
    });

    it('should select payload', async () => {
      const { spy } = await renderTestCase(state => selectTooltipPayload(state, 'axis', 'hover', '1'));
      expectLastCalledWith(spy, [
        {
          color: '#8884d8',
          dataKey: dataKeyAsFunction,
          fill: '#8884d8',
          graphicalItemId: 'bar-with-function',
          hide: false,
          name: 'ultraviolet',
          nameKey: undefined,
          payload: {
            amt: 2400,
            name: 'Page B',
            pv: 4567,
            uv: 300,
          },
          stroke: undefined,
          strokeWidth: undefined,
          type: undefined,
          unit: undefined,
          value: 4567,
        },
        {
          color: '#8ff4d8',
          dataKey: 'pv',
          fill: '#8ff4d8',
          graphicalItemId: 'bar-pv',
          hide: false,
          name: 'pv',
          nameKey: undefined,
          payload: {
            amt: 2400,
            name: 'Page B',
            pv: 4567,
            uv: 300,
          },
          stroke: undefined,
          strokeWidth: undefined,
          type: undefined,
          unit: undefined,
          value: 4567,
        },
      ]);
    });
  });

  describe('without name prop', () => {
    const renderTestCase = createSelectorTestCase(({ children }) => (
      <BarChart
        width={500}
        height={300}
        data={PageData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={() => 'FORMATTED'} />
        <Bar dataKey={dataKeyAsFunction} fill="#8884d8" id="bar-with-function" />
        <Bar dataKey="pv" fill="#8ff4d8" id="bar-pv" />
        {children}
      </BarChart>
    ));

    it('should render inside tooltip value what the formatter returned', async () => {
      const { container } = await renderTestCase();

      await expectTooltipNotVisible(container);

      await showTooltip(container, barChartMouseHoverTooltipSelector);

      await snapshotTooltip(container);
    });

    it('should select payload', async () => {
      const { spy } = await renderTestCase(state => selectTooltipPayload(state, 'axis', 'hover', '1'));
      expectLastCalledWith(spy, [
        {
          color: '#8884d8',
          dataKey: dataKeyAsFunction,
          fill: '#8884d8',
          hide: false,
          name: undefined,
          nameKey: undefined,
          payload: {
            amt: 2400,
            name: 'Page B',
            pv: 4567,
            uv: 300,
          },
          stroke: undefined,
          strokeWidth: undefined,
          type: undefined,
          unit: undefined,
          value: 4567,
          graphicalItemId: 'bar-with-function',
        },
        {
          color: '#8ff4d8',
          dataKey: 'pv',
          fill: '#8ff4d8',
          hide: false,
          name: 'pv',
          nameKey: undefined,
          payload: {
            amt: 2400,
            name: 'Page B',
            pv: 4567,
            uv: 300,
          },
          stroke: undefined,
          strokeWidth: undefined,
          type: undefined,
          unit: undefined,
          value: 4567,
          graphicalItemId: 'bar-pv',
        },
      ]);
    });
  });
});
