import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  ImageBackground, 
  Text, 
  TouchableOpacity, 
  View, 
  ActivityIndicator,
  StatusBar,
  Alert
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import messaging from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';

// Register background handler for Firebase messaging
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message handled in the registered handler:', remoteMessage);
  return Promise.resolve();
});

// Headless task handler
const headlessTaskHandler = async (remoteMessage) => {
  console.log('Headless task received message:', remoteMessage);
  return Promise.resolve();
};

// Register the headless task
AppRegistry.registerHeadlessTask(
  'ReactNativeFirebaseMessagingHeadlessTask', 
  () => headlessTaskHandler
);

const WelcomeScreen = () => {
  const { user, signIn, loading } = useAuth();
  const router = useRouter();
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [showInitialScreen, setShowInitialScreen] = useState(true);
  const initialNotificationRef = useRef(null);
  const appReadyRef = useRef(false);
  
  const requestUserPermission = async () => {
    try {
      const authStatus = await messaging().requestPermission({
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        provisional: false,
        sound: true,
        criticalAlert: true,
        providesAppNotificationSettings: true,
      });

      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      setNotificationPermission(enabled);

      if (enabled) {
        const fcmToken = await messaging().getToken();
        console.log('FCM Token:', fcmToken);
        
        messaging().onTokenRefresh(token => {
          console.log('FCM Token refreshed:', token);
        });
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      setNotificationPermission(false);
    }
  };

  // Handle navigation from notification
  const handleNotificationNavigation = useCallback((remoteMessage) => {
    if (!remoteMessage) return;
    console.log('Handling notification navigation:', remoteMessage);
    
    // If app isn't ready yet, store notification data for later
    if (!appReadyRef.current) {
      console.log('App not ready yet, storing notification for later navigation');
      initialNotificationRef.current = remoteMessage;
      return;
    }
    
    try {
      console.log('Attempting navigation with data:', remoteMessage.data);
      if (remoteMessage.data?.productId) {
        console.log(`Navigating to /Details/${remoteMessage.data.productId}`);
        router.push(`/Details/${remoteMessage.data.productId}`);
      } 
      else if (remoteMessage.data?.screen === 'cart') {
        console.log('Navigating to /cart');
        router.push('/cart');
      } else if (remoteMessage.data?.screen) {
        console.log(`Navigating to ${remoteMessage.data.screen}`);
        router.push(remoteMessage.data.screen);
      } else {
        console.log('No navigation path found in notification data');
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [router]);

  const setupNotificationListeners = useCallback(() => {
    // For app opened from background state via notification
    const backgroundSubscription = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('App opened from background state:', remoteMessage);
      handleNotificationNavigation(remoteMessage);
    });

    // For foreground notifications
    const foregroundSubscription = messaging().onMessage(async remoteMessage => {
      console.log('Received in foreground:', remoteMessage);
      
      // Custom in-app alert for foreground notifications
      Alert.alert(
        remoteMessage.notification?.title || 'New Notification',
        remoteMessage.notification?.body || 'Check out this update!',
        [
          {
            text: 'View',
            onPress: () => handleNotificationNavigation(remoteMessage)
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    });

    return () => {
      backgroundSubscription();
      foregroundSubscription();
    };
  }, [handleNotificationNavigation]);

  // Handle initial notification (app launch from terminated state)
  const checkInitialNotification = useCallback(async () => {
    try {
      const remoteMessage = await messaging().getInitialNotification();
      if (remoteMessage) {
        console.log('App opened from terminated state via notification:', remoteMessage);
        initialNotificationRef.current = remoteMessage;
      }
    } catch (error) {
      console.error('Error checking initial notification:', error);
    }
  }, []);

  // Handle navigating to the correct screen after app is ready
  const handleDelayedNavigation = useCallback(() => {
    // App is now considered ready for navigation
    appReadyRef.current = true;
    
    // Check if we have a pending notification to navigate to
    if (initialNotificationRef.current) {
      console.log('Processing delayed navigation from initial notification');
      // Wait a bit longer to ensure all screen components are mounted
      setTimeout(() => {
        handleNotificationNavigation(initialNotificationRef.current);
        initialNotificationRef.current = null;
      }, 2000);
    }
  }, [handleNotificationNavigation]);

  // Initial setup effect
  useEffect(() => {
    const setup = async () => {
      // Request notification permissions
      await requestUserPermission();
      
      // Check for notification that opened the app
      await checkInitialNotification();
      
      // Setup notification listeners
      const unsubscribe = setupNotificationListeners();
      
      if (user) {
        // If user is already logged in, navigate after delay
        const timeout = setTimeout(() => {
          router.replace("/(tabs)");
          setTimeout(handleDelayedNavigation, 500);
        }, 1500);
        return () => {
          clearTimeout(timeout);
          unsubscribe();
        };
      } else {
        // If no user, just remove splash screen after delay
        const timeout = setTimeout(() => {
          setShowInitialScreen(false);
          // We still need to set appReadyRef even for non-logged in users
          setTimeout(handleDelayedNavigation, 500);
        }, 2000);
        return () => {
          clearTimeout(timeout);
          unsubscribe();
        };
      }
    };

    setup();
  }, [user, router, setupNotificationListeners, checkInitialNotification, handleDelayedNavigation]);

  // Google Sign In handler
  const handleGoogleSignIn = async () => {
    try {
      setLocalLoading(true);
      await signIn();
      router.replace("/(tabs)");
      // Set up for delayed navigation after login
      setTimeout(handleDelayedNavigation, 500);
    } catch (error) {
      console.error("Google Sign In Error:", error);
      Alert.alert(
        "Sign In Error",
        "Failed to sign in with Google. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setLocalLoading(false);
    }
  };

  // Guest Mode handler
  const handleSkip = () => {
    router.replace("/(tabs)");
    // Set up for delayed navigation after guest login
    setTimeout(handleDelayedNavigation, 500);
  };

  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        translucent={true}
        backgroundColor="transparent"
      />
      <ImageBackground
        source={require("../assets/images/ecommerce-splash.jpg")}
        resizeMode="cover"
        className="flex-1"
      >
        <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
          <View className="flex-1 items-center justify-center">
            <LinearGradient
              colors={[
                "transparent",
                "rgba(255,255,255,0.9)",
                "rgba(255,255,255,1)",
              ]}
              className="flex-1 absolute top-0 bottom-0 left-0 right-0 justify-end items-center p-7"
            >
              {/* Branding / Welcome Message */}
              <View className="items-center mb-8">
                {user ? (
                  <Text className="text-3xl text-purple-500 font-bold">
                    Welcome Back, {user.displayName}! 🎉
                  </Text>
                ) : !showInitialScreen && (
                  <>
                    <Text className="text-4xl text-purple-500 font-bold">
                      Shop X
                    </Text>
                    <Text className="text-xl text-neutral-600 tracking-widest mt-3 text-center">
                      One-stop Solution for All Your Needs
                    </Text>
                  </>
                )}
              </View>

              {/* Show buttons only if not logged in and past initial screen */}
              {!user && !showInitialScreen && (
                <View className="w-full space-y-4">
                  {/* Google Login Button */}
                  <TouchableOpacity
                    className={`
                      rounded-full w-full flex-row justify-center items-center 
                      space-x-3 border border-black py-4
                      ${(loading || localLoading) ? 'opacity-70' : 'opacity-100'}
                    `}
                    onPress={handleGoogleSignIn}
                    disabled={loading || localLoading}
                    accessibilityLabel="Sign in with Google"
                    accessibilityRole="button"
                  >
                    {loading || localLoading ? (
                      <ActivityIndicator color="black" />
                    ) : (
                      <>
                        <AntDesign name="google" size={24} color="black" />
                        <Text className="text-black text-lg font-bold">
                          Continue with Google
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Guest Mode Button */}
                  <TouchableOpacity
                    className="rounded-full w-full flex-row justify-center items-center space-x-3 py-4"
                    onPress={handleSkip}
                    disabled={loading || localLoading}
                    accessibilityLabel="Continue as guest"
                    accessibilityRole="button"
                  >
                    <AntDesign name="user" size={24} color="black" />
                    <Text className="text-black text-lg">Continue as Guest</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Terms and Privacy Notice */}
              {!user && !showInitialScreen && (
                <Text className="text-neutral-500 text-center text-sm mt-6">
                  By continuing, you agree to our{" "}
                  <Text className="text-purple-500" accessibilityRole="link">
                    Terms of Service
                  </Text>
                  {" "}and{" "}
                  <Text className="text-purple-500" accessibilityRole="link">
                    Privacy Policy
                  </Text>
                </Text>
              )}
            </LinearGradient>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </>
  );
};

export default WelcomeScreen;