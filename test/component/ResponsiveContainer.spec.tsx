import React, { CSSProperties, ReactNode } from 'react';
import { Mock, MockInstance, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { ResponsiveContainer } from '../../src';
import { mockGetBoundingClientRect } from '../helper/mockGetBoundingClientRect';
import { assertNotNull } from '../helper/assertNotNull';
import { useResponsiveContainerContext } from '../../src/component/ResponsiveContainer';
import { act } from '../helper/browser/act';

declare global {
  interface Window {
    ResizeObserver: unknown;
  }
}

describe('<ResponsiveContainer />', () => {
  /**
   * Use this function to simulate a change fired by a window.ResizeObserver
   * You just need to pass a param with ResizeObserverEntry structure like:
   *
   * @link https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry
   */
  let notifyResizeObserverChange: (arg: unknown) => void,
    consoleWarnSpy: MockInstance<(...args: any[]) => void>,
    resizeObserverMock: Mock<(arg: any) => any>;

  beforeEach(() => {
    /**
     * ResizeObserver is not available, so we have to create a mock to avoid error coming
     * from `react-resize-detector`.
     * @link https://github.com/maslianok/react-resize-detector/issues/145
     *
     * This mock also allow us to use {@link notifyResizeObserverChange} to fire changes
     * from inside our test.
     */
    resizeObserverMock = vi.fn(function ResizeObserverMock(callback) {
      notifyResizeObserverChange = callback;

      return {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };
    });
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation((): void => undefined);

    // @ts-expect-error ResizeObserver is not defined in the JSDOM environment
    delete window.ResizeObserver;

    window.ResizeObserver = resizeObserverMock;
  });

  const DimensionSpy = ({ style = {} }: { style?: CSSProperties }) => {
    const { width, height } = useResponsiveContainerContext();
    return <div data-testid="inside" style={{ ...style, width, height }} />;
  };

  it('Render a wrapper container in ResponsiveContainer', async () => {
    // The parent has no size, so the container measures 0 x 0.
    const screen = await render(
      <div style={{ width: 0, height: 0 }}>
        <ResponsiveContainer>
          <DimensionSpy />
        </ResponsiveContainer>
      </div>,
    );

    await expect.element(screen.getByCSS('.recharts-responsive-container')).toBeInTheDocument();

    // should issue a warning since no dimension is set, therefore they are 0
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.any(String));
  });

  it('Renders with minHeight and minWidth when provided', async () => {
    const screen = await render(
      <ResponsiveContainer minWidth={200} minHeight={100}>
        <DimensionSpy />
      </ResponsiveContainer>,
    );

    await expect.element(screen.getByCSS('.recharts-responsive-container')).toHaveStyle({
      minWidth: '200px',
      minHeight: '100px',
    });
  });

  it('Renders the component inside', async () => {
    const screen = await render(
      <ResponsiveContainer minWidth={200} minHeight={100}>
        <DimensionSpy />
      </ResponsiveContainer>,
    );

    await act(() => {
      notifyResizeObserverChange([{ contentRect: { width: 100, height: 100 } }]);
    });

    await expect.element(screen.getByTestId('inside')).toBeInTheDocument();
  });

  it('should ignore height completely if aspect+width are defined', async () => {
    const screen = await render(
      <ResponsiveContainer height={Math.random() * 1000} aspect={2} width={300}>
        <DimensionSpy />
      </ResponsiveContainer>,
    );

    await expect.element(screen.getByTestId('inside')).toHaveStyle({ width: '300px', height: '150px' });
  });

  it('should calculate width from aspect+height if width=0', async () => {
    const screen = await render(
      <ResponsiveContainer height={300} aspect={2} width={0}>
        <DimensionSpy />
      </ResponsiveContainer>,
    );

    await expect.element(screen.getByTestId('inside')).toHaveStyle({ width: '600px', height: '300px' });
  });

  // Note that we force height and width here which will trigger a warning.
  // Unfortunately ContainerDimensions does not measure with enzyme
  // so we have to force it to test aspect handling behaviors
  it('Preserves aspect ratio when oversized', async () => {
    const screen = await render(
      <ResponsiveContainer aspect={2} height={100} width={300}>
        <DimensionSpy />
      </ResponsiveContainer>,
    );

    await expect.element(screen.getByTestId('inside')).toHaveStyle({ width: '300px', height: '150px' });
  });

  it('Preserves aspect ratio when undersized', async () => {
    const screen = await render(
      <ResponsiveContainer aspect={2} height={300} width={100}>
        <DimensionSpy />
      </ResponsiveContainer>,
    );

    await expect.element(screen.getByTestId('inside')).toHaveStyle({ width: '100px', height: '50px' });
  });

  it('Renders without an id attribute when not passed', async () => {
    const screen = await render(
      <ResponsiveContainer>
        <DimensionSpy />
      </ResponsiveContainer>,
    );

    await expect.element(screen.getByCSS('.recharts-responsive-container')).not.toHaveAttribute('id');
  });

  it('Renders with id attribute when passed', async () => {
    const screen = await render(
      <ResponsiveContainer id="testing-id-attr">
        <DimensionSpy />
      </ResponsiveContainer>,
    );

    await expect.element(screen.getByCSS('.recharts-responsive-container')).toHaveAttribute('id', 'testing-id-attr');
  });

  it('should resize when ResizeObserver notify a change', async () => {
    const screen = await render(
      <ResponsiveContainer width="100%" height={200}>
        <DimensionSpy />
      </ResponsiveContainer>,
    );

    await act(() => {
      notifyResizeObserverChange([{ contentRect: { width: 10, height: 10 } }]);
    });

    const testDivBefore = screen.getByTestId('inside');
    await expect.element(testDivBefore).toHaveStyle({ width: '10px', height: '200px' });

    await act(() => {
      notifyResizeObserverChange([{ contentRect: { width: 100, height: 100 } }]);
    });

    const testDivAfter = screen.getByTestId('inside');
    await expect.element(testDivAfter).toHaveStyle({ width: '100px', height: '200px' });
  });

  it('should resize when debounced', async () => {
    vi.useFakeTimers();
    const screen = await render(
      <ResponsiveContainer width="100%" height={200} debounce={200}>
        <DimensionSpy />
      </ResponsiveContainer>,
    );

    await act(() => {
      notifyResizeObserverChange([{ contentRect: { width: 10, height: 10 } }]);
      vi.advanceTimersByTime(300);
    });

    const testDivBefore = screen.getByTestId('inside');
    await expect.element(testDivBefore).toHaveStyle({ width: '10px', height: '200px' });

    await act(() => {
      notifyResizeObserverChange([{ contentRect: { width: 50, height: 50 } }]);
    });

    const testDivInBetween = screen.getByTestId('inside');
    // should still be the same since we haven't advanced the timers yet
    await expect.element(testDivInBetween).toHaveStyle({ width: '10px', height: '200px' });

    // advance time by 100ms, should still be the same
    await act(() => {
      vi.advanceTimersByTime(100);
    });
    const testDivAfter100ms = screen.getByTestId('inside');
    await expect.element(testDivAfter100ms).toHaveStyle({ width: '10px', height: '200px' });

    // advance time by another 100ms (total of 200ms) and now it should resize
    await act(() => {
      vi.advanceTimersByTime(100);
    });
    const testDivAfter = screen.getByTestId('inside');
    // should have resized now
    await expect.element(testDivAfter).toHaveStyle({ width: '50px', height: '200px' });
  });

  it('should call onResize when ResizeObserver notifies one or many changes', async () => {
    const onResize = vi.fn();

    await render(
      <ResponsiveContainer width="100%" height={200} onResize={onResize}>
        <DimensionSpy />
      </ResponsiveContainer>,
    );

    await act(() => {
      notifyResizeObserverChange([{ contentRect: { width: 100, height: 100 } }]);
    });

    expect(onResize).toHaveBeenCalledTimes(1);
    expect(onResize).toHaveBeenLastCalledWith(100, 100);

    await act(() => {
      notifyResizeObserverChange([{ contentRect: { width: 200, height: 200 } }]);
    });

    expect(onResize).toHaveBeenCalledTimes(2);
    expect(onResize).toHaveBeenLastCalledWith(200, 200);
  });

  it('should have a min-width of 0 when no minWidth is set', async () => {
    const onResize = vi.fn();

    const screen = await render(
      <ResponsiveContainer width="100%" height={200} onResize={onResize}>
        <DimensionSpy />
      </ResponsiveContainer>,
    );

    const element = screen.getByCSS('.recharts-responsive-container');

    await expect.element(element).toHaveStyle({ height: '200px', minWidth: '0' });
    // The computed width resolves 100% to pixels, so check the inline style instead.
    expect(element.element().style.width).toBe('100%');
  });

  it('should accept and render the style prop if it is set', async () => {
    // looks like the ResponsiveContainer style.color prop converts from string to RGB representation
    // i.e. style.color = 'red' gets converted to rgb(255,0,0)
    // I checked and changing style.color from 'red' to 'blue' changed the resulting style from
    // rgb(255,0,0) to rgb(0,0,255) as expected
    const screen = await render(
      <ResponsiveContainer style={{ color: 'red', backgroundColor: '#FF00FF' }} data-testid="container">
        <DimensionSpy />
      </ResponsiveContainer>,
    );
    const responsiveContainer = screen.getByCSS('.recharts-responsive-container');
    expect(responsiveContainer.elements()).toHaveLength(1);
    await expect.element(responsiveContainer).toHaveStyle('background-color: rgb(255, 0, 255)');
    await expect.element(responsiveContainer).toHaveStyle('color: rgb(255,0,0)');
  });

  it('should accept and render the style prop and any other specified outside of it', async () => {
    const screen = await render(
      <ResponsiveContainer style={{ backgroundColor: 'red', color: 'red' }} width="100%" height={100}>
        <DimensionSpy />
      </ResponsiveContainer>,
    );

    const element = screen.getByCSS('.recharts-responsive-container');
    await expect.element(element).toHaveStyle({
      height: '100px',
      backgroundColor: 'rgb(255,0,0)',
      color: 'rgb(255,0,0)',
    });
    // The computed width resolves 100% to pixels, so check the inline style instead.
    expect(element.element().style.width).toBe('100%');
  });

  it('should have a min-width of 200px when minWidth is 200', async () => {
    const onResize = vi.fn();

    const screen = await render(
      <ResponsiveContainer width="100%" height={200} minWidth={200} onResize={onResize}>
        <DimensionSpy />
      </ResponsiveContainer>,
    );

    const element = screen.getByCSS('.recharts-responsive-container');

    await expect.element(element).toHaveStyle({ height: '200px', minWidth: '200px' });
    // The computed width resolves 100% to pixels, so check the inline style instead.
    expect(element.element().style.width).toBe('100%');
  });

  it('should render multiple children, even when nested', async () => {
    const onResize = vi.fn();

    mockGetBoundingClientRect({ height: 200, width: 400 });

    const screen = await render(
      <ResponsiveContainer width="100%" height={200} minWidth={200} onResize={onResize}>
        <div>
          <DimensionSpy style={{ backgroundColor: 'blue' }} />
          <DimensionSpy />
          <DimensionSpy />
          <DimensionSpy />
        </div>
      </ResponsiveContainer>,
    );

    const responsiveContainerDiv = screen.getByCSS('.recharts-responsive-container');
    await expect.element(responsiveContainerDiv).toHaveStyle({ height: '200px', minWidth: '200px' });
    // The computed width resolves 100% to pixels, so check the inline style instead.
    expect(responsiveContainerDiv.element().style.width).toBe('100%');

    const elementsInside = screen.getByTestId('inside');
    expect(elementsInside.elements()).toHaveLength(4);

    // all elements are using the same style besides their own style
    const expectedStyle = {
      width: '400px',
      height: '200px',
    };

    await expect.element(elementsInside.nth(0)).toHaveStyle({
      ...expectedStyle,
      backgroundColor: 'rgb(0, 0, 255)',
    });

    await expect.element(elementsInside.nth(1)).toHaveStyle(expectedStyle);
    await expect.element(elementsInside.nth(2)).toHaveStyle(expectedStyle);
    await expect.element(elementsInside.nth(3)).toHaveStyle(expectedStyle);
  });

  it('should not re-create ResizeObserver when onResize function instance changes', async () => {
    const onResize1 = vi.fn();
    const { rerender } = await render(
      <ResponsiveContainer onResize={onResize1}>
        <div />
      </ResponsiveContainer>,
    );

    // The mock implementation returns an object with a `disconnect` mock function.
    // Let's grab that specific instance.
    const initialObserverInstance = resizeObserverMock.mock.results[0].value;
    expect(initialObserverInstance.disconnect).not.toHaveBeenCalled();
    expect(resizeObserverMock).toHaveBeenCalledTimes(1);

    // Re-render with a new function instance.
    const onResize2 = vi.fn();
    await rerender(
      <ResponsiveContainer onResize={onResize2}>
        <div />
      </ResponsiveContainer>,
    );

    // Assert that the observer was NOT disconnected and a new one was NOT created.
    expect(initialObserverInstance.disconnect).not.toHaveBeenCalled();
    expect(resizeObserverMock).toHaveBeenCalledTimes(1);

    // Simulate a resize.
    await act(() => {
      notifyResizeObserverChange([{ contentRect: { width: 100, height: 100 } }]);
    });

    // Assert that the NEW callback was called, and the old one was not.
    expect(onResize1).not.toHaveBeenCalled();
    expect(onResize2).toHaveBeenCalledTimes(1);
    expect(onResize2).toHaveBeenCalledWith(100, 100);
  });

  it('should render children straight, without any detector divs, when width and height are both fixed numbers', async () => {
    const screen = await render(
      <ResponsiveContainer width={100} height={100}>
        <DimensionSpy />
      </ResponsiveContainer>,
    );
    await expect.element(screen.getByCSS('.recharts-responsive-container')).not.toBeInTheDocument();
    await expect.element(screen.getByTestId('inside')).toHaveStyle({ width: '100px', height: '100px' });
  });

  it('should not warn on initial render before dimensions are measured', async () => {
    mockGetBoundingClientRect({ width: 400, height: 200 });

    await render(
      <ResponsiveContainer width="100%" height="100%">
        <DimensionSpy />
      </ResponsiveContainer>,
    );

    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('should warn when aspect is not greater than zero', async () => {
    await render(
      <ResponsiveContainer aspect={-1} width="100%" height={100}>
        <div />
      </ResponsiveContainer>,
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith('The aspect(-1) must be greater than zero.');
  });

  it('should respect maxHeight when aspect ratio is used', async () => {
    const screen = await render(
      <ResponsiveContainer aspect={2} width={400} maxHeight={150}>
        <DimensionSpy />
      </ResponsiveContainer>,
    );

    await expect.element(screen.getByTestId('inside')).toHaveStyle({ width: '400px', height: '150px' });
  });

  it('should not re-render child if container size has not changed', async () => {
    const childRenderSpy = vi.fn();
    function Child(): ReactNode {
      const { width, height } = useResponsiveContainerContext();
      childRenderSpy(width, height);
      return null;
    }
    await render(
      <ResponsiveContainer>
        <Child />
      </ResponsiveContainer>,
    );
    await act(() => {
      notifyResizeObserverChange([{ contentRect: { width: 10, height: 10 } }]);
    });

    expect(childRenderSpy).toHaveBeenCalledTimes(1);
    expect(childRenderSpy).toHaveBeenLastCalledWith(10, 10);
    childRenderSpy.mockClear();

    await act(() => {
      notifyResizeObserverChange([{ contentRect: { width: 100, height: 100 } }]);
    });

    expect(childRenderSpy).toHaveBeenCalledTimes(1);
    childRenderSpy.mockClear();

    await act(() => {
      notifyResizeObserverChange([{ contentRect: { width: 100, height: 100 } }]);
    });

    expect(childRenderSpy).not.toHaveBeenCalled();

    // What if size is slightly different but rounds to the same?
    await act(() => {
      notifyResizeObserverChange([{ contentRect: { width: 100.4, height: 100.4 } }]);
    });
    expect(childRenderSpy).not.toHaveBeenCalled();

    // And now with a different rounded value
    await act(() => {
      notifyResizeObserverChange([{ contentRect: { width: 101, height: 101 } }]);
    });
    expect(childRenderSpy).toHaveBeenCalledTimes(1);
  });

  it('should expose container div via forwardRef', async () => {
    const ref = React.createRef<HTMLDivElement>();
    await render(
      <ResponsiveContainer ref={ref}>
        <div />
      </ResponsiveContainer>,
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    assertNotNull(ref.current);
    await expect.element(page.elementLocator(ref.current)).toHaveClass('recharts-responsive-container');
  });

  it('Renders with id attribute when passed as a number', async () => {
    const screen = await render(
      <ResponsiveContainer id={123}>
        <DimensionSpy />
      </ResponsiveContainer>,
    );

    await expect.element(screen.getByCSS('.recharts-responsive-container')).toHaveAttribute('id', '123');
  });

  it('Renders with minHeight and minWidth as percentages when provided', async () => {
    const screen = await render(
      <ResponsiveContainer minWidth="50%" minHeight="50%">
        <DimensionSpy />
      </ResponsiveContainer>,
    );

    await expect.element(screen.getByCSS('.recharts-responsive-container')).toHaveStyle({
      minWidth: '50%',
      minHeight: '50%',
    });
  });

  it('should render with custom className', async () => {
    const screen = await render(
      <ResponsiveContainer className="my-custom-class">
        <div />
      </ResponsiveContainer>,
    );
    await expect.element(screen.getByCSS('.recharts-responsive-container')).toHaveClass('my-custom-class');
  });
});
