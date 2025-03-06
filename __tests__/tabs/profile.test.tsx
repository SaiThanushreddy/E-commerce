import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProfileScreen from '../../app/(tabs)/profile';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';


jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
  },
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, style }) => (
    <mock-safe-area-view style={style}>{children}</mock-safe-area-view>
  ),
}));

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    (useAuth as jest.Mock).mockReturnValue({
      loading: true,
      user: null,
      signOut: jest.fn(),
      signIn: jest.fn(),
    });

    const { getByText } = render(<ProfileScreen />);
    
    expect(getByText('Loading profile...')).toBeTruthy();
  });

  it('renders sign-in state correctly when user is not authenticated', () => {
    
    (useAuth as jest.Mock).mockReturnValue({
      loading: false,
      user: null,
      signOut: jest.fn(),
      signIn: jest.fn(),
    });

    const { getByText } = render(<ProfileScreen />);
    
    expect(getByText('Welcome to Our Store!')).toBeTruthy();
    expect(getByText('Sign in with Google')).toBeTruthy();
    expect(getByText('Sign in to manage your profile and orders')).toBeTruthy();
  });

  it('calls sign-in function when Google button is pressed', () => {
    const mockSignIn = jest.fn();
    

    (useAuth as jest.Mock).mockReturnValue({
      loading: false,
      user: null,
      signOut: jest.fn(),
      signIn: mockSignIn,
    });

    const { getByText } = render(<ProfileScreen />);
    
    const signInButton = getByText('Sign in with Google');
    fireEvent.press(signInButton);
    
    expect(mockSignIn).toHaveBeenCalledTimes(1);
  });

  it('renders profile correctly when user is authenticated', () => {
    const mockUser = {
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://test-photo-url.com',
      uid: '12345678abcdefgh',
    };
    

    (useAuth as jest.Mock).mockReturnValue({
      loading: false,
      user: mockUser,
      signOut: jest.fn(),
      signIn: jest.fn(),
    });

    const { getByText, getAllByText } = render(<ProfileScreen />);
    
    expect(getByText('Test User')).toBeTruthy();
    expect(getAllByText('test@example.com').length).toBe(2);
    expect(getByText('ID: 12345678...')).toBeTruthy();
    expect(getByText('My Orders')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
    expect(getByText('Sign Out')).toBeTruthy();
  });

  it('navigates back when back button is pressed', () => {
    const mockUser = {
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://test-photo-url.com',
      uid: '12345678abcdefgh',
    };
    
    (useAuth as jest.Mock).mockReturnValue({
      loading: false,
      user: mockUser,
      signOut: jest.fn(),
      signIn: jest.fn(),
    });

    const { getByTestId } = render(<ProfileScreen />);
    
    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);
    
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('calls sign-out function when Sign Out button is pressed', () => {
    const mockSignOut = jest.fn();
    const mockUser = {
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://test-photo-url.com',
      uid: '12345678abcdefgh',
    };
    
    (useAuth as jest.Mock).mockReturnValue({
      loading: false,
      user: mockUser,
      signOut: mockSignOut,
      signIn: jest.fn(),
    });

    const { getByText } = render(<ProfileScreen />);
    
    const signOutButton = getByText('Sign Out');
    fireEvent.press(signOutButton);
    
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('displays default name when user has no display name', () => {
    const mockUser = {
      displayName: null,
      email: 'test@example.com',
      photoURL: 'https://test-photo-url.com',
      uid: '12345678abcdefgh',
    };
    
    (useAuth as jest.Mock).mockReturnValue({
      loading: false,
      user: mockUser,
      signOut: jest.fn(),
      signIn: jest.fn(),
    });

    const { getByText } = render(<ProfileScreen />);
    
    expect(getByText('User')).toBeTruthy();
  });
});