import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import axios from 'axios';
import HomeScreen from '../../app/(tabs)/index';

const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});
jest.mock('axios', () => ({
  get: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

jest.mock('react-native-safe-area-context', () => {
  const React = jest.requireActual('react');
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) => 
      React.createElement('View', {}, children),
  };
});

const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

const mockProducts = [
  {
    id: 1,
    title: 'Test Product with Very Long Name that Should be Truncated',
    price: 29.99,
    image: 'https://example.com/image.jpg',
    rating: { rate: 4.5, count: 120 }
  }
];

describe('HomeScreen', () => {
  beforeEach(() => {
    (axios.get as jest.Mock).mockReset();
    mockRouterPush.mockReset();
  });

  it('renders initial UI elements correctly', async () => {
    (axios.get as jest.Mock).mockImplementation(() =>
      Promise.resolve({ data: [] })
    );    
    const { getByText } = render(<HomeScreen />);
    
    expect(getByText('Discover')).toBeTruthy();
    expect(getByText('Find your perfect item')).toBeTruthy();
  });

  it('loads and displays categories correctly', async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url.includes('/categories')) {
        return Promise.resolve({ data: ['electronics', 'jewelry'] });
      }
      return Promise.resolve({ data: [] });
    });

    const { getByText } = render(<HomeScreen />);
    
    await waitFor(() => {
      expect(getByText('All')).toBeTruthy();
      expect(getByText('Electronics')).toBeTruthy();
      expect(getByText('Jewelry')).toBeTruthy();
    });
  });

  it('handles category selection', async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url.includes('/categories')) {
        return Promise.resolve({ data: ['electronics'] });
      }
      return Promise.resolve({ data: mockProducts });
    });

    const { getByText } = render(<HomeScreen />);
    
    await waitFor(() => {
      expect(getByText('Electronics')).toBeTruthy();
    });
    
    fireEvent.press(getByText('Electronics'));
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'https://fakestoreapi.com/products/category/electronics'
      );
    });
  });

  it('displays products correctly with truncated titles', async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url.includes('/categories')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: mockProducts });
    });

    const { getByText } = render(<HomeScreen />);
    
    await waitFor(() => {
      expect(getByText('Test Product with Very Long...')).toBeTruthy();
      expect(getByText('$29.99')).toBeTruthy();
      expect(getByText('4.5 (120)')).toBeTruthy();
    });
  });

  it('navigates to product details on press', async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url.includes('/categories')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: mockProducts });
    });

    const { getByText } = render(<HomeScreen />);
    
    await waitFor(() => {
      expect(getByText('Test Product with Very Long...')).toBeTruthy();
    });
    
    fireEvent.press(getByText('Test Product with Very Long...'));
    
    expect(mockRouterPush).toHaveBeenCalledWith('/Details/1');
  });

  it('handles categories API error', async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url.includes('/categories')) {
        return Promise.reject(new Error('API error'));
      }
      return Promise.resolve({ data: mockProducts });
    });

    const { getByText, queryByText } = render(<HomeScreen />);
    
    await waitFor(() => {
      expect(getByText('All')).toBeTruthy();
      expect(queryByText('Electronics')).toBeNull();
    });
  });

  it('handles products API error', async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url.includes('/categories')) {
        return Promise.resolve({ data: ['electronics'] });
      }
      return Promise.reject(new Error('API error'));
    });

    const { getByTestId } = render(<HomeScreen />);
    
    await waitFor(() => {
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  it('shows loading indicators during API calls', async () => {
    (axios.get as jest.Mock).mockImplementation(() => 
      new Promise((resolve) => setTimeout(() => resolve({ data: [] }), 100))
    );

    const { getByTestId } = render(<HomeScreen />);
    
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
});