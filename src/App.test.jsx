import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

vi.mock('./firebase', () => ({
  auth: { currentUser: null },
  db: {}
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback(null);
    return () => {};
  }),
  signOut: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  increment: vi.fn()
}));

describe('App Component', () => {
  it('renders auth modal when no user is logged in', () => {
    render(<App />);
    expect(screen.getByText(/Welcome to Sprout/i)).toBeInTheDocument();
  });
});
