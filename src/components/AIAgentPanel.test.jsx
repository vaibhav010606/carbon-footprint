import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import AIAgentPanel from './AIAgentPanel';

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

vi.mock('../firebase', () => ({
  auth: { currentUser: null },
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn((q, callback) => {
    callback({ docs: [] });
    return () => {};
  })
}));

describe('AIAgentPanel Component', () => {
  it('renders initial agent message', () => {
    render(<AIAgentPanel />);
    expect(screen.getByText(/Hello! I'm your growing Sprout/i)).toBeInTheDocument();
  });

  it('renders input area', () => {
    render(<AIAgentPanel />);
    expect(screen.getByPlaceholderText(/Log an activity, ask a question/i)).toBeInTheDocument();
  });
});
