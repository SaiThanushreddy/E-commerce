// __tests__/tabs/cart.test.tsx
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import CartScreen from '../../app/(tabs)/cart';
import { useCart } from '../../context/CartContext';

// Mock the CartContext hooks
jest.mock('../../context/CartContext', () => ({
  useCart: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

// Mock expo-font
jest.mock('expo-font', () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
  };
});

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    MaterialIcons: ({ name, size, color, ...props }) => {
      return <View {...props} testID={`icon-${name}`} />;
    },
  };
});

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn((title, message, buttons) => {
    // Find and trigger the "Remove" button callback if it exists
    const removeButton = buttons.find(button => button.text === 'Remove');
    if (removeButton && removeButton.onPress) {
      removeButton.onPress();
    }
  }),
}));

describe('CartScreen', () => {
  const mockCart = [
    {
      id: '1',
      name: 'Test Product 1',
      price: 10.99,
      quantity: 2,
      image: 'https://example.com/image1.jpg',
    },
    {
      id: '2',
      name: 'Test Product 2',
      price: 24.99,
      quantity: 1,
      image: 'https://example.com/image2.jpg',
    }
  ];

  const mockRemoveFromCart = jest.fn(() => Promise.resolve());
  const mockUpdateQuantity = jest.fn(() => Promise.resolve());
  const mockRefreshCart = jest.fn(() => Promise.resolve());
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup the default mock implementation
    (useCart as jest.Mock).mockReturnValue({
      cart: mockCart,
      removeFromCart: mockRemoveFromCart,
      updateQuantity: mockUpdateQuantity,
      getCartTotal: () => 46.97,
      loading: false,
      error: null,
      refreshCart: mockRefreshCart,
    });
  });

  test('renders cart with items', async () => {
    // Don't initialize component outside and then assign inside act
    // Instead, do the whole render in one operation
    const component = render(<CartScreen />);
    
    // If you need to wait for async operations, use waitFor instead
    await waitFor(() => {
      const { getByText, getAllByText } = component;
      
      expect(getByText('Shopping Cart')).toBeTruthy();
      expect(getByText('$46.97')).toBeTruthy(); // Total amount
      expect(getAllByText('Test Product 1')[0]).toBeTruthy();
      expect(getAllByText('Test Product 2')[0]).toBeTruthy();
    });
  });

  test('handles removing an item from cart', async () => {
    // Render directly without wrapping in act
    const { getByTestId } = render(<CartScreen />);
    
    // Simulate clicking on the remove button for the first item
    const removeButton = getByTestId('remove-item-button-1');
    
    await act(async () => {
      fireEvent.press(removeButton);
    });
    
    // Wait for the remove action outside of act
    await waitFor(() => expect(mockRemoveFromCart).toHaveBeenCalledWith('1'));
  });

  test('handles updating the quantity of an item', async () => {
    // Render directly without wrapping in act
    const { getByTestId } = render(<CartScreen />);
    
    // Increase quantity
    const increaseButton = getByTestId('increase-quantity-button-1');
    
    await act(async () => {
      fireEvent.press(increaseButton);
    });
    
    // Wait for async operations outside of act
    await waitFor(() => expect(mockUpdateQuantity).toHaveBeenCalledWith('1', 3));
    
    // Decrease quantity
    const decreaseButton = getByTestId('decrease-quantity-button-1');
    
    await act(async () => {
      fireEvent.press(decreaseButton);
    });
    
    // Wait for async operations outside of act
    await waitFor(() => expect(mockUpdateQuantity).toHaveBeenCalledWith('1', 1));
  });
  test('handles refresh action', async () => {
    // Use a variable outside the act to store the component
    const { getByTestId } = render(<CartScreen />);
    
    const flatList = getByTestId('cart-flatlist');
    
    // Use a separate act for the refresh operation
    await act(async () => {
      // Simulate pull-to-refresh
      const { refreshControl } = flatList.props;
      refreshControl.props.onRefresh();
    });
    
    // Wait for the refresh outside of act
    await waitFor(() => expect(mockRefreshCart).toHaveBeenCalled());
  });
  });