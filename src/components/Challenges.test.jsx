import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Challenges from './Challenges';

vi.mock('../firebase', () => ({
  auth: { currentUser: null },
  db: {}
}));

describe('Challenges Component', () => {
  it('renders challenges header', () => {
    render(<Challenges />);
    expect(screen.getByText(/Active Challenges/i)).toBeInTheDocument();
  });
});
