import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import CategoryProductsScreen from '../../components/CategoryProductsScreen';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn().mockReturnValue({
    navigate: mockNavigate
  }),
  useRoute: jest.fn().mockReturnValue({
    params: { category: 'Electronics' } // Default value, will be overridden in tests
  })
}));

// Import the mocked modules so we can manipulate them in tests
import { useNavigation, useRoute } from '@react-navigation/native';

// Mock the safe area context
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, style, className }) => (
      <View style={style} className={className} testID="mock-safe-area">
        {children}
      </View>
    ),
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('CategoryProductsScreen', () => {
  beforeEach(() => {
    fetch.mockClear();
    mockNavigate.mockClear();
    
    // Reset route mock to default value
    (useRoute).mockReturnValue({
      params: { category: 'Electronics' }
    });
    
    // Mock console methods to reduce noise
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading indicator initially', async () => {
    // Mock fetch before rendering
    global.fetch = jest.fn().mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => {
        resolve({
          ok: true,
          json: () => Promise.resolve(['electronics', 'jewelery', "men's clothing", 'housewares']),
        });
      }, 100))
    );
    
    // Import ActivityIndicator directly in test
    const { ActivityIndicator } = require('react-native');
    
    // Add testID to make testing more reliable
    jest.mock('react-native', () => {
      const rn = jest.requireActual('react-native');
      rn.ActivityIndicator = props => <rn.ActivityIndicator {...props} testID="loading-indicator" />;
      return rn;
    });
    
    // Use findByTestId for async rendering
    const { findByTestId } = render(<CategoryProductsScreen />);
    
    // Wait for the indicator to appear
    const loadingIndicator = await findByTestId('loading-indicator');
    expect(loadingIndicator).toBeTruthy();
    
    // Clean up
    global.fetch.mockClear();
    jest.clearAllMocks();
  });

  it('should fetch and display products for the specified category', async () => {
    const mockProducts = [
      { id: 1, title: 'Test Product 1', price: 19.99, image: 'https://example.com/image1.jpg' },
      { id: 2, title: 'Test Product 2', price: 29.99, image: 'https://example.com/image2.jpg' },
    ];

    // Mock categories API call
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(['electronics', 'jewelery', "men's clothing", 'housewares']),
      })
    );

    // Mock products API call
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProducts),
      })
    );

    const { findByText } = render(<CategoryProductsScreen />);

    // Use findByText instead of getByText to wait for the elements to appear
    const product1 = await findByText('Test Product 1');
    const product2 = await findByText('Test Product 2');
    const price1 = await findByText('$19.99');
    const price2 = await findByText('$29.99');

    expect(product1).toBeTruthy();
    expect(product2).toBeTruthy();
    expect(price1).toBeTruthy();
    expect(price2).toBeTruthy();

    // Verify API calls
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(1, 'https://fakestoreapi.com/products/categories');
    expect(fetch).toHaveBeenNthCalledWith(2, 'https://fakestoreapi.com/products/category/electronics');
  });

  it('should handle API error properly', async () => {
    // Mock the categories API call to succeed
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(['electronics', 'jewelery', "men's clothing", 'housewares']),
      })
    );
  
    // Mock the products API call to fail
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })
    );
  
    const { findByText } = render(<CategoryProductsScreen />);
  
    // Wait for the error message to appear
    const errorMessage = await findByText('Error: Failed to fetch category products');
    expect(errorMessage).toBeTruthy();
  });
  it('should display empty state when no products are found', async () => {
    // Mock categories API call
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(['electronics', 'jewelery', "men's clothing", 'housewares']),
      })
    );

    // Mock products API call with empty array
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );

    const { findByText } = render(<CategoryProductsScreen />);

    // Use findByText to wait for the empty state message
    const emptyMessage = await findByText('No products found in this category.');
    expect(emptyMessage).toBeTruthy();
  });

  it('should navigate to product details when a product is pressed', async () => {
    // Reset the navigation mock to ensure it's clean
    mockNavigate.mockClear();
    
    // Explicitly set up the useNavigation mock for this test
    useNavigation.mockReturnValue({
      navigate: mockNavigate
    });
    
    const mockProducts = [
      { id: 1, title: 'Test Product 1', price: 19.99, image: 'https://example.com/image1.jpg' },
    ];
  
    // Mock API calls
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(['electronics', 'jewelery', "men's clothing", 'housewares']),
      })
    );
    
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockProducts),
      })
    );
  
    const { findByText } = render(<CategoryProductsScreen />);
  
    // Wait for product to appear
    const productElement = await findByText('Test Product 1');
    
    // Simulate press on the product
    fireEvent.press(productElement);
    
    // Check navigation was called with the correct parameters
    expect(mockNavigate).toHaveBeenCalledWith('ProductDetails', { product: mockProducts[0] });
  });
  it.each([
    ['Electronics', 'electronics'],
    ['Clothing', "men's clothing"],
    ['Jewelry', 'jewelery'],  // Note: The API uses 'jewelery' (misspelled)
    ['Home', 'housewares']
  ])('should map display category %s to API category %s', async (displayCategory, apiCategory) => {
    // Override the route params for this specific test case
    (useRoute).mockReturnValue({
      params: { category: displayCategory }
    });
    
    // Mock categories API call
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(['electronics', 'jewelery', "men's clothing", 'housewares']),
      })
    );
    
    // Mock products API call
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );
    
    render(<CategoryProductsScreen />);
    
    // Wait for the API calls to complete
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenNthCalledWith(2, `https://fakestoreapi.com/products/category/${apiCategory}`);
    });
  });
});