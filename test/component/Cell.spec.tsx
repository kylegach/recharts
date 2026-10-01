import { render } from 'vitest-browser-react';
import React from 'react';

import { Cell } from '../../src';

describe('<Cell />', () => {
  it('Render empty dom', async () => {
    const screen = await render(<Cell />);
    await expect.element(screen.locator).toBeEmptyDOMElement();
  });
});
