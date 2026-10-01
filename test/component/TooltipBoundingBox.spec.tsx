import React from 'react';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';
import { describe, it, expect } from 'vitest';
import { TooltipBoundingBox, TooltipBoundingBoxProps } from '../../src/component/TooltipBoundingBox';

describe('TooltipBoundingBox', () => {
  const defaultProps: TooltipBoundingBoxProps = {
    innerRef(): void {},
    lastBoundingBox: {
      width: 0,
      height: 0,
      left: 0,
      top: 0,
    },
    active: true,
    hasPayload: true,
    children: 'Hello world!',
    coordinate: { x: 1, y: 2 },
    allowEscapeViewBox: {
      x: false,
      y: false,
    },
    animationDuration: 0,
    animationEasing: 'ease',
    isAnimationActive: false,
    offset: 0,
    position: {},
    reverseDirection: {
      x: false,
      y: false,
    },
    useTranslate3d: false,
    viewBox: {},
    wrapperStyle: {},
    hasPortalFromProps: false,
  };
  it('should render children when active prop is true', async () => {
    const screen = await render(<TooltipBoundingBox {...defaultProps} />);
    await expect.element(screen.getByText('Hello world!')).toBeInTheDocument();
    await expect.element(screen.getByText('Hello world!')).toBeVisible();
  });

  it('should hide children when active prop is false', async () => {
    const screen = await render(<TooltipBoundingBox {...defaultProps} active={false} />);
    await expect.element(screen.getByText('Hello world!')).toBeInTheDocument();
    await expect.element(screen.getByText('Hello world!')).not.toBeVisible();
  });

  it('should hide children when there is no payload', async () => {
    const screen = await render(<TooltipBoundingBox {...defaultProps} hasPayload={false} />);
    await expect.element(screen.getByText('Hello world!')).toBeInTheDocument();
    await expect.element(screen.getByText('Hello world!')).not.toBeVisible();
  });

  it('should hide children when dismissed using Escape key', async () => {
    const screen = await render(<TooltipBoundingBox {...defaultProps} />);
    const element = screen.getByText('Hello world!');

    await expect.element(element).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await expect.element(element).toBeInTheDocument();
    await expect.element(element).not.toBeVisible();
  });

  describe('offset prop', () => {
    it('should accept number offset', async () => {
      const screen = await render(<TooltipBoundingBox {...defaultProps} offset={15} />);
      await expect.element(screen.getByText('Hello world!')).toBeInTheDocument();
    });

    it('should accept Coordinate offset with different x and y values', async () => {
      const screen = await render(<TooltipBoundingBox {...defaultProps} offset={{ x: 10, y: 20 }} />);
      await expect.element(screen.getByText('Hello world!')).toBeInTheDocument();
    });

    it('should accept Coordinate offset with negative values', async () => {
      const screen = await render(<TooltipBoundingBox {...defaultProps} offset={{ x: -5, y: 15 }} />);
      await expect.element(screen.getByText('Hello world!')).toBeInTheDocument();
    });
  });
});
