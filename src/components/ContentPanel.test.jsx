import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import ContentPanel from './ContentPanel';

vi.mock('../firebase', () => ({
  auth: { currentUser: { uid: 'user-1' } },
  db: {}
}));

vi.mock('../context/UserContext', () => ({
  useUser: () => ({
    leafPoints: 0,
    streak: 0,
  }),
  UserProvider: ({ children }) => <>{children}</>
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn((q, callback) => {
    // Return a mock docSnap with exists() and data() methods
    callback({
      exists: () => false,
      data: () => ({ leafPoints: 0 }),
      docs: [],
    });
    return () => {};
  }),
  doc: vi.fn(),
  getDoc: vi.fn().mockResolvedValue({ exists: () => false, data: () => ({}) }),
}));

// Mock all child tab components
vi.mock('./Calculator', () => ({ default: () => <div data-testid="calculator">Calculator</div> }));
vi.mock('./GreenMap', () => ({ default: () => <div data-testid="green-map">GreenMap</div> }));
// Removed orphaned Analytics mock
vi.mock('./Community', () => ({ default: () => <div data-testid="community">Community</div> }));
vi.mock('./EcoGarden', () => ({ default: () => <div data-testid="eco-garden">EcoGarden</div> }));
vi.mock('./Challenges', () => ({ default: () => <div data-testid="challenges">Challenges</div> }));
vi.mock('./LearningHub', () => ({ default: () => <div data-testid="learning-hub">LearningHub</div> }));
vi.mock('./Game', () => ({ default: () => <div data-testid="game">Game</div> }));
vi.mock('./Recommendations', () => ({ default: () => <div data-testid="recommendations">Recommendations</div> }));
vi.mock('../audio', () => ({ playBloop: vi.fn() }));

describe('ContentPanel Component', () => {
  it('renders hero section with SPROUT heading', () => {
    render(<ContentPanel />);
    expect(screen.getAllByText(/SPROUT/i).length).toBeGreaterThan(0);
  });

  it('renders the main nav feature buttons', () => {
    render(<ContentPanel />);
    expect(screen.getByRole('button', { name: /Carbon Calculator/i })).toBeInTheDocument();
  });

  it('renders the Green Map button', () => {
    render(<ContentPanel />);
    expect(screen.getByText(/Green Map/i)).toBeInTheDocument();
  });


  it('renders Eco Garden button', () => {
    render(<ContentPanel />);
    expect(screen.getByText(/Eco Garden/i)).toBeInTheDocument();
  });

  it('clicking calculator button opens calculator tab', () => {
    render(<ContentPanel />);
    const calcBtn = screen.getByRole('button', { name: /Carbon Calculator/i });
    fireEvent.click(calcBtn);
    expect(screen.getByTestId('calculator')).toBeInTheDocument();
  });

  it('hides hero section when a tab is active', () => {
    render(<ContentPanel />);
    const calcBtn = screen.getByRole('button', { name: /Carbon Calculator/i });
    fireEvent.click(calcBtn);
    // SPROUT heading should no longer be visible
    expect(screen.queryAllByText(/^SPROUT$/i).length).toBe(0);
  });

  it('has a nav landmark for feature navigation', () => {
    render(<ContentPanel />);
    expect(screen.getByRole('navigation', { name: /Feature navigation/i })).toBeInTheDocument();
  });

  it('renders leaf points display', () => {
    render(<ContentPanel />);
    expect(screen.getByText(/Leaf Points/i)).toBeInTheDocument();
  });
});
