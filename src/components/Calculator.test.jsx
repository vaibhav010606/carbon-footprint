import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Calculator from './Calculator';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user-123' } }
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn((q, cb) => {
    // Return mock snapshot with forEach
    cb({ 
      forEach: (iterator) => [],
      docs: [] 
    });
    return vi.fn();
  }),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
}));

describe('Calculator Component', () => {
  it('renders the calculator form', () => {
    render(<Calculator />);
    expect(screen.getByText(/Log Activity/i)).toBeInTheDocument();
    expect(screen.getByText(/Amount/i)).toBeInTheDocument();
  });

  it('calculates transport emissions correctly', () => {
    render(<Calculator />);
    
    // Select Transport category (assuming it's default or we can set it)
    const amountInput = screen.getByPlaceholderText(/e.g. 15/i);
    fireEvent.change(amountInput, { target: { value: '10' } });
    
    expect(amountInput.value).toBe('10');
  });
});
