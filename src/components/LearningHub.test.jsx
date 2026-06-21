import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LearningHub from './LearningHub';

describe('LearningHub Component', () => {
  it('renders learning hub header', () => {
    render(<LearningHub />);
    expect(screen.getAllByText(/Learning Hub/i).length).toBeGreaterThan(0);
  });
});
