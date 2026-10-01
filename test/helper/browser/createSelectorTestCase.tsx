import { Selector } from '@reduxjs/toolkit';
import React, { ComponentType, ReactNode } from 'react';
import { Mock, vi } from 'vitest';
import { LocatorSelectors } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-react';
import { useAppSelectorWithStableTest } from '../selectorTestHelpers';
import { RechartsRootState } from '../../../src/state/store';
import { MockAnimationManager } from '../../animation/MockProgressAnimationManager';
import { assertUniqueHtmlIds } from '../../util/assertUniqueHtmlIds';
import { AnimationControllerProvider } from '../../../src';
import { CompositeAnimationManager } from '../../animation/CompositeAnimationManager';
import { ReactHook } from '../createSelectorTestCase';
import { flushPendingFrames } from './act';

/*
 * Browser Mode versions of the helpers in ../createSelectorTestCase.tsx.
 * They render with vitest-browser-react, so every render is async and the result exposes locators.
 * Keep the two files in sync: the jsdom tests still use the original.
 */

const emptySelector = (): undefined => undefined;

type TestCaseResult<T> = LocatorSelectors & {
  container: HTMLElement;
  spy: Mock<(selectorResult: T) => void>;
  debug: () => void;
  /**
   * Rerender the whole test case with a different component.
   * @param NextComponent
   */
  rerender: (NextComponent: ComponentType<{ children: ReactNode }>) => Promise<void>;
  unmount: () => Promise<void>;
  /**
   * Rerender the same component as before. Useful for testing updates and stable references.
   */
  rerenderSameComponent: () => Promise<void>;
  animationManager: MockAnimationManager;
};

function isReactHook<T>(fn: ReactHook<T> | ((state: RechartsRootState) => T)): fn is ReactHook<T> {
  return /^use[A-Z].*$/.test(fn.name);
}

function getComp<T>(
  selector: ReactHook<T> | ((state: RechartsRootState) => T) | undefined,
  spy: Mock<(selectorResult: T | undefined) => void>,
) {
  if (selector == null) {
    return (): null => null;
  }
  return isReactHook(selector)
    ? (): null => {
        const t = selector();
        spy(t);
        return null;
      }
    : (): null => {
        const t = useAppSelectorWithStableTest(selector);
        spy(t);
        return null;
      };
}

/**
 * Test helper to create a multi-render test case for a selector.
 * It renders a component that uses the selector and spies on its output.
 * It also provides a way to rerender the component with a different component type.
 *
 * @example:
 *   const renderTestCase = createSelectorTestCase(({ children }) => <MyChart>{children}</MyChart>);
 *   const { spy, rerenderSameComponent } = await renderTestCase(mySelector);
 *   expectLastCalledWith(spy, expectedValue);
 *
 * @param Component The component to render. It should accept children.
 * @returns An async function that renders the test case with a given selector.
 */
export function createSelectorTestCase(Component: ComponentType<{ children: ReactNode }>) {
  return async function renderTestCase<T>(
    selector: ReactHook<T> | Selector<RechartsRootState, T, never> | undefined = undefined,
  ): Promise<TestCaseResult<T>> {
    /*
     * Some tests render more than one test case and expect them to be independent.
     * Renders append to the same document, so clean up first.
     */
    await cleanup();
    const spy: Mock<(selectorResult: T | undefined) => void> = vi.fn();
    const animationManager = new CompositeAnimationManager();

    const Comp = getComp(selector, spy);

    const { rerender, ...screen } = await render(
      <AnimationControllerProvider value={animationManager.factory}>
        <Component>
          <Comp />
        </Component>
      </AnimationControllerProvider>,
    );

    // Redux autobatching may still wait for the next requestAnimationFrame. Flush it before assertions.
    await flushPendingFrames();

    assertUniqueHtmlIds();
    const myRerender = async (NextComponent: ComponentType<{ children: ReactNode }>): Promise<void> => {
      await rerender(
        <AnimationControllerProvider value={animationManager.factory}>
          <NextComponent>
            <Comp />
          </NextComponent>
        </AnimationControllerProvider>,
      );

      await flushPendingFrames();
    };
    const rerenderSameComponent = () => myRerender(Component);

    return {
      ...screen,
      debug: () => screen.debug(),
      spy,
      rerender: myRerender,
      rerenderSameComponent,
      animationManager,
    };
  };
}

type RenderResult = Omit<TestCaseResult<unknown>, 'spy' | 'rerender'> & {
  rerender: (next: ReactNode) => Promise<void>;
};

/**
 * Render a Recharts chart (or part of it) for testing purposes.
 *
 * Replacement for vitest-browser-react's render function, with
 * additional support for Recharts internals such as AnimationManager and
 * automatic HTML ID checking.
 *
 * @param chart The chart (or part of it) to render
 * @returns The render result, with additional methods for Recharts testing
 */
export async function rechartsTestRender(chart: ReactNode): Promise<RenderResult> {
  const Component = () => <>{chart}</>;
  const { spy, ...testBundle } = await createSelectorTestCase(Component)();
  return {
    ...testBundle,
    rerender: (nextChart: ReactNode) => testBundle.rerender(() => <>{nextChart}</>),
  };
}

/**
 * Create a test case for two components and renders the same spy inside both of them.
 * Useful for testing synchronisation!
 *
 * @param ComponentA first component to render
 * @param ComponentB second component to render
 * @param ComponentC optional third component to render
 * @returns an async function that renders the test case
 */
export function createSynchronisedSelectorTestCase(
  ComponentA: ComponentType<{ children: ReactNode }>,
  ComponentB: ComponentType<{ children: ReactNode }>,
  ComponentC?: ComponentType<{ children: ReactNode }>,
) {
  return async function renderTestCase<T>(
    selector: Selector<RechartsRootState, T | undefined, never> = emptySelector,
  ): Promise<{
    container: Element;
    wrapperA: Element;
    wrapperB: Element;
    wrapperC: Element | null;
    spyA: Mock<(selectorResult: T) => void>;
    spyB: Mock<(selectorResult: T) => void>;
    spyC: Mock<(selectorResult: T) => void>;
    debug: () => void;
  }> {
    await cleanup();
    const spyA: Mock<(selectorResult: T | undefined) => void> = vi.fn();
    const spyB: Mock<(selectorResult: T | undefined) => void> = vi.fn();
    const spyC: Mock<(selectorResult: T | undefined) => void> = vi.fn();

    const CompA = (): null => {
      spyA(useAppSelectorWithStableTest(selector));
      return null;
    };

    const CompB = (): null => {
      spyB(useAppSelectorWithStableTest(selector));
      return null;
    };

    const CompC = (): null => {
      spyC(useAppSelectorWithStableTest(selector));
      return null;
    };

    const { container, debug } = await render(
      <>
        <div id="wrapperA">
          <ComponentA>
            <CompA />
          </ComponentA>
        </div>
        <div id="wrapperB">
          <ComponentB>
            <CompB />
          </ComponentB>
        </div>
        {ComponentC && (
          <div id="wrapperC">
            <ComponentC>
              <CompC />
            </ComponentC>
          </div>
        )}
      </>,
    );

    assertUniqueHtmlIds();
    const wrapperA = container.querySelector('#wrapperA')!;
    const wrapperB = container.querySelector('#wrapperB')!;
    const wrapperC = container.querySelector('#wrapperC')!;

    return { container, spyA, spyB, spyC, debug: () => debug(), wrapperA, wrapperB, wrapperC };
  };
}
