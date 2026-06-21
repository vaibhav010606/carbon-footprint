import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Challenges from './Challenges';

vi.mock('../firebase', () => ({
  auth: { currentUser: { uid: 'user-1' } },
  db: {}
}));

vi.mock('../context/UserContext', () => ({
  useUser: () => ({
    leafPoints: 1000,
    badges: ['First Step', 'Eco Warrior'],
    meatlessDays: 3,
  })
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn((q, callback) => {
    // mock snapshot callback immediately
    callback({
      exists: () => true,
      data: () => ({ leafPoints: 1000 }),
      docs: []
    });
    return () => {};
  }),
  doc: vi.fn()
}));

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
