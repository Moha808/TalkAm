import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const profileDoc = await getDoc(doc(db, "users", user.uid));
        if (profileDoc.exists()) {
          setUserProfile({ id: user.uid, ...profileDoc.data() });
        } else {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signup(email, password) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result;
  }

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    const profileDoc = await getDoc(doc(db, "users", result.user.uid));
    if (!profileDoc.exists()) {
      return { user: result.user, isNewUser: true };
    }
    setUserProfile({ id: result.user.uid, ...profileDoc.data() });
    return { user: result.user, isNewUser: false };
  }

  async function logout() {
    setUserProfile(null);
    return signOut(auth);
  }

  async function createProfile(uid, profileData) {
    const profile = {
      ...profileData,
      uid,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      role: "user",
      banned: false,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "users", uid), profile);
    setUserProfile({ id: uid, ...profile });
    if (profileData.displayName) {
      await updateProfile(auth.currentUser, {
        displayName: profileData.displayName,
      });
    }
    return profile;
  }

  async function refreshProfile() {
    if (currentUser) {
      const profileDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (profileDoc.exists()) {
        setUserProfile({ id: currentUser.uid, ...profileDoc.data() });
      }
    }
  }

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    createProfile,
    refreshProfile,
    setUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
