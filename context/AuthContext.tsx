import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { AuthContextType, AuthProviderProps, UserInfo } from '../types/Auth';

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initializing, setInitializing] = useState<boolean>(true);

  // Initialize Firebase and Google Sign-In
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Configure Google Sign-In
        await GoogleSignin.configure({
          webClientId: "135453737237-bqib442m6he7p3qd4096frarsmdbva2d.apps.googleusercontent.com", // Replace with your web client ID
          offlineAccess: true,
        });
        
        
        const subscriber = auth().onAuthStateChanged(handleAuthStateChanged);
        return subscriber;
      } catch (error) {
        console.error('Initialization error:', error);
        setInitializing(false);
        setLoading(false);
      }
    };

    initializeServices();
  }, []);

  const handleAuthStateChanged = (firebaseUser: FirebaseAuthTypes.User | null): void => {
    if (firebaseUser) {
      const userData: UserInfo = {
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        phoneNumber: firebaseUser.phoneNumber,
        photoURL: firebaseUser.photoURL,
        providerId: firebaseUser.providerId,
        uid: firebaseUser.uid,
      };
      setUser(userData);
    } else {
      setUser(null);
    }
    
    if (initializing) {
      setInitializing(false);
    }
    setLoading(false);
  };

  const signIn = async (): Promise<FirebaseAuthTypes.UserCredential> => {
    setLoading(true);
    try {
      // console.log('1. Starting sign in process');
      
      
      // console.log('2. Clearing existing sign-in');
      await GoogleSignin.signOut();
      
      // Check Play Services
      // console.log('3. Checking Play Services');
      const playServicesAvailable = await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      // console.log('4. Play Services available:', playServicesAvailable);

     
      // console.log('5. Attempting Google Sign In');
      const { data } = await GoogleSignin.signIn();
      // console.log('6. Sign in result received');
      
      if (!data.idToken) {
        // console.error('7. No ID token present');
        throw new Error('No ID token present!');
      }

      
      // console.log('8. Creating Firebase credential');
      const credential = auth.GoogleAuthProvider.credential(data.idToken);
      
      // console.log('9. Signing in to Firebase');
      const result = await auth().signInWithCredential(credential);
      // console.log('10. Firebase sign in successful');
      
      return result;
    } catch (error: any) {
      console.error('Sign in error details:', {
        code: error.code,
        message: error.message,
        fullError: error
      });

      let errorMessage = 'Something went wrong during sign in';

      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          errorMessage = 'Sign-in was cancelled';
          break;
        case statusCodes.IN_PROGRESS:
          errorMessage = 'Sign-in is already in progress';
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          errorMessage = 'Play services are not available or need to be updated';
          break;
        default:
          errorMessage = `Sign in failed: ${error.message}`;
      }

      Alert.alert('Error', errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      setLoading(true);
      await Promise.all([
        GoogleSignin.revokeAccess(),
        GoogleSignin.signOut(),
        auth().signOut()
      ]);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert(
        'Error',
        'Something went wrong during sign out. Please try again.'
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    initializing,
    signIn,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
