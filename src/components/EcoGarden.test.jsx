import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EcoGarden from './EcoGarden';

vi.mock('../firebase', () => ({
  auth: { currentUser: { uid: 'user1' } },
  db: {}
}));

vi.mock('../context/UserContext', () => ({
  useUser: () => ({
    leafPoints: 150,
  })
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn((docRef, callback) => {
    callback({
      exists: () => true,
      data: () => ({ leafPoints: 150 })
    });
    return () => {};
  })
}));

describe('EcoGarden Component', () => {
  it('renders garden view with current stage', () => {
    render(<EcoGarden />);
    expect(screen.getByText(/Virtual Eco-Garden/i)).toBeInTheDocument();
    expect(screen.getByText(/The Little Sprout/i)).toBeInTheDocument();
    expect(screen.getByText(/150/i)).toBeInTheDocument(); // Pts
  });
});
