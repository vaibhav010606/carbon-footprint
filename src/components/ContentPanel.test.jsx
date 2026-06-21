import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ContentPanel from './ContentPanel';

vi.mock('../firebase', () => ({
  auth: { currentUser: null },
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  onSnapshot: vi.fn((q, callback) => {
    callback({ docs: [] });
    return () => {};
  }),
  doc: vi.fn()
}));

describe('ContentPanel Component', () => {
  it('renders hero section correctly', () => {
    render(<ContentPanel />);
    expect(screen.getAllByText(/SPROUT/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/CARBON/i).length).toBeGreaterThan(0);
  });
});
