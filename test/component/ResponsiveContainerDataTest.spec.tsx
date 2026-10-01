import React from 'react';
import { render } from 'vitest-browser-react';
import { describe, expect, test } from 'vitest';
import { ResponsiveContainer, BarChart, Bar } from '../../src';

describe('ResponsiveContainer Data Attributes', () => {
  test('should pass down data-testid to the root div', async () => {
    const screen = await render(
      <ResponsiveContainer data-testid="my-container" initialDimension={{ width: 100, height: 100 }}>
        <BarChart width={100} height={100} data={[]}>
          <Bar dataKey="value" />
        </BarChart>
      </ResponsiveContainer>,
    );

    await expect.element(screen.getByTestId('my-container')).toBeInTheDocument();
  });
});
