import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Recommendations from './Recommendations';

vi.mock('../firebase', () => ({
  auth: { currentUser: null },
  db: {}
}));

describe('Recommendations Component', () => {
  it('renders recommendations header', () => {
    render(<Recommendations />);
    expect(screen.getByText(/Eco-Tips/i)).toBeInTheDocument();
  });
});
