import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import ExploreScreen from '../../app/(tabs)/explore'; 
import { useRouter, useLocalSearchParams } from 'expo-router';


const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});


jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: View,
  };
});
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));


jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));


jest.mock('react-native-css-interop', () => ({
  StyleSheet: {
    create: (styles: unknown) => styles,
  },
}));


jest.mock('react-native/Libraries/Image/Image', () => 'Image');

const mockFeaturedItems = Array.from({ length: 5 }, (_, index) => ({
  id: index + 1,
  title: `Featured Product ${index + 1}`,
  price: 9.99 + index,
  description: 'Test description',
  category: 'electronics',
  image: 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg',
  rating: { rate: 4.5, count: 120 },
}));

const mockTrendingItems = Array.from({ length: 8 }, (_, index) => ({
  id: index + 6, 
  title: `Trending Product ${index + 1}`,
  price: 19.99 + index,
  description: 'Test description',
  category: 'clothing',
  image: 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg',
}));

beforeEach(() => {
  global.fetch = jest.fn((url) =>
    Promise.resolve({
      ok: true,
      json: () => {
        if (url.includes('limit=5')) return Promise.resolve(mockFeaturedItems);
        if (url.includes('limit=8')) return Promise.resolve(mockTrendingItems);
        return Promise.resolve([]);
      },
    })
  ) as jest.Mock;

  (useRouter as jest.Mock).mockReturnValue({
    push: jest.fn(),
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('ExploreScreen', () => {
  it('renders loading indicators initially', async () => {
    render(<ExploreScreen />);
    
    
    expect(screen.getAllByTestId('loading-indicator').length).toBeGreaterThan(0);
    
    await waitFor(() => {
      expect(screen.queryAllByTestId('loading-indicator')).toHaveLength(0);
    });
  });

  it('displays error message when fetch fails', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Network error'))
    ) as jest.Mock;

    render(<ExploreScreen />);
    
    await waitFor(() => {
      expect(screen.getByText(/Error: Network error/i)).toBeTruthy();
    });
  });

  it('renders featured items after loading', async () => {
    render(<ExploreScreen />);

    await waitFor(() => {
      
      expect(screen.getAllByTestId('trending-product-item')).toHaveLength(mockFeaturedItems.length);
      expect(screen.getByText(mockFeaturedItems[0].title)).toBeTruthy();
    });
  });

  it('renders all categories', async () => {
    render(<ExploreScreen />);
  
    await waitFor(() => {
      expect(screen.getAllByTestId('category-item')).toHaveLength(4);
      expect(screen.getByText('Electronics')).toBeTruthy();
      expect(screen.getByText('Clothing')).toBeTruthy();
      expect(screen.getByText('Jewelry')).toBeTruthy(); // Changed from 'jewelery' to 'Jewelry'
      expect(screen.getByText('Home')).toBeTruthy();
    });
  });

  it('renders trending items after loading', async () => {
    render(<ExploreScreen />);

    await waitFor(() => {
      
      expect(screen.getAllByTestId('trending-product-item')).toHaveLength(mockFeaturedItems.length);
      
      
      expect(screen.getByText('Trending Product 1')).toBeTruthy();
      expect(screen.getByText('$19.99')).toBeTruthy();
    });
  });

  it('navigates to product details when trending item is pressed', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    render(<ExploreScreen />);

    await waitFor(() => {
      const firstTrendingItem = screen.getAllByTestId('trending-product-item')[0];
      fireEvent.press(firstTrendingItem);
    });

    
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/Details/[id]',
      params: { id: '1' },
    });
  });

  it('navigates to category screen when category is pressed', async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    render(<ExploreScreen />);

    await waitFor(() => {
      const firstCategory = screen.getAllByTestId('category-item')[0];
      fireEvent.press(firstCategory);
    });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/category',
      params: { name: 'Electronics' },
    });
  });
});