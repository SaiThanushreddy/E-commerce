export interface CartItem {
    id: string;
    productId: string;
    title: string;
    price: number;
    image: string;
    quantity: number;
    addedAt: string;
  }
  
  export interface CartContextType {
    cart: CartItem[];
    loading: boolean;
    error: string | null;
    addToCart: (product: Omit<CartItem, 'id' | 'addedAt' | 'quantity'>) => Promise<string | undefined>;
    removeFromCart: (id: string) => Promise<void>;
    updateQuantity: (id: string, newQuantity: number) => Promise<void>;
    getCartTotal: () => number;
    clearCart: () => Promise<void>;
    isInCart: (productId: string) => boolean;
    refreshCart: () => Promise<void>;
  }