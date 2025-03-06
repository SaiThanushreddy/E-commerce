import { useState, useEffect } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function CategoryProductsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const category = params.name;
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://fakestoreapi.com/products/category/${category.toLowerCase()}`);
        if (!response.ok) throw new Error("Failed to fetch category products");
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error("Error fetching category products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [category]);

  if (error) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Text className="text-red-500 text-lg" testID="error-message">Error: {error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: category,
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              testID="back-button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
          ),
        }} 
      />
      <SafeAreaView className="flex-1 bg-gray-100">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#3498db" testID="loading-indicator" />
          </View>
        ) : (
          <FlatList
            data={products}
            numColumns={2}
            contentContainerStyle={{ padding: 10 }}
            keyExtractor={(item) => item.id.toString()}
            testID="category-product-list"
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-1 m-2 bg-white rounded-lg shadow-md overflow-hidden"
                testID={`product-item-${item.id}`}
                accessibilityLabel={item.title}
                onPress={() => router.push({
                  pathname: "/Details/[id]",
                  params: { id: item.id, product: JSON.stringify(item) }
                })}
              >
                <View className="p-2 h-40 bg-white justify-center items-center">
                  <Image 
                    source={{ uri: item.image }} 
                    className="w-5/6 h-5/6" 
                    resizeMode="contain"
                    testID={`product-image-${item.id}`}
                  />
                </View>
                <View className="p-3">
                  <Text 
                    className="text-gray-800 font-medium" 
                    numberOfLines={2}
                    testID={`product-title-${item.id}`}
                  >
                    {item.title}
                  </Text>
                  <Text 
                    className="text-red-500 font-bold mt-2"
                    testID={`product-price-${item.id}`}
                  >
                    ${item.price?.toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </>
  );
}