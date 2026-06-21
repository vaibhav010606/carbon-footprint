import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuthModal from './AuthModal';

// Mock Firebase auth
vi.mock('../firebase', () => ({
  auth: {
    currentUser: null
  }
}));

vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn()
}));

describe('AuthModal Component', () => {
  it('renders login form by default', () => {
    render(<AuthModal onAuthSuccess={() => {}} />);
    expect(screen.getByText(/Welcome to Sprout/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log In/i })).toBeInTheDocument();
  });

  it('switches to sign up when clicking the link', () => {
    render(<AuthModal onAuthSuccess={() => {}} />);
    const signUpLink = screen.getByRole('button', { name: 'Sign Up' });
    fireEvent.click(signUpLink);
    expect(screen.getByRole('button', { name: /Sign Up/i, hidden: false })).toBeInTheDocument();
  });

  it('updates email and password inputs', () => {
    render(<AuthModal onAuthSuccess={() => {}} />);
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });
});
