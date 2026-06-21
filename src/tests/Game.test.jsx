import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Game from '../components/Game';

describe('Game Component', () => {
  it('renders the game header correctly', () => {
    render(<Game />);
    expect(screen.getByText(/Eco Quest: Save the Planet/i)).toBeInTheDocument();
  });

  it('renders the game iframe with correct cache-busting source', () => {
    render(<Game />);
    const iframe = screen.getByTitle('Eco Quest Game');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', '/eco-quest.html?v=2');
  });

  it('contains the instructions area', () => {
    render(<Game />);
    expect(screen.getByText(/Play as the Eco-Hero to restore nature!/i)).toBeInTheDocument();
  });
});
