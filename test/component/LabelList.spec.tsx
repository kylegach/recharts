import { render } from 'vitest-browser-react';
import { takeSnapshot } from '@chromatic-com/vitest';
import React from 'react';

import { Bar, BarChart, LabelList, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from '../../src';

describe('<LabelList />', () => {
  it('Render labels in ScatterChart', async () => {
    const data = [
      { x: 100, y: 200, z: 200 },
      { x: 120, y: 100, z: 260 },
      { x: 170, y: 300, z: 400 },
      { x: 140, y: 250, z: 280 },
      { x: 150, y: 400, z: 500 },
      { x: 110, y: 280, z: 200 },
    ];
    await render(
      <ScatterChart width={400} height={400} margin={{ top: 20, right: 20, bottom: 20 }}>
        <XAxis dataKey="x" name="stature" unit="cm" />
        <YAxis dataKey="y" name="weight" unit="kg" />
        <ZAxis dataKey="z" range={[4, 20]} name="score" unit="km" />
        <Scatter name="A school" data={data} isAnimationActive={false}>
          {/* should be able to use dataKey as a function with LabelList */}
          <LabelList dataKey={d => d.x} />
        </Scatter>
      </ScatterChart>,
    );

    await takeSnapshot();
  });

  it('Render labels in BarChart with an offset', async () => {
    const data = [
      { x: 100, y: '200' },
      { x: 120, y: '100' },
      { x: 170, y: '300' },
      { x: 140, y: '250' },
      { x: 150, y: '400' },
      { x: 110, y: '280' },
    ];
    await render(
      <BarChart width={400} height={400} margin={{ top: 20, right: 20, bottom: 20 }} data={data}>
        <XAxis dataKey="x" />
        <YAxis />

        <Bar dataKey="y" name="A school" isAnimationActive={false}>
          {/* offset only works with 'position' set */}
          <LabelList dataKey="x" offset={40} position="top" />
        </Bar>
      </BarChart>,
    );

    await takeSnapshot();
  });
});
