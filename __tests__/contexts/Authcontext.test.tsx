// First, set up mocks before any imports
jest.mock('@react-native-firebase/app', () => {
    return () => ({
      app: jest.fn(),
      initializeApp: jest.fn(),
      apps: [],
      name: 'testApp',
      options: {},
    });
  });
  
  jest.mock('@react-native-firebase/auth', () => {
    const mockAuthInstance = {
      currentUser: null,
      signInWithCredential: jest.fn(() => Promise.resolve({ 
        user: { 
          uid: '123', 
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: 'https://example.com/photo.jpg',
          phoneNumber: null,
          providerId: 'google.com'
        } 
      })),
      signOut: jest.fn(() => Promise.resolve()),
      onAuthStateChanged: jest.fn((callback) => {
        callback(null);
        return jest.fn(); // Return unsubscribe function
      }),
    };
    
    const mockAuth = jest.fn(() => mockAuthInstance);
    
    // Add needed methods to the default export function
    mockAuth.GoogleAuthProvider = {
      credential: jest.fn((token) => ({ token })),
    };
    
    return mockAuth;
  });
  
  // Mock Google Sign-In with the CORRECT STRUCTURE
  jest.mock('@react-native-google-signin/google-signin', () => ({
    GoogleSignin: {
      configure: jest.fn(() => Promise.resolve()),
      hasPlayServices: jest.fn(() => Promise.resolve(true)),
      signIn: jest.fn(() => Promise.resolve({
        // This matches the structure expected in AuthContext.tsx
        data: {
          idToken: '32094324kjn32',
          user: {
            id: '123',
            name: 'Test User',
            email: 'test@example.com',
            photo: 'https://example.com/photo.jpg',
          }
        }
      })),
      signOut: jest.fn(() => Promise.resolve()),
      revokeAccess: jest.fn(() => Promise.resolve()),
    },
    statusCodes: {
      SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
      IN_PROGRESS: 'IN_PROGRESS',
      PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
    },
  }));
  
  // Mock the Alert component
  jest.mock('react-native', () => {
    const reactNative = jest.requireActual('react-native');
    reactNative.Alert = {
      alert: jest.fn(),
    };
    return reactNative;
  });
  
  // Now import the modules for testing
  import React from 'react';
  import { render, act } from '@testing-library/react-native';
  import { AuthProvider, useAuth } from '../../context/AuthContext';
  import { GoogleSignin } from '@react-native-google-signin/google-signin';
  import auth from '@react-native-firebase/auth';
  
  describe('AuthContext', () => {
    beforeEach(() => {
      // Clear all mocks before each test
      jest.clearAllMocks();
    });
  
    test('signIn function updates user state', async () => {
      // Create refs to hold the latest values
      const userRef = { current: null };
      let signIn;
      
      // Create a variable to store the auth state change callback
      let authStateChangeCallback;
      
      // Mock onAuthStateChanged to capture the callback
      auth().onAuthStateChanged.mockImplementation((callback) => {
        authStateChangeCallback = callback;
        callback(null); // Initially null
        return jest.fn(); // Return unsubscribe function
      });
  
      const TestComponent = () => {
        const authContext = useAuth();
        signIn = authContext.signIn;
        userRef.current = authContext.user;
        return null;
      };
  
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
  
      // Simulate sign-in
      await act(async () => {
        await signIn();
        
        // Manually trigger auth state change to simulate Firebase
        authStateChangeCallback({ 
          uid: '123', 
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: 'https://example.com/photo.jpg',
          phoneNumber: null,
          providerId: 'google.com'
        });
      });
      
      // Verify the auth functions were called
      expect(GoogleSignin.hasPlayServices).toHaveBeenCalled();
      expect(GoogleSignin.signIn).toHaveBeenCalled();
      expect(auth().signInWithCredential).toHaveBeenCalled();
      
      // Check that user state was updated
      expect(userRef.current).not.toBeNull();
      expect(userRef.current.email).toBe('test@example.com');
    });
  
    test('signOut function clears user state', async () => {
      let signOut;
      let user;
  
      const TestComponent = () => {
        const authContext = useAuth();
        signOut = authContext.signOut;
        user = authContext.user;
        return null;
      };
  
      // Set an initial user to verify signOut clears it
      auth().onAuthStateChanged.mockImplementation((callback) => {
        callback({ 
          uid: '123', 
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: 'https://example.com/photo.jpg',
          phoneNumber: null,
          providerId: 'google.com'
        });
        return jest.fn();
      });
  
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
  
      // Reset the mock to simulate the user being signed out
      auth().onAuthStateChanged.mockImplementation((callback) => {
        callback(null);
        return jest.fn();
      });
  
      await act(async () => {
        await signOut();
      });
  
      // Verify the sign out functions were called
      expect(GoogleSignin.revokeAccess).toHaveBeenCalled();
      expect(GoogleSignin.signOut).toHaveBeenCalled();
      expect(auth().signOut).toHaveBeenCalled();
      
      // Verify user state was cleared
      expect(user).toBeNull();
    });
  });