import React from 'react';
import { render } from 'vitest-browser-react';
import { Customized } from '../../src';

describe('<Customized />', () => {
  test('Render customized component by React.element', async () => {
    function CustomEl() {
      return <rect data-testid="customized-svg-element" />;
    }
    const screen = await render(
      <svg>
        <Customized component={<CustomEl />} />
      </svg>,
    );
    await expect.element(screen.getByTestId('customized-svg-element')).toBeInTheDocument();
  });

  test('Render customized component by Function', async () => {
    const Custom = () => <rect data-testid="customized-svg-element" />;

    const screen = await render(
      <svg>
        <Customized component={Custom} />
      </svg>,
    );
    await expect.element(screen.getByTestId('customized-svg-element')).toBeInTheDocument();
  });
});
