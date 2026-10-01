import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  DefaultZIndexes,
  Label,
  LabelProps,
  Line,
  LineChart,
  PieChart,
  ReferenceLine,
  Surface,
  YAxis,
} from '../../src';
import { PolarViewBoxRequired } from '../../src/util/types';
import { rechartsTestRender } from '../helper/browser/createSelectorTestCase';
import { expectScreenshot } from '../helper/browser/screenshot';

const data = [
  { name: 'Page A', uv: 400, pv: 2400, amt: 2400 },
  { name: 'Page B', uv: 300, pv: 4567, amt: 2400 },
  { name: 'Page C', uv: 300, pv: 1398, amt: 2400 },
  { name: 'Page D', uv: 200, pv: 9800, amt: 2400 },
  { name: 'Page E', uv: 278, pv: 3908, amt: 2400 },
  { name: 'Page F', uv: 189, pv: 4800, amt: 2400 },
];

describe('<Label />', () => {
  const polarViewBox: PolarViewBoxRequired = {
    cx: 50,
    cy: 50,
    innerRadius: 20,
    outerRadius: 80,
    startAngle: 0,
    endAngle: 90,
    clockWise: false,
  };

  it('Render polar labels (position="center")', async () => {
    const screen = await rechartsTestRender(
      <Surface height={300} width={300}>
        <Label viewBox={polarViewBox} value="text" position="center" />
      </Surface>,
    );
    await expectScreenshot(screen.container);
  });

  it('Render polar labels (position="outside")', async () => {
    const screen = await rechartsTestRender(
      <Surface height={0} width={0}>
        <Label viewBox={polarViewBox} value="text" position="outside" />
      </Surface>,
    );
    const label = screen.getByCSS('.recharts-label');

    expect(label.elements()).toHaveLength(1);
    await expect.element(label).toHaveAttribute('x', '110.10407640085654');
    await expect.element(label).toHaveAttribute('y', '-10.104076400856535');
  });

  it('Render radial labels (position="insideStart")', async () => {
    const screen = await rechartsTestRender(
      <Surface height={0} width={0}>
        <Label viewBox={polarViewBox} value="text" position="insideStart" />
      </Surface>,
    );

    const label = screen.getByCSS('.recharts-radial-bar-label');

    expect(label.elements()).toHaveLength(1);
  });

  it('Render radial labels (position="insideEnd")', async () => {
    const screen = await rechartsTestRender(
      <Surface height={0} width={0}>
        <Label viewBox={polarViewBox} value="text" position="insideEnd" />
      </Surface>,
    );

    expect(screen.getByCSS('.recharts-radial-bar-label').elements()).toHaveLength(1);
  });

  it('Render radial labels (position="end")', async () => {
    const screen = await rechartsTestRender(
      <Surface height={0} width={0}>
        <Label viewBox={polarViewBox} value="text" position="end" />
      </Surface>,
    );

    expect(screen.getByCSS('.recharts-radial-bar-label').elements()).toHaveLength(1);
  });

  const cartesianViewBox = {
    x: 50,
    y: 50,
    width: 200,
    height: 200,
  };

  it('Render cartesian labels (position="center")', async () => {
    const screen = await rechartsTestRender(
      <Surface height={300} width={300}>
        <Label viewBox={cartesianViewBox} value="text" position="center" />
      </Surface>,
    );
    await expectScreenshot(screen.container);
  });

  describe('content/value/children variants', () => {
    describe('when only one option is provided', () => {
      function renderLabelWithChildren(children: LabelProps['children']) {
        return rechartsTestRender(
          <Surface height={300} width={300}>
            <Label viewBox={cartesianViewBox} position="center">
              {children}
            </Label>
          </Surface>,
        );
      }

      function renderLabelWithValue(value: LabelProps['value']) {
        return rechartsTestRender(
          <Surface height={300} width={300}>
            <Label viewBox={cartesianViewBox} position="center" value={value} />
          </Surface>,
        );
      }

      function renderLabelWithContent(content: LabelProps['content']) {
        return rechartsTestRender(
          <Surface height={0} width={0}>
            <Label viewBox={cartesianViewBox} position="center" content={content} />
          </Surface>,
        );
      }

      describe('string', () => {
        it('should render label when given children prop', async () => {
          const screen = await renderLabelWithChildren('label from children');

          await expectScreenshot(screen.container);
        });

        it('should render label when given value prop', async () => {
          const screen = await renderLabelWithValue('label from value');

          await expectScreenshot(screen.container);
        });

        it('should not render label at all when given content prop', async () => {
          // @ts-expect-error content prop says it can't be a string, and indeed the Label does not render
          const screen = await renderLabelWithContent('label from content');

          await expect.element(screen.getByCSS('.recharts-label')).not.toBeInTheDocument();

          expect(screen.container.textContent).toBe('');
        });
      });

      describe('number', () => {
        it('should render label when given children prop', async () => {
          const screen = await renderLabelWithChildren(12345);

          await expectScreenshot(screen.container);
        });

        it('should render label when given value prop', async () => {
          const screen = await renderLabelWithValue(67890);

          await expectScreenshot(screen.container);
        });

        it('should not render label at all when given content prop', async () => {
          // @ts-expect-error content prop says it can't be a number, and indeed the Label does not render
          const screen = await renderLabelWithContent(54321);

          await expect.element(screen.getByCSS('.recharts-label')).not.toBeInTheDocument();

          expect(screen.container.textContent).toBe('');
        });
      });

      describe('boolean', () => {
        it('should render label when given children prop', async () => {
          const screen = await renderLabelWithChildren(true);

          await expectScreenshot(screen.container);
        });

        it('should render label when given value prop', async () => {
          const screen = await renderLabelWithValue(false);

          await expectScreenshot(screen.container);
        });

        it('should not render label at all when given content prop', async () => {
          // @ts-expect-error content prop says it can't be a boolean, and indeed the Label does not render
          const screen = await renderLabelWithContent(true);

          await expect.element(screen.getByCSS('.recharts-label')).not.toBeInTheDocument();

          expect(screen.container.textContent).toBe('');
        });
      });

      describe('null', () => {
        it('should not render label at all when given children prop', async () => {
          const screen = await renderLabelWithChildren(null);

          await expect.element(screen.getByCSS('.recharts-label')).not.toBeInTheDocument();
        });

        it('should not render label at all when given value prop', async () => {
          const screen = await renderLabelWithValue(null);

          await expect.element(screen.getByCSS('.recharts-label')).not.toBeInTheDocument();
        });

        it('should not render label at all when given content prop', async () => {
          const screen = await renderLabelWithContent(undefined);

          await expect.element(screen.getByCSS('.recharts-label')).not.toBeInTheDocument();

          expect(screen.container.textContent).toBe('');
        });
      });

      describe('undefined', () => {
        it('should not render label at all when given children prop', async () => {
          const screen = await renderLabelWithChildren(undefined);

          await expect.element(screen.getByCSS('.recharts-label')).not.toBeInTheDocument();
        });

        it('should not render label at all when given value prop', async () => {
          const screen = await renderLabelWithValue(undefined);

          await expect.element(screen.getByCSS('.recharts-label')).not.toBeInTheDocument();
        });

        it('should not render label at all when given content prop', async () => {
          const screen = await renderLabelWithContent(undefined);

          await expect.element(screen.getByCSS('.recharts-label')).not.toBeInTheDocument();

          expect(screen.container.textContent).toBe('');
        });
      });

      describe('function that returns a string', () => {
        const fn = vi.fn(() => 'label from function');

        it('should render label when given children prop', async () => {
          // @ts-expect-error typescript is correct here, Label does not allow function as children, and renders gibberish
          const screen = await renderLabelWithChildren(fn);

          const label = screen.getByCSS('.recharts-label');
          await expect.element(label).toBeInTheDocument();

          expect(label.element().textContent).toMatch('function(...args) {');

          expect(fn).toHaveBeenCalledTimes(0);
        });

        it('should render label when given value prop', async () => {
          // @ts-expect-error typescript is correct here, Label does not allow function as value, and renders gibberish
          const screen = await renderLabelWithValue(fn);

          const label = screen.getByCSS('.recharts-label');
          await expect.element(label).toBeInTheDocument();

          expect(label.element().textContent).toMatch('function(...args) {');

          expect(fn).toHaveBeenCalledTimes(0);
        });

        it('should render label when given content prop', async () => {
          const screen = await renderLabelWithContent(fn);

          const label = screen.getByText('label from function', { exact: true });
          expect(label.elements()).toHaveLength(1);

          expect(fn).toHaveBeenCalledTimes(1);
          expect(fn).toHaveBeenLastCalledWith(
            {
              angle: 0,
              offset: 5,
              position: 'center',
              x: 150,
              y: 150,
              textBreakAll: false,
              zIndex: DefaultZIndexes.label,
              viewBox: {
                height: 200,
                width: 200,
                lowerWidth: 200,
                upperWidth: 200,
                x: 50,
                y: 50,
              },
            },
            {},
          );
        });
      });

      describe('React function component', () => {
        const MyComp = () => {
          const [state, setState] = React.useState(0);
          React.useEffect(() => {
            setState(1);
          }, []);
          return <>label from component {state}</>;
        };

        it('should render label when given children prop', async () => {
          // @ts-expect-error typescript is correct here, Label does not allow React component as children, and it renders gibberish
          const screen = await renderLabelWithChildren(MyComp);

          const label = screen.getByCSS('.recharts-label');
          await expect.element(label).toBeInTheDocument();

          // the component itself gets serialized and rendered
          expect(label.element().textContent).toMatch('() => {');
        });

        it('should render label when given value prop', async () => {
          // @ts-expect-error typescript is correct here, Label does not allow React component as value, and it renders gibberish
          const screen = await renderLabelWithValue(MyComp);

          const label = screen.getByCSS('.recharts-label');
          await expect.element(label).toBeInTheDocument();

          // the component itself gets serialized and rendered
          expect(label.element().textContent).toMatch('() => {');
        });

        it('should render label when given content prop', async () => {
          const screen = await renderLabelWithContent(MyComp);

          // content is the only one that allows components - and it runs hooks too
          expect(screen.container.textContent).toEqual('label from component 1');
        });
      });

      describe('React element', () => {
        const element = <>label from element</>;

        it('should render label when given children prop', async () => {
          // @ts-expect-error typescript is correct here, Label does not allow React element as value, and it renders gibberish
          const screen = await renderLabelWithChildren(element);

          // this is not great - even though the type says it allows this, in practice it's pointless
          await expectScreenshot(screen.container);
        });

        it('should render label when given value prop', async () => {
          // @ts-expect-error typescript is correct here, Label does not allow React element as value, and it renders gibberish
          const screen = await renderLabelWithValue(element);

          await expectScreenshot(screen.container);
        });

        it('should render label when given content prop', async () => {
          const screen = await renderLabelWithContent(element);

          expect(screen.container.textContent).toEqual('label from element');
        });
      });

      describe('array of strings', () => {
        const array = ['label', 'from', 'array'];

        it('should render label when given children prop', async () => {
          // @ts-expect-error typescript is correct here, Label does not allow React element as value, and it renders gibberish
          const screen = await renderLabelWithChildren(array);

          await expectScreenshot(screen.container);
        });

        it('should render label when given value prop', async () => {
          // @ts-expect-error typescript says that array of strings is not allowed as value, and indeed it calls the standard .toString() on it and renders that
          const screen = await renderLabelWithValue(array);

          await expectScreenshot(screen.container);
        });

        it('should render label when given content prop', async () => {
          // @ts-expect-error typescript says that array of strings is not allowed as content, and indeed it does not render anything
          const screen = await renderLabelWithContent(array);

          expect(screen.container.textContent).toEqual('');
        });
      });
    });

    describe('when both children + value are provided', () => {
      it('should prefer children over value', async () => {
        const screen = await rechartsTestRender(
          <Surface height={300} width={300}>
            <Label viewBox={cartesianViewBox} position="center" value="label from value">
              label from children
            </Label>
          </Surface>,
        );

        await expectScreenshot(screen.container);
      });
    });

    describe('when both children + content are provided', () => {
      it('should should pass children as a prop to the content function, and render what content returned', async () => {
        const contentFn = vi.fn(() => 'label from content');

        const screen = await rechartsTestRender(
          <Surface height={0} width={0}>
            <Label viewBox={cartesianViewBox} position="center" content={contentFn}>
              label from children
            </Label>
          </Surface>,
        );

        expect(screen.container.textContent).toEqual('label from content');

        expect(contentFn).toHaveBeenCalledTimes(1);
        expect(contentFn).toHaveBeenLastCalledWith(
          {
            angle: 0,
            children: 'label from children',
            offset: 5,
            textBreakAll: false,
            position: 'center',
            x: 150,
            y: 150,
            zIndex: DefaultZIndexes.label,
            viewBox: {
              height: 200,
              width: 200,
              lowerWidth: 200,
              upperWidth: 200,
              x: 50,
              y: 50,
            },
          },
          {},
        );
      });
    });

    describe('when both value + content are provided', () => {
      it('should should pass value as a prop to the content function, and render what content returned', async () => {
        const contentFn = vi.fn(() => 'label from content');

        const screen = await rechartsTestRender(
          <Surface height={0} width={0}>
            <Label viewBox={cartesianViewBox} position="center" value="label from value" content={contentFn} />
          </Surface>,
        );

        expect(screen.container.textContent).toEqual('label from content');

        expect(contentFn).toHaveBeenCalledTimes(1);
        expect(contentFn).toHaveBeenLastCalledWith(
          {
            angle: 0,
            value: 'label from value',
            offset: 5,
            textBreakAll: false,
            position: 'center',
            x: 150,
            y: 150,
            zIndex: DefaultZIndexes.label,
            viewBox: {
              height: 200,
              width: 200,
              lowerWidth: 200,
              upperWidth: 200,
              x: 50,
              y: 50,
            },
          },
          {},
        );
      });
    });

    describe('when all three children + value + content are provided', () => {
      it('should should pass children and value as props to the content function, and render what content returned', async () => {
        const contentFn = vi.fn(() => 'label from content');

        const screen = await rechartsTestRender(
          <Surface height={0} width={0}>
            <Label viewBox={cartesianViewBox} position="center" value="label from value" content={contentFn}>
              label from children
            </Label>
          </Surface>,
        );

        expect(screen.container.textContent).toEqual('label from content');

        expect(contentFn).toHaveBeenCalledTimes(1);
        expect(contentFn).toHaveBeenLastCalledWith(
          {
            angle: 0,
            children: 'label from children',
            value: 'label from value',
            textBreakAll: false,
            offset: 5,
            position: 'center',
            x: 150,
            y: 150,
            zIndex: DefaultZIndexes.label,
            viewBox: {
              height: 200,
              width: 200,
              lowerWidth: 200,
              upperWidth: 200,
              x: 50,
              y: 50,
            },
          },
          {},
        );
      });
    });
  });

  it('Render label by label = <Label />', async () => {
    const screen = await rechartsTestRender(
      <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Line type="monotone" dataKey="uv" stroke="#ff7300" />
        <ReferenceLine y={200} stroke="red" label={<Label value="Max PV PAGE" />} />
      </LineChart>,
    );
    expect(screen.getByCSS('.recharts-line .recharts-line-curve').elements()).toHaveLength(1);
    await expectScreenshot(screen.container);
  });

  it('Renders label by label props with animation disabled', async () => {
    const screen = await rechartsTestRender(
      <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Line type="monotone" dataKey="uv" stroke="#ff7300" label={{ position: 'center' }} isAnimationActive={false} />
      </LineChart>,
    );

    await expectScreenshot(screen.container);
  });

  it('Renders label by label props with animation completed', async () => {
    const screen = await rechartsTestRender(
      <LineChart width={400} height={400} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <Line type="monotone" dataKey="uv" stroke="#ff7300" label={{ position: 'center' }} />
      </LineChart>,
    );

    await screen.animationManager.completeAnimation();

    await expectScreenshot(screen.container);
  });

  describe('custom label on an axis', () => {
    it('should provide computed x and y coordinates to a custom label element', async () => {
      const received: Array<LabelProps> = [];
      const CustomLabel = (props: LabelProps) => {
        received.push(props);
        return null;
      };
      await rechartsTestRender(
        <LineChart width={400} height={400} data={data}>
          <YAxis label={<CustomLabel />} />
          <Line dataKey="uv" />
        </LineChart>,
      );

      expect(received.length).toBeGreaterThan(0);
      const lastProps = received[received.length - 1];
      expect(typeof lastProps.x).toBe('number');
      expect(typeof lastProps.y).toBe('number');
    });
  });

  describe('in PieChart', () => {
    describe('with custom content function', () => {
      it('should pass the correct props to the content function when position=center', async () => {
        const contentFn = vi.fn();
        await rechartsTestRender(
          <PieChart height={100} width={200}>
            <Label value="text" position="center" content={contentFn} />
          </PieChart>,
        );

        expect(contentFn).toHaveBeenLastCalledWith(
          {
            viewBox: {
              height: 90,
              width: 190,
              lowerWidth: 190,
              upperWidth: 190,
              x: 5,
              y: 5,
            },
            angle: 0,
            value: 'text',
            textBreakAll: false,
            position: 'center',
            x: 100,
            y: 50,
            offset: 5,
            zIndex: DefaultZIndexes.label,
          },
          {},
        );
      });

      it('should pass the correct props to the content function when position=insideEnd', async () => {
        const contentFn = vi.fn();
        await rechartsTestRender(
          <PieChart height={100} width={200}>
            <Label value="text" position="insideEnd" content={contentFn} />
          </PieChart>,
        );

        expect(contentFn).toHaveBeenLastCalledWith(
          {
            viewBox: {
              clockWise: false,
              cx: 100,
              cy: 50,
              endAngle: 360,
              innerRadius: 0,
              outerRadius: 36,
              startAngle: 0,
            },
            angle: 0,
            value: 'text',
            textBreakAll: false,
            position: 'insideEnd',
            offset: 5,
            zIndex: DefaultZIndexes.label,
          },
          {},
        );
      });
    });
  });

  describe('in LineChart', () => {
    describe('with custom content function', () => {
      it('should pass the correct props to the content function', async () => {
        const contentFn = vi.fn();
        await rechartsTestRender(
          <LineChart width={400} height={400} data={data}>
            <Label value="text" position="center" content={contentFn} />
          </LineChart>,
        );

        expect(contentFn).toHaveBeenLastCalledWith(
          {
            viewBox: {
              height: 390,
              width: 390,
              lowerWidth: 390,
              upperWidth: 390,
              x: 5,
              y: 5,
            },
            angle: 0,
            value: 'text',
            textBreakAll: false,
            position: 'center',
            x: 200,
            y: 200,
            offset: 5,
            zIndex: DefaultZIndexes.label,
          },
          {},
        );
      });
    });
  });
});
