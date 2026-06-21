import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import ChatBubble from '../components/ChatBubble';

describe('ChatBubble Coverage', () => {
  it('renders user message', () => {
    const { getByText } = render(
      <ChatBubble msg={{ id: 1, type: 'user', text: 'Hello' }} />
    );
    expect(getByText('Hello')).toBeTruthy();
  });

  it('renders agent message', () => {
    const { getByText } = render(
      <ChatBubble msg={{ id: 2, type: 'agent', text: 'Hi there' }} />
    );
    expect(getByText('Hi there')).toBeTruthy();
  });
  
  it('renders image attachment', () => {
    const { container } = render(
      <ChatBubble msg={{ id: 3, type: 'user', text: 'Image', image: 'data:image/png;base64,123' }} />
    );
    expect(container.querySelector('img')).toBeTruthy();
  });
});
