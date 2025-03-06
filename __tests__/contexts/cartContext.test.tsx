import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { CartProvider, useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import * as firestore from 'firebase/firestore';

// Mock the firebase modules
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  writeBatch: jest.fn(),
  query: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(),
  where: jest.fn()
}));

jest.mock('../../firebase', () => ({
  db: {}
}));

// Mock the useAuth hook
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock data
const mockUser = { uid: 'test-user-123' };

const mockCartItems = [
  {
    id: 'item1',
    productId: 'prod1',
    name: 'Test Product 1',
    price: 10.99,
    quantity: 2,
    addedAt: '2025-03-06T00:00:00.000Z',
    image: 'test-image1.jpg'
  },
  {
    id: 'item2',
    productId: 'prod2',
    name: 'Test Product 2',
    price: 24.99,
    quantity: 1,
    addedAt: '2025-03-06T00:00:00.000Z',
    image: 'test-image2.jpg'
  }
];

// Define the constant used in your actual implementation
const QUANTITY_UPDATE_DELAY = 500;

describe('CartContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useAuth to return a logged-in user
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    
    // Mock onSnapshot to simulate cart data
    (firestore.onSnapshot as jest.Mock).mockImplementation((query, callback) => {
      callback({
        docs: mockCartItems.map(item => ({
          id: item.id,
          data: () => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            addedAt: item.addedAt,
            image: item.image
          })
        }))
      });
      return jest.fn(); // return unsubscribe function
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CartProvider>{children}</CartProvider>
  );

  it('should initialize cart with items from Firestore', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    // Verify cart has the mocked items
    expect(result.current.cart).toHaveLength(2);
    expect(result.current.cart[0].id).toBe('item1');
    expect(result.current.cart[1].id).toBe('item2');
  });

  it('should calculate cart total correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    // Total should be: (10.99 * 2) + (24.99 * 1) = 46.97
    expect(result.current.getCartTotal()).toBeCloseTo(46.97);
  });

  it('should check if item is in cart correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    expect(result.current.isInCart('prod1')).toBe(true);
    expect(result.current.isInCart('nonexistent')).toBe(false);
  });

  it('should add item to cart', async () => {
    // Mock addDoc to return a document reference with an id
    (firestore.addDoc as jest.Mock).mockResolvedValue({ id: 'new-item-id' });
    
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const newProduct = {
      productId: 'prod3',
      name: 'New Test Product',
      price: 15.99,
      image: 'test-image3.jpg'
    };
    
    let addedId;
    await act(async () => {
      addedId = await result.current.addToCart(newProduct);
    });
    
    expect(firestore.addDoc).toHaveBeenCalled();
    expect(addedId).toBe('new-item-id');
  });

  it('should update quantity when adding existing item', async () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const existingProduct = {
      productId: 'prod1', // This already exists in the mock cart
      name: 'Test Product 1',
      price: 10.99,
      image: 'test-image1.jpg'
    };
    
    await act(async () => {
      await result.current.addToCart(existingProduct);
      // Skip the debounce delay
      jest.advanceTimersByTime(QUANTITY_UPDATE_DELAY);
    });
    
    // Should call updateDoc instead of addDoc for existing items
    expect(firestore.updateDoc).toHaveBeenCalled();
    
    jest.useRealTimers();
  });

  it('should remove item from cart', async () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    await act(async () => {
      await result.current.removeFromCart('item1');
    });
    
    expect(firestore.deleteDoc).toHaveBeenCalled();
  });

 

  it('should clear cart', async () => {
    (firestore.getDocs as jest.Mock).mockResolvedValue({
      docs: mockCartItems.map(item => ({
        ref: `doc-ref-${item.id}`,
        id: item.id
      }))
    });
    
    const mockBatch = {
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined)
    };
    
    (firestore.writeBatch as jest.Mock).mockReturnValue(mockBatch);
    
    const { result } = renderHook(() => useCart(), { wrapper });
    
    await act(async () => {
      await result.current.clearCart();
    });
    
    expect(firestore.getDocs).toHaveBeenCalled();
    expect(firestore.writeBatch).toHaveBeenCalled();
    expect(mockBatch.delete).toHaveBeenCalledTimes(2); // For both mock cart items
    expect(mockBatch.commit).toHaveBeenCalled();
  });

  it('should handle errors when user is not logged in', async () => {
    // Mock useAuth to return no user
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    
    const { result } = renderHook(() => useCart(), { wrapper });
    
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    await act(async () => {
      await result.current.addToCart({
        productId: 'prod3',
        name: 'New Test Product',
        price: 15.99,
        image: 'test-image3.jpg'
      });
    });
    
    expect(result.current.error).toBe("User must be logged in to add to cart");
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    consoleErrorSpy.mockRestore();
  });
});