
export interface UserInfo {
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
    providerId: string;
    uid: string;
  }
  
  export interface AuthContextType {
    user: UserInfo | null;
    loading: boolean;
    initializing: boolean;
    signIn: () => Promise<any>;
    signOut: () => Promise<void>;
  }
  
  export interface AuthProviderProps {
    children: React.ReactNode;
  }