import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Recommendations from './Recommendations';

vi.mock('../firebase', () => ({
  auth: { currentUser: { uid: 'user-1' } },
  db: {}
}));

vi.mock('../context/UserContext', () => ({
  useUser: () => ({
    leafPoints: 150,
    categorySummary: { transport: 5.5 },
    rawActivities: [{ subCategory: 'petrol_car' }],
  })
}));

describe('Recommendations Component', () => {
  it('renders recommendations header', () => {
    render(<Recommendations />);
    expect(screen.getByText(/Eco-Tips/i)).toBeInTheDocument();
  });
});
