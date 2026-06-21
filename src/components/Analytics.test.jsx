import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Analytics from './Analytics';

// Mock Firebase
vi.mock('../firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user-123' } }
}));

// Mock Recharts to avoid ResizeObserver issues in JSDOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: () => <div data-testid="bar-chart"></div>,
  Bar: () => <div></div>,
  XAxis: () => <div></div>,
  YAxis: () => <div></div>,
  Tooltip: () => <div></div>,
  Cell: () => <div></div>,
}));

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn((q, cb) => {
    cb({ 
      docs: [],
      exists: () => true,
      data: () => ({ monthlyBudget: 500 })
    });
    return vi.fn();
  }),
  doc: vi.fn(),
  setDoc: vi.fn(),
}));

describe('Analytics Component', () => {
  it('renders the analytics header and budget', () => {
    render(<Analytics currentMonthCO2={150} />);
    expect(screen.getByText(/Carbon Analytics/i)).toBeInTheDocument();
    // Default budget is 500
    expect(screen.getByText(/500/i)).toBeInTheDocument();
    // current month CO2 should be displayed
    expect(screen.getByText(/150.0/i)).toBeInTheDocument();
  });

  it('renders the charts section', () => {
    render(<Analytics currentMonthCO2={0} />);
    expect(screen.getByText(/Emissions Timeline/i)).toBeInTheDocument();
  });
});
