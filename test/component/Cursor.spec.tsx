import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { Cursor, CursorConnectedProps, CursorInternal, CursorProps } from '../../src/component/Cursor';
import { RechartsRootState } from '../../src/state/store';
import { RechartsStoreProvider } from '../../src/state/RechartsStoreProvider';
import { arrayTooltipSearcher } from '../../src/state/optionsSlice';
import { produceState } from '../helper/produceState';
import { emptyOffset } from '../helper/offsetHelpers';
import { TooltipPayload } from '../../src/state/tooltipSlice';

const defaultProps: CursorProps = {
  cursor: true,
  tooltipEventType: 'axis',
  coordinate: undefined,
  payload: [],
  index: '0',
};

const baseCoord = {
  x: 0,
  y: 0,
};

const connectedProps: CursorConnectedProps = {
  chartName: '',
  layout: 'vertical',
  offset: emptyOffset,
  tooltipAxisBandSize: 0,
  ...defaultProps,
};

const preloadedState: Partial<RechartsRootState> = {
  options: {
    chartName: '',
    tooltipPayloadSearcher: arrayTooltipSearcher,
    eventEmitter: undefined,
    defaultTooltipEventType: 'axis',
  },
};

const preloadedRadialState: Partial<RechartsRootState> = produceState(draft => {
  draft.layout.layoutType = 'radial';
  draft.layout.margin = { top: 11, right: 22, bottom: 33, left: 4 };
  draft.tooltip.itemInteraction.hover.active = true;
});

describe('Cursor', () => {
  describe('Internal component', () => {
    it('should render a custom cursor', async () => {
      function MyCustomCursor() {
        return <p>I am a cursor.</p>;
      }
      const props: CursorConnectedProps = {
        ...connectedProps,
        cursor: <MyCustomCursor />,
        coordinate: baseCoord,
      };
      const screen = await render(
        <svg width={100} height={100}>
          <CursorInternal {...props} />
        </svg>,
      );
      await expect.element(screen.getByText('I am a cursor.')).toBeVisible();
    });

    it('should render rectangle cursor for bar chart', async () => {
      const props: CursorConnectedProps = {
        layout: 'horizontal',
        ...defaultProps,
        tooltipAxisBandSize: 1,
        chartName: 'BarChart',
        offset: emptyOffset,
        coordinate: baseCoord,
      };
      const screen = await render(
        <svg width={100} height={100}>
          <CursorInternal {...props} />
        </svg>,
      );
      await expect.element(screen.getByCSS('.recharts-rectangle')).toBeVisible();
    });

    it('should render sector cursor for radial layout charts', async () => {
      const coordinate = { endAngle: 2, radius: 1, startAngle: 1, x: 0, y: 0 };
      const props: CursorConnectedProps = {
        chartName: '',
        offset: emptyOffset,
        tooltipAxisBandSize: 0,
        ...defaultProps,
        layout: 'radial',
        coordinate: {
          endAngle: 2,
          radius: 1,
          startAngle: 1,
          x: 0,
          y: 0,
        },
      };
      const screen = await render(
        <svg width={100} height={100}>
          <CursorInternal {...props} coordinate={coordinate} zIndex={0} />
        </svg>,
      );
      await expect.element(screen.getByCSS('.recharts-sector')).toBeVisible();
    });
  });

  describe('Connected component', () => {
    it('should render curve cursor by default', async () => {
      const screen = await render(
        <RechartsStoreProvider preloadedState={preloadedState}>
          <svg width={100} height={100}>
            <Cursor {...defaultProps} coordinate={baseCoord} zIndex={0} />
          </svg>
        </RechartsStoreProvider>,
      );
      await expect.element(screen.getByCSS('.recharts-curve')).toBeVisible();
    });

    it('should render a custom cursor', async () => {
      function MyCustomCursor() {
        return <p>I am a cursor.</p>;
      }
      const props: CursorProps = {
        ...defaultProps,
        cursor: <MyCustomCursor />,
        coordinate: baseCoord,
      };
      const screen = await render(
        <RechartsStoreProvider preloadedState={preloadedState}>
          <svg width={100} height={100}>
            <Cursor {...props} zIndex={0} />
          </svg>
        </RechartsStoreProvider>,
      );
      await expect.element(screen.getByText('I am a cursor.')).toBeVisible();
    });

    it('should render cross cursor for scatter chart', async () => {
      const preloadedScatterState: Partial<RechartsRootState> = produceState(draft => {
        draft.options.chartName = 'ScatterChart';
        draft.options.tooltipPayloadSearcher = arrayTooltipSearcher;
        draft.tooltip.itemInteraction.hover.active = true;
      });
      const screen = await render(
        <RechartsStoreProvider preloadedState={preloadedScatterState}>
          <svg width={100} height={100}>
            <Cursor {...defaultProps} coordinate={baseCoord} zIndex={0} />
          </svg>
        </RechartsStoreProvider>,
      );
      await expect.element(screen.getByCSS('.recharts-cross')).toBeVisible();
    });

    it('should render sector cursor for radial layout charts', async () => {
      const coordinate = { endAngle: 2, radius: 1, startAngle: 1, x: 0, y: 0 };
      const payload: TooltipPayload = [{ value: 'test', name: 'test', graphicalItemId: 'foo' }];
      const screen = await render(
        <RechartsStoreProvider preloadedState={preloadedRadialState}>
          <svg width={100} height={100}>
            <Cursor {...defaultProps} coordinate={coordinate} payload={payload} zIndex={0} />
          </svg>
        </RechartsStoreProvider>,
      );
      await expect.element(screen.getByCSS('.recharts-sector')).toBeVisible();
    });
  });
});
