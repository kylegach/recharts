import { LocatorSelectors } from 'vitest/browser';
import { takeSnapshot } from '@chromatic-com/vitest';
import { render } from 'vitest-browser-react';
import React from 'react';
import { vi } from 'vitest';
import { Surface, Text } from '../../src';
import { mockGetBoundingClientRect } from '../helper/mockGetBoundingClientRect';
import { getWordsByLines } from '../../src/component/Text';
import * as DOMUtils from '../../src/util/DOMUtils';

// Browser Mode cannot spy on ESM exports directly. This wraps every export in a spy that calls the original.
// See https://vitest.dev/guide/browser/#spying-on-module-exports
vi.mock('../../src/util/DOMUtils', { spy: true });

/**
 * The tests give Text role="img". In the browser, the Surface <svg> has the implicit img role too,
 * so match only the <text> element.
 */
function getTextImage(screen: LocatorSelectors) {
  return screen.getByRole('img').and(screen.getByCSS('text'));
}

describe('<Text />', () => {
  const mockRect = {
    width: 25,
    height: 17,
  };
  beforeEach(() => mockGetBoundingClientRect(mockRect));

  test('Does not wrap long text if enough width', async () => {
    const screen = await render(
      <Surface width={300} height={300}>
        <Text role="img" width={300} style={{ fontFamily: 'Courier' }}>
          This is really long text
        </Text>
      </Surface>,
    );

    const text = getTextImage(screen);
    await expect.element(text).toBeInTheDocument();

    expect(text.element().children).toHaveLength(1);
  });

  test('renders number children', async () => {
    await render(
      <Surface width={300} height={300}>
        <Text y={20} width={300} style={{ fontFamily: 'Courier' }}>
          {12345}
        </Text>
      </Surface>,
    );

    await takeSnapshot();
  });

  test('renders boolean children', async () => {
    await render(
      <Surface width={300} height={300}>
        <Text y={20} width={300} style={{ fontFamily: 'Courier' }}>
          {true}
        </Text>
      </Surface>,
    );

    await takeSnapshot();
  });

  test('renders the string "NaN" when children is NaN', async () => {
    await render(
      <Surface width={300} height={300}>
        <Text y={20} width={300} style={{ fontFamily: 'Courier' }}>
          {NaN}
        </Text>
      </Surface>,
    );

    await takeSnapshot();
  });

  test.each([null, undefined] as const)('Renders nothing when children is %s', async (children: null | undefined) => {
    const screen = await render(
      <Surface width={300} height={300}>
        <Text width={300} style={{ fontFamily: 'Courier' }}>
          {children}
        </Text>
      </Surface>,
    );

    await expect.element(screen.getByCSS('text')).not.toBeInTheDocument();
  });

  test('renders object object when children are React elements', async () => {
    await render(
      <Surface width={300} height={300}>
        {/* @ts-expect-error typescript is correct here, Text doesn't accept ReactElement, the test is to demonstrate that */}
        <Text y={20} width={300} style={{ fontFamily: 'Courier' }}>
          <tspan x="0" dy="1.2em">
            Hello
          </tspan>
          <tspan x="0" dy="1.2em">
            World
          </tspan>
        </Text>
      </Surface>,
    );

    await takeSnapshot();
  });

  test('Wraps long text if not enough width', async () => {
    const screen = await render(
      <Surface width={200} height={200}>
        <Text role="img" width={200} style={{ fontFamily: 'Courier' }}>
          This is really long text for 200px
        </Text>
      </Surface>,
    );
    const text = getTextImage(screen);
    await expect.element(text).toBeInTheDocument();

    expect(text.element().children).toHaveLength(2);
  });

  test('Wraps long text if styled but would have had enough room', async () => {
    mockGetBoundingClientRect({ ...mockRect, width: 40 });
    const screen = await render(
      <Surface width={300} height={200}>
        <Text role="img" width={300} style={{ fontSize: '2em', fontFamily: 'Courier' }}>
          This is really long text
        </Text>
      </Surface>,
    );

    const text = getTextImage(screen);
    await expect.element(text).toBeInTheDocument();

    expect(text.element().children).toHaveLength(2);
  });

  test('Does not perform word length calculation if width or scaleToFit props not set', async () => {
    const screen = await render(
      <Surface width={300} height={200}>
        <Text role="img">This is really long text</Text>
      </Surface>,
    );

    const text = getTextImage(screen);
    await expect.element(text).toBeInTheDocument();

    expect(text.element().children).toHaveLength(1);
    // we know that the children that get rendered under `text` are `tspan` - this is a safe cast if we get a result
    const { transform } = (text.element().children[0] as SVGTSpanElement).attributes as NamedNodeMap & {
      transform: unknown;
    };
    expect(transform).toBeUndefined();
  });

  test('Render 0 successfully when width is specified', async () => {
    const screen = await render(
      <Surface width={300} height={200}>
        <Text role="img" x={0} y={0} width={30}>
          {0}
        </Text>
      </Surface>,
    );

    const text = getTextImage(screen);
    await expect.element(text).toBeInTheDocument();

    await expect.element(text).toHaveTextContent('0');
  });

  test('Render 0 successfully when width is not specified', async () => {
    const screen = await render(
      <Surface width={300} height={200}>
        <Text role="img" x={0} y={0}>
          {0}
        </Text>
      </Surface>,
    );

    const text = getTextImage(screen);
    await expect.element(text).toBeInTheDocument();

    await expect.element(text).toHaveTextContent('0');
  });

  test('Renders nothing when x or y is a percentage', async () => {
    const screen = await render(
      <Surface width={300} height={200}>
        <Text role="img" x="50%" y="50%">
          anything
        </Text>
      </Surface>,
    );

    await expect.element(getTextImage(screen)).not.toBeInTheDocument();
  });

  test("Don't Render text when x or y is NaN", async () => {
    const screen = await render(
      <Surface width={300} height={200}>
        <Text role="img" x={NaN} y={10}>
          anything
        </Text>
      </Surface>,
    );

    await expect.element(getTextImage(screen)).not.toBeInTheDocument();
  });

  test('Only split contents on breaking spaces', async () => {
    const testString = 'These spaces\tshould\nbreak,\rbut\xA0these\xA0should\xA0not.';
    const screen = await render(
      <Surface width={300} height={200}>
        <Text role="img" width="auto">
          {testString}
        </Text>
      </Surface>,
    );

    const text = getTextImage(screen);
    await expect.element(text).toBeInTheDocument();

    expect(text.element().children).toHaveLength(5);
  });

  describe('maxLines', () => {
    test('does not do anything when maxLines are not exceeded', async () => {
      const screen = await render(
        <Surface width={300} height={200}>
          <Text role="img" width={500} maxLines={3}>
            test
          </Text>
        </Surface>,
      );
      await render(
        <Surface width={300} height={200}>
          <Text role="img" width={500}>
            test
          </Text>
        </Surface>,
      );

      const text = getTextImage(screen).elements();
      await expect.element(getTextImage(screen).first()).toBeInTheDocument();

      expect(text[0]?.textContent).toEqual(text[1]?.textContent);
    });

    test('limits the output to maxLines', async () => {
      const testString = `Lorem ratione omnis fuga dignissimos in amet. Minus quam architecto non ea iste!
        Nihil amet in itaque error velit. Corporis autem sequi aut temporibus placeat.
        Perferendis quos veritatis quasi pariatur!`;
      const screen = await render(
        <Surface width={300} height={200}>
          <Text role="img" width={200} maxLines={2}>
            {testString}
          </Text>
        </Surface>,
      );

      const text = getTextImage(screen);
      await expect.element(text).toBeInTheDocument();

      expect(text.element().children).toHaveLength(2);
    });

    test('adds an ellipsis at the end of the truncated line', async () => {
      const testString = `Sit totam suscipit aliquid suscipit eius, cupiditate Aut excepturi ipsum ut suscipit
        facilis debitis Provident impedit a distinctio neque quaerat Optio quo quibusdam possimus
        provident accusantium. Molestiae similique nemo labore`;
      const screen = await render(
        <Surface width={300} height={200}>
          <Text role="img" width={200} maxLines={2}>
            {testString}
          </Text>
        </Surface>,
      );

      const text = getTextImage(screen);
      await expect.element(text).toBeInTheDocument();
      const { children } = text.element();
      const lastChild = children[children.length - 1];
      const lastLetter = lastChild.textContent[lastChild.textContent.length - 1];

      expect(lastLetter).toEqual('…');
    });
  });
});

