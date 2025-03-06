import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native'; 

const CategoryProductsScreen = () => {
  const route = useRoute(); 
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        const categoryMapping = {
          "Electronics": "electronics",
          "Clothing": "men's clothing",
          "Jewelry": "jewelery", 
          "Home": "housewares" 
        };
        
        
        const category = route.params?.category;
        
        
        const apiCategory = categoryMapping[category] || 'electronics';
        

        const response = await fetch(`https://fakestoreapi.com/products/category/${apiCategory}`);
        
        if (!response.ok) throw new Error("Failed to fetch category products");
        const data = await response.json();
        setProducts(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching category products:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    

    console.log("Route params:", route.params);
    
    
    const checkCategories = async () => {
      try {
        const response = await fetch('https://fakestoreapi.com/products/categories');
        const categories = await response.json();
        console.log('Available API categories:', categories);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    
    checkCategories();
    fetchCategoryProducts();
  }, [route.params?.category]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator 
          size="large" 
          color="#3498db" 
          testID="loading-indicator" 
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Text className="text-red-500 text-lg">Error: {error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <FlatList
        data={products}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-1 m-2 bg-white rounded-lg shadow-md overflow-hidden"
            onPress={() => navigation.navigate('ProductDetails', { product: item })}
          >
            <Image source={{ uri: item.image }} className="w-full h-40" resizeMode="contain" />
            <View className="p-3">
              <Text className="text-gray-800 font-bold" numberOfLines={2}>
                {item.title}
              </Text>
              <Text className="text-red-500 font-bold mt-2">${item.price?.toFixed(2)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-10">
            <Text className="text-gray-500 text-lg">No products found in this category.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default CategoryProductsScreen;