import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GreenMap from './GreenMap';

describe('GreenMap Component', () => {
  it('renders map header', () => {
    render(<GreenMap />);
    expect(screen.getByText(/Green Map/i)).toBeInTheDocument();
  });
});
