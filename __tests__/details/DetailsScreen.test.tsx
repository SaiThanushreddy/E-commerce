import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import axios from 'axios';
import DetailsScreen from '../../app/Details/[id]'; // Update with correct path
import * as router from 'expo-router';

// Mock dependencies
jest.mock('axios');
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  router: {
    back: jest.fn(),
    push: jest.fn()
  }
}));
jest.mock('../../context/CartContext', () => ({
  useCart: jest.fn()
}));
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children
}));
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  AntDesign: 'AntDesign',
  Ionicons: 'Ionicons'
}));

// Mock Alert.alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('DetailsScreen', () => {
  const mockProduct = {
    id: 1,
    title: 'Test Product',
    price: 29.99,
    description: 'This is a test product description',
    category: 'test category',
    image: 'https://example.com/image.jpg',
    rating: { rate: 4.5, count: 10 }
  };

  const mockAddToCart = jest.fn().mockResolvedValue('test-cart-item-id');
  const mockIsInCart = jest.fn().mockReturnValue(false);
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    router.useLocalSearchParams.mockReturnValue({ id: '1' });
    require('../../context/CartContext').useCart.mockReturnValue({
      addToCart: mockAddToCart,
      isInCart: mockIsInCart
    });
    
    // Add this default mock for useAuth
    require('../../context/AuthContext').useAuth.mockReturnValue({ 
      user: { id: 'user123' } 
    });
    
    // Mock successful API response
    axios.get.mockResolvedValue({ data: mockProduct });
  });

  it('renders loading state initially', async () => {
    const { getByText } = render(<DetailsScreen />);
    expect(getByText('Loading product details...')).toBeTruthy();
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('https://fakestoreapi.com/products/1');
    });
  });

  it('renders product details after loading', async () => {
    const { getByText, queryByText } = render(<DetailsScreen />);
    
    await waitFor(() => {
      expect(queryByText('Loading product details...')).toBeNull();
      expect(getByText('Test Product')).toBeTruthy();
      expect(getByText('$29.99')).toBeTruthy();
      expect(getByText('This is a test product description')).toBeTruthy();
      expect(getByText('test category')).toBeTruthy();
    });
  });

  it('navigates back when back button is pressed', async () => {
    const { getByTestId } = render(<DetailsScreen />);
    
    await waitFor(() => {
      const backButton = getByTestId('back-button');
      fireEvent.press(backButton);
      expect(router.router.back).toHaveBeenCalled();
    });
  });

  it('navigates to cart when cart button is pressed', async () => {
    // Mock authenticated user for this test
    require('../../context/AuthContext').useAuth.mockReturnValue({ 
      user: { id: 'user123' } 
    });
    
    const { getByTestId } = render(<DetailsScreen />);
    
    await waitFor(() => {
      const cartButton = getByTestId('cart-button');
      fireEvent.press(cartButton);
      expect(router.router.push).toHaveBeenCalledWith('/cart');
    });
  });

  it('prompts login when unauthenticated user tries to add to cart', async () => {
    // Mock unauthenticated user
    require('../../context/AuthContext').useAuth.mockReturnValue({ user: null });
    
    const { getByText } = render(<DetailsScreen />);
    
    await waitFor(() => {
      const addToCartButton = getByText('Login to Add to Cart');
      fireEvent.press(addToCartButton);
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Login Required',
        'Please log in to add items to your cart',
        expect.anything()
      );
      expect(mockAddToCart).not.toHaveBeenCalled();
    });
  });

  it('adds product to cart when authenticated user clicks add to cart', async () => {
    // Mock authenticated user
    require('../../context/AuthContext').useAuth.mockReturnValue({ user: { id: 'user123' } });
    
    // Important: Make sure isInCart returns false for this specific test
    mockIsInCart.mockReturnValue(false);
    
    const { getByText } = render(<DetailsScreen />);
    
    // Wait for the component to finish loading and update state
    await waitFor(() => {
      // First verify the button has the correct text
      expect(getByText('Add to Cart')).toBeTruthy();
    });
    
    // Get the button and press it
    const addToCartButton = getByText('Add to Cart');
    fireEvent.press(addToCartButton);
    
    // Verify addToCart was called with correct parameters
    await waitFor(() => {
      expect(mockAddToCart).toHaveBeenCalledWith({
        productId: '1',
        name: 'Test Product',
        price: 29.99,
        image: 'https://example.com/image.jpg'
      });
      
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Item added to cart successfully',
        expect.anything()
      );
    });
  });

  it('shows error when API request fails', async () => {
    // Mock API failure
    axios.get.mockRejectedValueOnce(new Error('API error'));
    
    const { getByText, findByText } = render(<DetailsScreen />);
    
    const errorText = await findByText('Failed to load product details');
    expect(errorText).toBeTruthy();
    
    const tryAgainButton = getByText('Try Again');
    expect(tryAgainButton).toBeTruthy();
    
    // Test retry functionality
    axios.get.mockResolvedValueOnce({ data: mockProduct });
    fireEvent.press(tryAgainButton);
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });
});