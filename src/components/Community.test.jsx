import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Community from './Community';

vi.mock('../firebase', () => ({
  auth: { currentUser: null },
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn((q, callback) => {
    callback({ docs: [] });
    return () => {};
  })
}));

describe('Community Component', () => {
  it('renders leaderboard', () => {
    render(<Community />);
    expect(screen.getByText(/Global Community/i)).toBeInTheDocument();
    expect(screen.getByText(/No users found/i)).toBeInTheDocument();
  });
});
