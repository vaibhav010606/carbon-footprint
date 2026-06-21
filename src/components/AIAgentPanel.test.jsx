import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import AIAgentPanel from './AIAgentPanel';

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

vi.mock('../firebase', () => ({
  auth: { currentUser: { uid: 'user-1' } },
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: 'mock-id' }),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn((q, cb) => {
    cb({ docs: [] });
    return () => {};
  }),
  serverTimestamp: vi.fn(() => new Date()),
}));

vi.mock('../audio', () => ({ playSuccess: vi.fn() }));
vi.mock('../agent/graph', () => ({
  createSproutGraph: vi.fn(() => ({
    invoke: vi.fn().mockResolvedValue({
      messages: [{ content: '{"isActivity": false, "reply": "Hi there!"}' }]
    })
  }))
}));

describe('AIAgentPanel Component', () => {
  it('renders the initial agent greeting', () => {
    render(<AIAgentPanel />);
    expect(screen.getByText(/Hello! I'm your growing Sprout/i)).toBeInTheDocument();
  });

  it('renders the message input textarea', () => {
    render(<AIAgentPanel />);
    expect(screen.getByLabelText(/Message Input/i)).toBeInTheDocument();
  });

  it('renders the send button with aria-label', () => {
    render(<AIAgentPanel />);
    expect(screen.getByRole('button', { name: /Send message/i })).toBeInTheDocument();
  });

  it('textarea has maxLength of 2000', () => {
    render(<AIAgentPanel />);
    const textarea = screen.getByLabelText(/Message Input/i);
    expect(textarea).toHaveAttribute('maxLength', '2000');
  });

  it('send button is disabled when input is empty', () => {
    render(<AIAgentPanel />);
    const sendBtn = screen.getByRole('button', { name: /Send message/i });
    expect(sendBtn).toBeDisabled();
  });

  it('send button becomes enabled when text is typed', () => {
    render(<AIAgentPanel />);
    const textarea = screen.getByLabelText(/Message Input/i);
    fireEvent.change(textarea, { target: { value: 'Hello Sprout' } });
    const sendBtn = screen.getByRole('button', { name: /Send message/i });
    expect(sendBtn).not.toBeDisabled();
  });

  it('typing in input changes its value', () => {
    render(<AIAgentPanel />);
    const textarea = screen.getByLabelText(/Message Input/i);
    fireEvent.change(textarea, { target: { value: 'I drove 10km today' } });
    expect(textarea.value).toBe('I drove 10km today');
  });

  it('renders upload image button', () => {
    render(<AIAgentPanel />);
    expect(screen.getByRole('button', { name: /Upload Image/i })).toBeInTheDocument();
  });

  it('renders scan barcode button', () => {
    render(<AIAgentPanel />);
    expect(screen.getByRole('button', { name: /Scan Barcode/i })).toBeInTheDocument();
  });

  it('renders today stats section', () => {
    render(<AIAgentPanel />);
    expect(screen.getByText(/Today So Far/i)).toBeInTheDocument();
  });

  it('renders suggestion chips', () => {
    render(<AIAgentPanel />);
    // Should render at least some chips
    const chipBtns = screen.getAllByRole('button');
    expect(chipBtns.length).toBeGreaterThan(3);
  });
});
