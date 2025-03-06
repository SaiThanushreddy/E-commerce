import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  DocumentReference,
  writeBatch,
  query,
  limit,
  onSnapshot,
  QuerySnapshot,
  where
} from "firebase/firestore";
import { db } from "../firebase";
import { CartItem, CartContextType } from "../types/CartType";
import { useCallback, useMemo, useRef } from "react";
import { useAuth } from "../context/AuthContext";

const BATCH_SIZE = 500;
const QUANTITY_UPDATE_DELAY = 500;

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

interface CartOperationState {
  loading: boolean;
  error: string | null;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const { user } = useAuth(); 
  const [cart, setCart] = useState<CartItem[]>([]);
  const [operationState, setOperationState] = useState<CartOperationState>({
    loading: true,
    error: null
  });
  
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleError = useCallback((error: unknown, message: string) => {
    console.error(message, error);
    setOperationState(prev => ({
      ...prev,
      error: message
    }));
  }, []);

  const debouncedUpdateQuantity = useCallback(async (
    id: string, 
    newQuantity: number,
    retries = 3
  ): Promise<void> => {
    if (!user) {
      handleError(new Error("No user logged in"), "User must be logged in to update cart");
      return;
    }

    try {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      setOperationState(prev => ({ ...prev, error: null }));
      
      if (newQuantity < 1) {
        await removeFromCart(id);
        return;
      }

      updateTimeoutRef.current = setTimeout(async () => {
        try {
          const itemRef = doc(db, "users", user.uid, "cart", id);
          await updateDoc(itemRef, { 
            quantity: newQuantity,
            updatedAt: new Date().toISOString()
          });

          setCart(prevCart => 
            prevCart.map(item => 
              item.id === id 
                ? { ...item, quantity: newQuantity }
                : item
            )
          );
        } catch (err) {
          if (retries > 0) {
            setTimeout(() => {
              debouncedUpdateQuantity(id, newQuantity, retries - 1);
            }, 1000 * (4 - retries));
          } else {
            handleError(err, "Failed to update item quantity");
          }
        }
      }, QUANTITY_UPDATE_DELAY);
    } catch (err) {
      handleError(err, "Error in quantity update process");
    }
  }, [handleError, user]);

  const subscribeToCart = useCallback(async (pageSize = 100): Promise<void> => {
    if (!user) {
      setCart([]);
      setOperationState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setOperationState(prev => ({ ...prev, loading: true }));
      
      const cartCollection = collection(db, "users", user.uid, "cart");
      const cartQuery = query(cartCollection, limit(pageSize));
      
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      unsubscribeRef.current = onSnapshot(
        cartQuery,
        (snapshot: QuerySnapshot) => {
          const cartItems = snapshot.docs.map((doc): CartItem => {
            const data = doc.data();
            return {
              id: doc.id,
              productId: data.productId,
              name: data.name,
              price: data.price,
              quantity: data.quantity || 1,
              addedAt: data.addedAt,
              image:data.image
            };
          });
          setCart(cartItems);
          setOperationState(prev => ({ ...prev, loading: false }));
        },
        (error) => {
          handleError(error, "Error in cart subscription");
          setCart([]);
        }
      );
    } catch (err) {
      handleError(err, "Failed to subscribe to cart updates");
      setCart([]);
    }
  }, [handleError, user]);

  useEffect(() => {
    subscribeToCart();
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [subscribeToCart, user]); 

  const addToCart = useCallback(async (
    product: Omit<CartItem, 'id' | 'addedAt' | 'quantity'>
  ): Promise<string | undefined> => {
    if (!user) {
      handleError(new Error("No user logged in"), "User must be logged in to add to cart");
      return undefined;
    }

    try {
      setOperationState(prev => ({ ...prev, error: null }));
      
      const existingItem = cart.find(item => item.productId === product.productId);
      
      if (existingItem) {
        await debouncedUpdateQuantity(
          existingItem.id, 
          (existingItem.quantity || 1) + 1
        );
        return existingItem.id;
      }

      const newProduct = {
        ...product,
        quantity: 1,
        addedAt: new Date().toISOString(),
        userId: user.uid 
      };
      
      const cartCollection = collection(db, "users", user.uid, "cart");
      const docRef = await addDoc(cartCollection, newProduct);
      return docRef.id;
    } catch (err) {
      handleError(err, "Failed to add item to cart");
      return undefined;
    }
  }, [cart, debouncedUpdateQuantity, handleError, user]);

  const removeFromCart = useCallback(async (id: string): Promise<void> => {
    if (!user) {
      handleError(new Error("No user logged in"), "User must be logged in to remove from cart");
      return;
    }

    try {
      setOperationState(prev => ({ ...prev, error: null }));
      await deleteDoc(doc(db, "users", user.uid, "cart", id));
    } catch (err) {
      handleError(err, "Failed to remove item from cart");
    }
  }, [handleError, user]);

  const clearCart = useCallback(async (): Promise<void> => {
    if (!user) {
      handleError(new Error("No user logged in"), "User must be logged in to clear cart");
      return;
    }

    try {
      setOperationState(prev => ({ ...prev, error: null }));
      
      const cartCollection = collection(db, "users", user.uid, "cart");
      const cartSnapshot = await getDocs(cartCollection);
      
      for (let i = 0; i < cartSnapshot.docs.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        cartSnapshot.docs.slice(i, i + BATCH_SIZE).forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
      }
    } catch (err) {
      handleError(err, "Failed to clear cart");
    }
  }, [handleError, user]);

  const contextValue = useMemo((): CartContextType => ({
    cart,
    loading: operationState.loading,
    error: operationState.error,
    addToCart,
    removeFromCart,
    updateQuantity: debouncedUpdateQuantity,
    getCartTotal: () => cart.reduce(
      (total, item) => total + (item.price * (item.quantity || 1)), 
      0
    ),
    clearCart,
    isInCart: (productId: string) => cart.some(
      item => item.productId === productId
    ),
    refreshCart: () => subscribeToCart()
  }), [
    cart, 
    operationState, 
    addToCart,
    removeFromCart, 
    debouncedUpdateQuantity, 
    clearCart,
    subscribeToCart
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;