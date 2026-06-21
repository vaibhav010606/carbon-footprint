import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AuthModal from './AuthModal';
import { signInWithEmailAndPassword } from 'firebase/auth';

vi.mock('../firebase', () => ({
  auth: {}
}));

vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn()
}));

describe('AuthModal Component', () => {
  it('renders login form by default', () => {
    render(<AuthModal />);
    expect(screen.getByRole('heading', { name: /Welcome to Sprout/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
  });

  it('displays user-friendly error for auth/invalid-credential', async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce({ code: 'auth/invalid-credential' });
    
    render(<AuthModal />);
    
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpass' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid email or password\. If you don't have an account, click Sign Up\./i)).toBeInTheDocument();
    });
  });
});
