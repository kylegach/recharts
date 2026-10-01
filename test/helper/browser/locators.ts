import { Locator, locators } from 'vitest/browser';

declare module 'vitest/browser' {
  interface LocatorSelectors {
    /**
     * Locate elements by CSS selector.
     * Most Recharts output is SVG without roles or text, so tests find it by class name.
     * @see {@link https://vitest.dev/api/browser/locators#custom-locators}
     */
    getByCSS(css: string): Locator;
  }
}

locators.extend({
  getByCSS(css: string) {
    return `css=${css}`;
  },
});
