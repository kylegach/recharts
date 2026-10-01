import React from 'react';
import { render } from 'vitest-browser-react';
import { DefaultTooltipContent, DefaultTooltipContentProps } from '../../src';

describe('DefaultTooltipContent', () => {
  const mockProps: DefaultTooltipContentProps = {
    accessibilityLayer: true,
    contentStyle: {},
    itemStyle: {},
    labelStyle: {},
    separator: ' : ',
    label: 2,
    payload: [
      {
        stroke: '#3182bd',
        fill: '#3182bd',
        fillOpacity: 0.6,
        dataKey: 'uv',
        name: 'uv',
        color: '#3182bd',
        value: 200,
        graphicalItemId: 'recharts-area-0',
      },
    ],
    itemSorter: d => d.name,
    labelFormatter: () => `mock labelFormatter`,
  };

  it('renders without crashing, finds div with default class attr', async () => {
    const screen = await render(<DefaultTooltipContent {...mockProps} />);
    expect(screen.getByCSS('div.recharts-default-tooltip').elements()).toHaveLength(1);
  });

  it('does not render any name or value when tooltip formatter returns null', async () => {
    const mockPropsWithFormatter = {
      ...mockProps,
      formatter: (): null => null,
    };
    const screen = await render(<DefaultTooltipContent {...mockPropsWithFormatter} />);
    const tooltip = screen.getByCSS('div.recharts-default-tooltip');
    expect(tooltip.elements()).toHaveLength(1);

    await expect.element(tooltip).toHaveTextContent('mock labelFormatter');
  });

  it('renders the value returned by the formatter as a recharts tooltip item', async () => {
    const mockPropsWithFormatter = {
      ...mockProps,
      formatter: (): string => 'SOME VALUE',
    };
    const screen = await render(<DefaultTooltipContent {...mockPropsWithFormatter} />);
    const tooltip = screen.getByCSS('div.recharts-default-tooltip');
    expect(tooltip.elements()).toHaveLength(1);

    await expect.element(tooltip).toHaveTextContent('mock labelFormatteruv : SOME VALUE');
  });

  it('renders the name and value returned by the formatter as a recharts tooltip item', async () => {
    const mockPropsWithFormatter = {
      ...mockProps,
      formatter: (): [string, string] => ['SOME VALUE', 'SOME NAME'],
    };
    const screen = await render(<DefaultTooltipContent {...mockPropsWithFormatter} />);
    const tooltip = screen.getByCSS('div.recharts-default-tooltip');
    expect(tooltip.elements()).toHaveLength(1);

    await expect.element(tooltip).toHaveTextContent('mock labelFormatterSOME NAME : SOME VALUE');
  });

  it('renders without crashing when payload contains null or undefined entries', async () => {
    const mockPropsWithSparsePayload: DefaultTooltipContentProps = {
      ...mockProps,
      payload: [
        {
          stroke: '#3182bd',
          fill: '#3182bd',
          fillOpacity: 0.6,
          dataKey: 'uv',
          name: 'A',
          color: '#3182bd',
          value: 10,
          graphicalItemId: 'recharts-area-0',
        },
        undefined,
        null,
        {
          stroke: '#3182bd',
          fill: '#3182bd',
          fillOpacity: 0.6,
          dataKey: 'uv',
          name: 'B',
          color: '#3182bd',
          value: 20,
          graphicalItemId: 'recharts-area-1',
        },
      ] as any,
    };
    const screen = await render(<DefaultTooltipContent {...mockPropsWithSparsePayload} />);
    expect(screen.getByCSS('li.recharts-tooltip-item').elements()).toHaveLength(2);
  });
});
