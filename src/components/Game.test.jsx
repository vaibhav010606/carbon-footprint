import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Game from './Game';

describe('Game Component', () => {
  it('renders game iframe', () => {
    render(<Game />);
    expect(screen.getByText(/Eco Quest: Save the Planet/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Eco Quest Game/i)).toBeInTheDocument();
  });
});
