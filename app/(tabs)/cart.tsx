import React from "react";
import { useState } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useCart } from "../../context/CartContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface ItemProps {
  item: CartItem;
  onUpdateQuantity: (id: string, quantity: number) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

const CartItemComponent: React.FC<ItemProps> = ({ item, onUpdateQuantity, onRemove }) => {
  const [loading, setLoading] = useState(false);

  const handleQuantityUpdate = async (newQuantity: number) => {
    if (loading || newQuantity < 1) return;
    try {
      setLoading(true);
      await onUpdateQuantity(item.id, newQuantity);
    } catch (error) {
      Alert.alert("Error", "Failed to update quantity");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (loading) return;
    Alert.alert("Remove Item", "Are you sure you want to remove this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await onRemove(item.id);
          } catch (error) {
            Alert.alert("Error", "Failed to remove item");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const priceDisplay = (item.price * item.quantity).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <View className="flex-row mb-4 p-4 bg-white rounded-lg shadow-md">
      {loading && (
        <View className="absolute inset-0 bg-white bg-opacity-80 flex justify-center items-center z-10 rounded-lg">
          <ActivityIndicator color="#2ECC71" />
        </View>
      )}

      <View className="w-24 h-24 rounded-lg overflow-hidden bg-gray-200">
        <Image
          source={{
            uri: item.image,
          }}
          className="w-full h-full"
          resizeMode="contain"
          onError={(e) => console.log("Image loading error:", e.nativeEvent.error)}
        />
      </View>

      <View className="flex-1 ml-4">
        <Text className="text-base font-semibold text-gray-900 mb-2" numberOfLines={2}>
          {item.name}
        </Text>
        <Text className="text-lg font-bold text-green-600 mb-3">{priceDisplay}</Text>

        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center bg-gray-200 rounded-full p-1">
            <TouchableOpacity
              className={`w-8 h-8 rounded-full bg-white justify-center items-center shadow-md ${
                item.quantity <= 1 && "bg-gray-300"
              }`}
              testID={`decrease-quantity-button-${item.id}`}
              onPress={() => handleQuantityUpdate(item.quantity - 1)}
              disabled={loading || item.quantity <= 1}
            >
              <MaterialIcons name="remove" size={20} color={item.quantity <= 1 ? "#CCC" : "#555"} />
            </TouchableOpacity>

            <Text className="text-lg font-semibold mx-4">{item.quantity}</Text>

            <TouchableOpacity
              className="w-8 h-8 rounded-full bg-white justify-center items-center shadow-md"
              testID={`increase-quantity-button-${item.id}`}
              onPress={() => handleQuantityUpdate(item.quantity + 1)}
              disabled={loading}
            >
              <MaterialIcons name="add" size={20} color="#555" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity className="p-2" onPress={handleRemove} disabled={loading} testID={`remove-item-button-${item.id}`}>
            <MaterialIcons name="delete-outline" size={24} color="#FF5252" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const CartScreen: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, loading, error, refreshCart } = useCart();

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshCart();
    setRefreshing(false);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert("Error", "Your cart is empty");
      return;
    }

    router.push("/");
  };

  const totalDisplay = getCartTotal().toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2ECC71" />
          <Text className="mt-3 text-lg text-gray-600">Loading your cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1">
        <View className="flex-1 justify-center items-center p-4">
          <MaterialIcons name="error-outline" size={64} color="#FF5252" />
          <Text className="mt-3 text-lg text-red-600">{error}</Text>
          <TouchableOpacity className="mt-4 px-6 py-3 bg-green-600 rounded-lg" onPress={refreshCart}>
            <Text className="text-white text-lg font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Text className="text-2xl font-bold text-gray-900 mx-4 my-6">Shopping Cart</Text>

      {cart.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <MaterialIcons name="shopping-cart" size={64} color="#CCCCCC" />
          <Text className="text-lg text-gray-600 mt-4 mb-8">Your cart is empty</Text>
          <TouchableOpacity className="bg-green-600 px-8 py-4 rounded-lg" onPress={() => router.push("/")}>
            <Text className="text-white text-lg font-semibold">Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            className="p-4 pb-20"
            testID="cart-flatlist"
            data={cart}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <CartItemComponent item={item} onUpdateQuantity={updateQuantity} onRemove={removeFromCart} />}
            showsVerticalScrollIndicator={false}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />

          <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-md">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-gray-900">Total</Text>
              <Text className="text-xl font-bold text-green-600">{totalDisplay}</Text>
            </View>

            <TouchableOpacity
              className="flex-row items-center bg-green-600 rounded-lg py-3 px-6 justify-center"
              onPress={handleCheckout}
            >
              <Text className="text-white text-lg font-bold mr-2">Proceed to Checkout</Text>
              <MaterialIcons name="arrow-forward" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

export default CartScreen;