import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  writeBatch,
  getDocs,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  return context;
}

export function NotificationProvider({ children }) {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userProfile?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", userProfile.id),
      orderBy("createdAt", "desc"),
      limit(50),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
    });

    return unsubscribe;
  }, [userProfile?.id]);

  const markAsRead = useCallback(async (notificationId) => {
    await updateDoc(doc(db, "notifications", notificationId), { read: true });
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userProfile?.id) return;
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "==", userProfile.id),
      where("read", "==", false),
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
  }, [userProfile?.id]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
