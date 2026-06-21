import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Challenges from '../components/Challenges';

describe('Challenges Component', () => {
  it('renders the Challenges header', () => {
    render(<Challenges />);
    expect(screen.getByText(/Game & Challenges/i)).toBeInTheDocument();
  });

  it('renders the Meatless Week challenge card', () => {
    render(<Challenges />);
    expect(screen.getByText(/Meatless Week/i)).toBeInTheDocument();
    expect(screen.getByText(/\+500 pts/i)).toBeInTheDocument();
  });

  it('renders the badges section', () => {
    render(<Challenges />);
    expect(screen.getByText(/Your Badges/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Points/i)).toBeInTheDocument();
    expect(screen.getByText(/Current Level/i)).toBeInTheDocument();
  });
});