describe('getWordsByLines', () => {
  function mockGetStringSize(mockedWidths: Record<string, number | undefined>) {
    vi.mocked(DOMUtils.getStringSize).mockImplementation(text => {
      const width = mockedWidths[text];

      if (width == null) {
        throw new Error(`Missing mock width for text "${text}"`);
      }

      return { width, height: 0 };
    });
  }

  beforeEach(() => {
    mockGetStringSize({
      M: 2,
      Ma: 4,
      'M…': 5,
      Mar: 6,
      'Ma…': 7,
      Marc: 8,
      'Mar…': 9,
      March: 10,
      'Marc…': 11,
      '\u00A0': 1,
    });
  });

  afterEach(() => {
    // `restoreMocks` does not reset module mocks, so put the original implementation back for later tests
    vi.mocked(DOMUtils.getStringSize).mockRestore();
  });

  it('returns the original text if it does not overflow', () => {
    const wordsByLines = getWordsByLines({
      width: 11,
      scaleToFit: false,
      children: 'March',
      maxLines: 1,
      breakAll: false,
    });

    expect(wordsByLines).toEqual([{ words: ['March'], width: 10 }]);
  });

  it('returns the original text if it does not overflow and an additional character is narrower than the suffix', () => {
    const wordsByLines = getWordsByLines({
      width: 10,
      scaleToFit: false,
      children: 'March',
      maxLines: 1,
      breakAll: false,
    });

    expect(wordsByLines).toEqual([{ words: ['March'], width: 10 }]);
  });

  it('truncates the text if it overflows and find the largest string with ellipsis that fits', () => {
    const wordsByLines = getWordsByLines({
      width: 7,
      scaleToFit: false,
      children: 'March',
      maxLines: 1,
      breakAll: false,
    });

    expect(wordsByLines).toEqual([{ words: ['Ma…'], width: 7 }]);
  });
});

describe('scaleToFit=true', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 50, height: 20 });
  });

  it('scales text to fit the width', async () => {
    const screen = await render(
      <Surface width={300} height={300}>
        <Text width={200} scaleToFit>
          This is really long text
        </Text>
      </Surface>,
    );

    const text = screen.getByCSS('text');
    await expect.element(text).toBeInTheDocument();
    await expect.element(text).toHaveAttribute('transform', 'scale(0.5714285714285714)');
  });

  it('does not scale text to fit if width is not provided', async () => {
    const screen = await render(
      <Surface width={300} height={200}>
        <Text scaleToFit>This is really long text</Text>
      </Surface>,
    );

    const text = screen.getByCSS('text');
    await expect.element(text).toBeInTheDocument();
    await expect.element(text).toHaveAttribute('transform', 'scale(1)');
  });

  it('should not throw errors if no children are provided', async () => {
    // https://github.com/recharts/recharts/issues/6190
    const screen = await render(
      <Surface width={300} height={200}>
        <Text width={200} scaleToFit />
      </Surface>,
    );

    await expect.element(screen.getByCSS('text')).not.toBeInTheDocument();
  });
});
