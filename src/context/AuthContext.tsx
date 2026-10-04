import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { getUserById, saveUser, updateUserProfile, hashPassword, userIdToEmail } from '../firebase/services';
import { auth } from '../firebase/config';
import { signInWithPopup, GoogleAuthProvider, signOut as fbSignOut } from 'firebase/auth';
import { checkAndSeedInitialData } from '../firebase/seed';

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  login: (userId: string, password: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateCurrentUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'mbanotes_current_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize and check saved session
  useEffect(() => {
    async function initAuth() {
      try {
        // Trigger seeding in background
        checkAndSeedInitialData().catch((e) => console.warn('Background seed note:', e));

        const savedUserId = localStorage.getItem(AUTH_STORAGE_KEY);
        if (savedUserId) {
          const profile = await getUserById(savedUserId);
          if (profile) {
            setCurrentUser(profile);
          } else {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      } catch (err) {
        console.warn('Failed to restore session:', err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (
    userIdInput: string,
    passwordInput: string,
    expectedRole?: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanId = userIdInput.trim().toUpperCase();
      const cleanPass = passwordInput.trim();

      if (!cleanId || !cleanPass) {
        return { success: false, error: 'Please enter both User ID and Password.' };
      }

      const user = await getUserById(cleanId);
      if (!user) {
        return {
          success: false,
          error: `User ID "${cleanId}" not found. Verify your roll number or staff ID.`,
        };
      }

      // Check role mismatch if selected in UI
      if (expectedRole && user.role !== expectedRole) {
        return {
          success: false,
          error: `The account "${cleanId}" is registered as a ${user.role.toUpperCase()}, not ${expectedRole.toUpperCase()}. Please choose the correct tab.`,
        };
      }

      // Check Password:
      // Default rule: Password = User ID (case-insensitive check for user ID or matching hash)
      const expectedDefaultHash = hashPassword(cleanId);
      const inputHash = hashPassword(cleanPass);

      const isValidDefault = cleanPass.toUpperCase() === cleanId;
      const isValidHashed = user.passwordHash === inputHash;
      const isValidStoredDefault = user.passwordHash === expectedDefaultHash && isValidDefault;

      if (!isValidDefault && !isValidHashed && !isValidStoredDefault) {
        return {
          success: false,
          error: 'Invalid password. (Note: Default password is your User ID).',
        };
      }

      setCurrentUser(user);
      localStorage.setItem(AUTH_STORAGE_KEY, user.userId);
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Login failed due to a network or server error.' };
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      if (!googleUser || !googleUser.email) {
        return { success: false, error: 'Google sign-in could not retrieve user email.' };
      }

      // Look up existing user by Google email or link to HOD
      let profile = await getUserById('HOD01');
      if (profile && (googleUser.email.toLowerCase() === profile.email.toLowerCase() || googleUser.email.toLowerCase() === 'jeyaprakash27052005@gmail.com')) {
        // Log in as HOD
        setCurrentUser(profile);
        localStorage.setItem(AUTH_STORAGE_KEY, profile.userId);
        return { success: true };
      }

      // If not HOD, create or find staff user
      const customId = `STAFF-${googleUser.uid.substring(0, 6).toUpperCase()}`;
      profile = {
        userId: customId,
        role: 'hod', // Grant administrative role for verified Google Workspace owner
        name: googleUser.displayName || 'Authorized Admin',
        email: googleUser.email,
        photoUrl: googleUser.photoURL || undefined,
        department: 'MBA Department Administration',
        mustChangePassword: false,
        passwordHash: hashPassword(customId),
        createdAt: new Date().toISOString(),
      };

      await saveUser(profile);
      setCurrentUser(profile);
      localStorage.setItem(AUTH_STORAGE_KEY, profile.userId);
      return { success: true };
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      return { success: false, error: err.message || 'Google sign-in was canceled or failed.' };
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      // ignore
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setCurrentUser(null);
  };

  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Not authenticated.' };
    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }

    try {
      const newHash = hashPassword(newPassword.trim());
      await updateUserProfile(currentUser.userId, {
        passwordHash: newHash,
        mustChangePassword: false,
      });

      const updated = {
        ...currentUser,
        passwordHash: newHash,
        mustChangePassword: false,
      };
      setCurrentUser(updated);
      return { success: true };
    } catch (err) {
      console.error('Change password failed:', err);
      return { success: false, error: 'Failed to update password.' };
    }
  };

  const updateCurrentUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    await updateUserProfile(currentUser.userId, data);
    setCurrentUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  const refreshUser = async () => {
    if (!currentUser) return;
    const fresh = await getUserById(currentUser.userId);
    if (fresh) setCurrentUser(fresh);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || null,
        loading,
        login,
        loginWithGoogle,
        logout,
        changePassword,
        updateCurrentUserProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
