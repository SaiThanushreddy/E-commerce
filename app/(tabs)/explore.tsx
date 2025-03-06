import { useRef, useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, Animated, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

const { width } = Dimensions.get("window");


interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating?: {
    rate: number;
    count: number;
  };
}

interface Category {
  name: string;
  icon: string;
  colors: string[];
}

interface LoadingState {
  featured: boolean;
  trending: boolean;
}

const categories: Category[] = [
  { name: "Electronics", icon: "laptop-outline", colors: ["#3498db", "#2980b9"] },
  { name: "Clothing", icon: "shirt-outline", colors: ["#e74c3c", "#c0392b"] },
  { name: "Jewelry", icon: "diamond-outline", colors: ["#1abc9c", "#16a085"] },
  { name: "Home", icon: "home-outline", colors: ["#9b59b6", "#8e44ad"] },
];

export default function ExploreScreen(): JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [featuredItems, setFeaturedItems] = useState<Product[]>([]);
  const [trendingItems, setTrendingItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    featured: true,
    trending: true,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        
        const featuredResponse = await fetch("https://fakestoreapi.com/products?limit=5");
        if (!featuredResponse.ok) throw new Error("Failed to fetch featured items");
        const featuredData: Product[] = await featuredResponse.json();
        setFeaturedItems(featuredData);
        setLoading((prev) => ({ ...prev, featured: false }));

     
        const trendingResponse = await fetch("https://fakestoreapi.com/products?limit=8");
        if (!trendingResponse.ok) throw new Error("Failed to fetch trending items");
        const trendingData: Product[] = await trendingResponse.json();
        setTrendingItems(trendingData);
        setLoading((prev) => ({ ...prev, trending: false }));
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      }
    };

    fetchData();
  }, []);

  if (error) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Text className="text-red-500 text-lg">Error: {error}</Text>
      </SafeAreaView>
    );
  }

  const renderLoadingSection = (): JSX.Element => (
    <View className="flex-1 justify-center items-center py-8">
      <ActivityIndicator size="large" color="#3498db" testID="loading-indicator" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <Animated.View className="h-16 bg-white shadow-md flex justify-center px-5 z-50">
        <Text className="text-2xl font-bold text-gray-800">Explore</Text>
      </Animated.View>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }], 
          { useNativeDriver: false }
        )}
      >
        {/* Featured Section */}
        <View className="mt-5 mb-8">
          <Text className="text-xl font-bold mb-4 ml-5 text-gray-800">Featured</Text>
          {loading.featured ? (
            renderLoadingSection()
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {featuredItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  className="w-40 mx-2 bg-white rounded-lg shadow-lg overflow-hidden"
                  testID="trending-product-item"
                  onPress={() => router.push({
                    pathname: "/Details/[id]",
                    params: { id: item.id.toString() }
                  })}
                >
                  <Image source={{ uri: item.image }} className="w-full h-36" resizeMode="contain" />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.8)"]}
                    className="absolute bottom-0 left-0 right-0 h-1/2 p-4"
                  >
                    <Text className="text-white text-lg font-bold" numberOfLines={1}>
                      {item.title}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Categories Section */}
        <View className="mb-8">
          <Text className="text-xl font-bold mb-4 ml-5 text-gray-800">Categories</Text>
          <View className="flex-row flex-wrap justify-between px-2">
            {categories.map((category, index) => (
              <TouchableOpacity
                key={index}
                className="w-[45%] h-24 mb-3 rounded-lg overflow-hidden shadow-lg"
                testID="category-item"
                onPress={() => router.push({
                  pathname: "/category",
                  params: { name: category.name }
                })}
              >
                <LinearGradient colors={category.colors} className="flex-1 justify-center items-center">
                  <Ionicons name={category.icon} size={32} color="white" />
                  <Text className="text-white text-lg font-bold mt-2">{category.name}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-8">
          <Text className="text-xl font-bold mb-4 ml-5 text-gray-800">Trending Now</Text>
          {loading.trending ? (
            renderLoadingSection()
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {trendingItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  className="w-40 mx-2 bg-white rounded-lg shadow-lg overflow-hidden"
                  onPress={() => router.push({
                    pathname: "/Details/[id]",
                    params: { id: item.id.toString() }
                  })}
                >
                  <Image source={{ uri: item.image }} className="w-full h-36" resizeMode="contain" />
                  <Text className="text-gray-800 font-bold mt-2 mx-2" numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text className="text-red-500 font-bold mx-2 mb-3">${item.price.toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}