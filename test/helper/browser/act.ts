import React from 'react';

declare global {
  // eslint-disable-next-line vars-on-top
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

/**
 * vitest-browser-react wraps render, rerender and unmount in React's act, but does not export it.
 * We still need act to flush updates that we trigger ourselves, such as running the faked
 * requestAnimationFrame that Redux autobatching waits for.
 *
 * Like vitest-browser-react, this turns on the act environment only while act runs,
 * so React does not warn about updates that happen outside of it.
 */
export async function act(callback: () => unknown): Promise<void> {
  const previous = globalThis.IS_REACT_ACT_ENVIRONMENT;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  try {
    await React.act(async () => {
      await callback();
    });
  } finally {
    globalThis.IS_REACT_ACT_ENVIRONMENT = previous;
  }
}

/**
 * Redux autobatching queues actions until the next requestAnimationFrame, which the test setup fakes.
 * Run it inside act so that both Redux and React have finished before the test makes assertions.
 */
export function flushPendingFrames(): Promise<void> {
  return act(() => {
    vi.runOnlyPendingTimers();
  });
}
