import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import Calculator from './Calculator';

// Mock Firebase
vi.mock('../firebase', () => ({
  auth: { currentUser: { uid: 'user-1' } },
  db: {}
}));

vi.mock('../context/UserContext', () => ({
  useUser: () => ({
    todayStats: { co2: 0, count: 0 }
  })
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: 'mock-doc-id' }),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn((q, cb) => {
    cb({ forEach: () => [], docs: [] });
    return vi.fn();
  }),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  increment: vi.fn(n => n),
  setDoc: vi.fn().mockResolvedValue(undefined),
}));

describe('Calculator Component', () => {
  it('renders the calculator form with all key elements', () => {
    render(<Calculator />);
    expect(screen.getByText(/Log Activity/i)).toBeInTheDocument();
    expect(screen.getByText(/Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Notes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
  });

  it('updates amount input when user types', () => {
    render(<Calculator />);
    const amountInput = screen.getByPlaceholderText(/e.g. 15/i);
    fireEvent.change(amountInput, { target: { value: '25' } });
    expect(amountInput.value).toBe('25');
  });

  it('updates notes input when user types', () => {
    render(<Calculator />);
    const notesInput = screen.getByLabelText(/Notes/i);
    fireEvent.change(notesInput, { target: { value: 'Morning commute' } });
    expect(notesInput.value).toBe('Morning commute');
  });

  it('notes input has maxLength of 200', () => {
    render(<Calculator />);
    const notesInput = screen.getByLabelText(/Notes/i);
    expect(notesInput).toHaveAttribute('maxLength', '200');
  });

  it('category select changes when user selects transport', () => {
    render(<Calculator />);
    const categorySelect = screen.getByLabelText(/Category/i);
    fireEvent.change(categorySelect, { target: { value: 'transport' } });
    expect(categorySelect.value).toBe('transport');
  });

  it('shows sub-category select after category is selected', async () => {
    render(<Calculator />);
    const categorySelect = screen.getByLabelText(/Category/i);
    fireEvent.change(categorySelect, { target: { value: 'transport' } });
    await waitFor(() => {
      expect(screen.getByLabelText(/Sub-category/i)).toBeInTheDocument();
    });
  });

  it('shows live CO2 estimate when category, sub, and amount are filled', async () => {
    render(<Calculator />);

    const categorySelect = screen.getByLabelText(/Category/i);
    fireEvent.change(categorySelect, { target: { value: 'transport' } });

    await waitFor(() => screen.getByLabelText(/Sub-category/i));
    const subSelect = screen.getByLabelText(/Sub-category/i);
    fireEvent.change(subSelect, { target: { value: 'petrol_car' } });

    const amountInput = screen.getByPlaceholderText(/e.g. 15/i);
    fireEvent.change(amountInput, { target: { value: '100' } });

    await waitFor(() => {
      expect(screen.getByText(/19.2/i)).toBeInTheDocument();
    });
  });

  it('shows quick preset buttons', () => {
    render(<Calculator />);
    expect(screen.getByText(/Car 10km/i)).toBeInTheDocument();
    expect(screen.getByText(/Beef Burger/i)).toBeInTheDocument();
    expect(screen.getByText(/Biked 5km/i)).toBeInTheDocument();
  });

  it('clicking a preset populates form fields', async () => {
    render(<Calculator />);
    const carPreset = screen.getByText(/Car 10km/i);
    fireEvent.click(carPreset);
    await waitFor(() => {
      const amountInput = screen.getByPlaceholderText(/e.g. 15/i);
      expect(amountInput.value).toBe('10');
    });
  });

  it('submit button exists and is labeled correctly', () => {
    render(<Calculator />);
    const submitBtn = screen.getByRole('button', { name: /Log Activity/i });
    expect(submitBtn).toBeInTheDocument();
  });
});
