import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';

const API_URL = 'https://fakestoreapi.com';

const HomeScreen = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['all']);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const response = await axios.get(`${API_URL}/products/categories`);
        setCategories(['all', ...response.data]);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories(['all']);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const url = selectedCategory === 'all' 
          ? `${API_URL}/products` 
          : `${API_URL}/products/category/${selectedCategory}`;
        const response = await axios.get(url);
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory]);

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => setSelectedCategory(item)}
      className={`px-5 py-2 rounded-full mr-3 ${selectedCategory === item ? 'bg-blue-500' : 'bg-gray-200'}`}
    >
      <Text className={`font-bold ${selectedCategory === item ? 'text-white' : 'text-black'}`}>
        {item.charAt(0).toUpperCase() + item.slice(1)}
      </Text>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => router.push(`/Details/${item.id}`)}
      className="flex-1 m-2 bg-white rounded-xl p-3 shadow-md items-center relative"
    >
      <Image
        source={{ uri: item.image }}
        className="w-full h-36 rounded-lg"
        resizeMode="contain"
      />
      <Text className="text-lg font-bold mt-2 text-gray-800">${item.price.toFixed(2)}</Text>
      <View className="flex-row items-center mt-1">
        <MaterialIcons name="star" size={16} color="#f39c12" />
        <Text className="text-gray-500 ml-1 text-sm">
          {item.rating.rate.toFixed(1)} ({item.rating.count})
        </Text>
      </View>
      <Text className="text-gray-700 mt-1 text-center text-sm">
        {item.title.length > 27 ? `${item.title.substring(0, 27)}...` : item.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1">
      <StatusBar style="dark" />

      <View className="p-4">
        <Text className="text-3xl font-bold text-gray-800">Discover</Text>
        <Text className="text-lg text-gray-500 mt-1">Find your perfect item</Text>
      </View>

      <View className="mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
          {categories.map((category) => (
            <View key={category} className="mr-2">
              {renderCategoryItem({ item: category })}
            </View>
          ))}
        </ScrollView>
      </View>

      <View className="flex-1 px-3">
        {isLoading ? (
          <ActivityIndicator size="large" testID="loading-indicator" color="#3498db" />
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            showsVerticalScrollIndicator={false}
            renderItem={renderProductItem}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
