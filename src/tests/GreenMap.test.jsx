import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GreenMap from '../components/GreenMap';

// Mock Leaflet as it requires a real DOM with actual layout which jsdom lacks
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({ setView: vi.fn() }),
}));

describe('GreenMap Component', () => {
  it('renders the Green Map heading', () => {
    render(<GreenMap />);
    expect(screen.getByText(/Green Map/i)).toBeInTheDocument();
  });

  it('renders the locate button', () => {
    render(<GreenMap />);
    expect(screen.getByRole('button', { name: /Use My Current Location/i })).toBeInTheDocument();
  });

  it('renders initial empty state instructions', () => {
    render(<GreenMap />);
    expect(screen.getByText(/We need your location to find real, local recycling centers/i)).toBeInTheDocument();
  });
});
