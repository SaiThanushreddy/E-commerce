import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import "../global.css"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartProvider } from "../context/CartContext";
import { AuthProvider } from '@/context/AuthContext';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
 <CartProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
         <Stack.Screen name="index" options={{ headerShown: false }} />
         <Stack.Screen name="Details/[id]" options={{ headerShown: false }} />
         <Stack.Screen 
          name="category/[name]" 
          options={({ route }) => ({
            headerShown: true
          })}
        />
      </Stack>
      </CartProvider>
      </AuthProvider>
      </QueryClientProvider>

  );
}
