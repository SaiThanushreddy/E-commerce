import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StatusBar } from "react-native";
import { MaterialIcons, AntDesign, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://fakestoreapi.com/products/";
const INITIAL_LOADING_STATE = { isLoading: true, error: null };

const DetailsScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState(null);
  const [loadingState, setLoadingState] = useState(INITIAL_LOADING_STATE);
  const [imageLoading, setImageLoading] = useState(true);
  const { addToCart, isInCart } = useCart();
  const { user } = useAuth();
  const [inCart, setInCart] = useState(false);
  const fetchProduct = useCallback(async () => {
    if (!id) {
      setLoadingState({ isLoading: false, error: "Product ID is missing" });
      return;
    }
    try {
      setLoadingState({ isLoading: true, error: null });
      const response = await axios.get(`${API_URL}${id}`);
      setProduct(response.data);
      
      
      if (user && response.data) {
        setInCart(isInCart(response.data.id.toString()));
      }
    } catch (error) {
      setLoadingState({ isLoading: false, error: "Failed to load product details" });
    } finally {
      setLoadingState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [id, user, isInCart]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleAddToCart = async () => {
    if (!user) {
      Alert.alert(
        "Login Required",
        "Please log in to add items to your cart",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => router.push("/profile") }
        ]
      );
      return;
    }

    if (!product) {
      Alert.alert("Error", "Product not available", [{ text: "OK" }]);
      return;
    }

    try {
      
      const cartItem = {
        productId: product.id.toString(),
        name: product.title,
        price: product.price,
        image:product.image
      };
      
      const itemId = await addToCart(cartItem);
      if (itemId) {
        setInCart(true);
        Alert.alert(
          "Success",
          "Item added to cart successfully",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to add item to cart. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<AntDesign key={`star-${i}`} name="star" size={18} color="#FFD700" />);
      } else {
        stars.push(<AntDesign key={`star-${i}`} name="staro" size={18} color="#D3D3D3" />);
      }
    }
    
    return (
      <View className="flex-row items-center">
        {stars}
        <Text className="ml-2 text-gray-500">({rating?.count || 5} reviews)</Text>
      </View>
    );
  };

  if (loadingState.isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ActivityIndicator size="large" color="#3498db" />
        <Text className="mt-4 text-gray-600">Loading product details...</Text>
      </View>
    );
  }

  if (loadingState.error || !product) {
    return (
      <View className="flex-1 justify-center items-center px-4 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <MaterialIcons name="error-outline" size={60} color="#ff6b6b" />
        <Text className="text-xl text-red-500 text-center mt-4 mb-2 font-semibold">
          {loadingState.error || "Product not found"}
        </Text>
        <Text className="text-gray-500 text-center mb-6">
          We couldn't load the product you're looking for.
        </Text>
        <TouchableOpacity 
          className="bg-blue-500 px-8 py-3 rounded-full shadow-md" 
          onPress={fetchProduct}
        >
          <Text className="text-white font-bold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-5 py-2 border-b border-gray-100">
      <TouchableOpacity 
  testID="back-button" 
  accessibilityRole="button"
  onPress={() => router.back()}
>
  <Ionicons name="arrow-back" size={24} color="black" />
</TouchableOpacity>

        
        <Text className="text-lg font-semibold text-gray-800">Product Details</Text>
        
        <TouchableOpacity testID="cart-button" onPress={() => router.push('/cart')}>
  <Ionicons name="cart-outline" size={24} color="black" />
</TouchableOpacity>
      </View>
      
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Section */}
        <View className="bg-gray-50 px-5 py-8 items-center justify-center">
          {imageLoading && (
            <View className="absolute inset-0 justify-center items-center">
              <ActivityIndicator color="#3498db" />
            </View>
          )}
          <Image 
            source={{ uri: product.image }} 
            className="w-full h-80"
            resizeMode="contain"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
          />
        </View>
        
        {/* Category Badge */}
        <View className="px-5 mt-4 mb-2">
          <View className="bg-blue-50 self-start px-3 py-1 rounded-full">
            <Text className="text-blue-600 text-xs font-medium">{product.category}</Text>
          </View>
        </View>
        
        {/* Product Info */}
        <View className="px-5">
          <Text className="text-2xl font-bold text-gray-800 mb-1">{product.title}</Text>
          
          {/* Rating */}
          <View className="mb-2">
            {renderStars(product.rating?.rate)}
          </View>
          
          {/* Price */}
          <View className="flex-row items-center mb-4">
            <Text className="text-3xl font-bold text-blue-600">${product.price.toFixed(2)}</Text>
            {/* Optional: Add a "Sale" badge or original price if needed */}
          </View>
          
          {/* Description */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-800 mb-2">Description</Text>
            <Text className="text-base text-gray-700 leading-6">{product.description}</Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Bottom Action Bar */}
      <View className="px-5 py-4 border-t border-gray-200 bg-white">
        <TouchableOpacity
          className={`py-4 rounded-xl shadow-sm items-center flex-row justify-center
            ${inCart ? 'bg-green-500' : user ? 'bg-blue-500' : 'bg-gray-400'}`}
          onPress={handleAddToCart}
          disabled={inCart}
        >
          <Ionicons 
            name={inCart ? "checkmark-circle" : "cart"} 
            size={20} 
            color="white" 
            style={{marginRight: 8}} 
          />
          <Text className="text-white text-lg font-bold">
            {inCart ? "Added to Cart" : user ? "Add to Cart" : "Login to Add to Cart"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default DetailsScreen;