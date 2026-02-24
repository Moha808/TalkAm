import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  increment,
  serverTimestamp,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  addDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { uploadImage } from "../utils/helpers";

// ==================== USER SERVICES ====================

export async function getUserByUsername(username) {
  const q = query(collection(db, "users"), where("username", "==", username));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

export async function isUsernameAvailable(username) {
  const user = await getUserByUsername(username);
  return !user;
}

export async function getUserById(uid) {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, "users", uid), data);
}

export async function searchUsers(searchTerm, currentUserId) {
  const q = query(
    collection(db, "users"),
    where("username", ">=", searchTerm.toLowerCase()),
    where("username", "<=", searchTerm.toLowerCase() + "\uf8ff"),
    limit(10),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((u) => u.id !== currentUserId);
}

export async function getSuggestedUsers(currentUserId, max = 5) {
  const followingSnap = await getDocs(
    query(collection(db, "follows"), where("followerId", "==", currentUserId)),
  );
  const followingIds = followingSnap.docs.map((d) => d.data().followedId);
  followingIds.push(currentUserId);

  const usersSnap = await getDocs(
    query(
      collection(db, "users"),
      where("banned", "==", false),
      limit(max + followingIds.length),
    ),
  );

  return usersSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((u) => !followingIds.includes(u.id))
    .slice(0, max);
}

// ==================== POST SERVICES ====================

export async function createPost(postData) {
  const postRef = doc(collection(db, "posts"));
  let imageURL = null;

  if (postData.imageFile) {
    imageURL = await uploadImage(postData.imageFile);
  }

  const post = {
    userId: postData.userId,
    text: postData.text || "",
    imageURL,
    likesCount: 0,
    commentsCount: 0,
    createdAt: serverTimestamp(),
  };

  await setDoc(postRef, post);
  await updateDoc(doc(db, "users", postData.userId), {
    postsCount: increment(1),
  });
  return { id: postRef.id, ...post };
}

export async function deletePost(postId, userId) {
  await deleteDoc(doc(db, "posts", postId));
  await updateDoc(doc(db, "users", userId), { postsCount: increment(-1) });

  const likesSnap = await getDocs(
    query(collection(db, "likes"), where("postId", "==", postId)),
  );
  const commentsSnap = await getDocs(
    query(collection(db, "comments"), where("postId", "==", postId)),
  );
  const batch = writeBatch(db);
  likesSnap.docs.forEach((d) => batch.delete(d.ref));
  commentsSnap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function getUserPosts(userId) {
  const q = query(
    collection(db, "posts"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function subscribeToPosts(callback, lastDoc = null, pageSize = 10) {
  let q;
  if (lastDoc) {
    q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(pageSize),
    );
  } else {
    q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(pageSize),
    );
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const posts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(posts, snapshot.docs[snapshot.docs.length - 1]);
    },
    (error) => {
      console.error("subscribeToPosts error:", error);
      callback([], null);
    },
  );
}

export async function getFollowedUsersPosts(
  currentUserId,
  lastDoc = null,
  pageSize = 10,
) {
  const followingSnap = await getDocs(
    query(collection(db, "follows"), where("followerId", "==", currentUserId)),
  );
  const followingIds = followingSnap.docs.map((d) => d.data().followedId);
  followingIds.push(currentUserId);

  if (followingIds.length === 0) return { posts: [], lastDoc: null };

  const chunks = [];
  for (let i = 0; i < followingIds.length; i += 10) {
    chunks.push(followingIds.slice(i, i + 10));
  }

  let allPosts = [];
  for (const chunk of chunks) {
    let q;
    if (lastDoc) {
      q = query(
        collection(db, "posts"),
        where("userId", "in", chunk),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(pageSize),
      );
    } else {
      q = query(
        collection(db, "posts"),
        where("userId", "in", chunk),
        orderBy("createdAt", "desc"),
        limit(pageSize),
      );
    }
    const snapshot = await getDocs(q);
    allPosts = allPosts.concat(
      snapshot.docs.map((d) => ({ id: d.id, ...d.data(), _doc: d })),
    );
  }

  allPosts.sort((a, b) => {
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;
    return bTime - aTime;
  });

  const result = allPosts.slice(0, pageSize);
  const newLastDoc = result.length > 0 ? result[result.length - 1]._doc : null;
  return { posts: result.map(({ _doc, ...p }) => p), lastDoc: newLastDoc };
}

// ==================== LIKE SERVICES ====================

export async function likePost(postId, userId, postOwnerId) {
  const likeId = `${userId}_${postId}`;
  await setDoc(doc(db, "likes", likeId), {
    postId,
    userId,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "posts", postId), { likesCount: increment(1) });

  if (userId !== postOwnerId) {
    await addDoc(collection(db, "notifications"), {
      type: "like",
      senderId: userId,
      recipientId: postOwnerId,
      postId,
      read: false,
      createdAt: serverTimestamp(),
    });
  }
}

export async function unlikePost(postId, userId) {
  const likeId = `${userId}_${postId}`;
  await deleteDoc(doc(db, "likes", likeId));
  await updateDoc(doc(db, "posts", postId), { likesCount: increment(-1) });
}

export async function hasUserLikedPost(postId, userId) {
  const likeId = `${userId}_${postId}`;
  const docSnap = await getDoc(doc(db, "likes", likeId));
  return docSnap.exists();
}

// ==================== COMMENT SERVICES ====================

export async function addComment(postId, userId, text, postOwnerId) {
  const commentRef = await addDoc(collection(db, "comments"), {
    postId,
    userId,
    text,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "posts", postId), { commentsCount: increment(1) });

  if (userId !== postOwnerId) {
    await addDoc(collection(db, "notifications"), {
      type: "comment",
      senderId: userId,
      recipientId: postOwnerId,
      postId,
      commentText: text.substring(0, 100),
      read: false,
      createdAt: serverTimestamp(),
    });
  }

  return { id: commentRef.id };
}

export async function getComments(postId) {
  const q = query(
    collection(db, "comments"),
    where("postId", "==", postId),
    orderBy("createdAt", "asc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteComment(commentId, postId) {
  await deleteDoc(doc(db, "comments", commentId));
  await updateDoc(doc(db, "posts", postId), { commentsCount: increment(-1) });
}

// ==================== FOLLOW SERVICES ====================

export async function followUser(followerId, followedId) {
  const followId = `${followerId}_${followedId}`;
  await setDoc(doc(db, "follows", followId), {
    followerId,
    followedId,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "users", followerId), {
    followingCount: increment(1),
  });
  await updateDoc(doc(db, "users", followedId), {
    followersCount: increment(1),
  });

  await addDoc(collection(db, "notifications"), {
    type: "follow",
    senderId: followerId,
    recipientId: followedId,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function unfollowUser(followerId, followedId) {
  const followId = `${followerId}_${followedId}`;
  await deleteDoc(doc(db, "follows", followId));
  await updateDoc(doc(db, "users", followerId), {
    followingCount: increment(-1),
  });
  await updateDoc(doc(db, "users", followedId), {
    followersCount: increment(-1),
  });
}

export async function isFollowing(followerId, followedId) {
  const followId = `${followerId}_${followedId}`;
  const docSnap = await getDoc(doc(db, "follows", followId));
  return docSnap.exists();
}

export async function getFollowers(userId) {
  const q = query(collection(db, "follows"), where("followedId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data().followerId);
}

export async function getFollowing(userId) {
  const q = query(collection(db, "follows"), where("followerId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data().followedId);
}

// ==================== CHAT SERVICES ====================

export async function getOrCreateChat(userId1, userId2) {
  const chatId = [userId1, userId2].sort().join("_");
  const chatRef = doc(db, "chats", chatId);

  try {
    const chatDoc = await getDoc(chatRef);
    if (!chatDoc.exists()) {
      await setDoc(chatRef, {
        participants: [userId1, userId2],
        lastMessage: "",
        lastMessageTime: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    }
  } catch {
    // Read may fail if doc doesn't exist yet (security rules require
    // the caller to be in participants, which is null for missing docs).
    // In that case, just create the chat.
    await setDoc(chatRef, {
      participants: [userId1, userId2],
      lastMessage: "",
      lastMessageTime: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  }

  return chatId;
}

export function subscribeToMessages(chatId, callback) {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc"),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(messages);
    },
    (error) => {
      console.error("subscribeToMessages error:", error);
      callback([]);
    },
  );
}

export async function sendMessage(chatId, senderId, text, mediaURL = null) {
  await addDoc(collection(db, "chats", chatId, "messages"), {
    senderId,
    text: text || "",
    mediaURL,
    seen: false,
    createdAt: serverTimestamp(),
  });

  // Determine the other participant from the chatId (format: id1_id2 sorted)
  const participantIds = chatId.split("_");
  const recipientId = participantIds.find((id) => id !== senderId) || "";

  const updateData = {
    lastMessage: text || "📷 Image",
    lastMessageTime: serverTimestamp(),
    lastSenderId: senderId,
  };

  // Mark as unread for the recipient
  if (recipientId) {
    updateData[`read_${recipientId}`] = false;
  }

  await updateDoc(doc(db, "chats", chatId), updateData);
}

export async function markChatRead(chatId, userId) {
  await updateDoc(doc(db, "chats", chatId), {
    [`read_${userId}`]: true,
  });
}

export function subscribeToChats(userId, callback) {
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", userId),
    orderBy("lastMessageTime", "desc"),
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const chats = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(chats);
    },
    (error) => {
      console.error("subscribeToChats error:", error);
      // Still call back with empty array so loading state resolves
      callback([]);
    },
  );
}

export async function markMessagesSeen(chatId, messageIds) {
  const batch = writeBatch(db);
  messageIds.forEach((id) => {
    batch.update(doc(db, "chats", chatId, "messages", id), { seen: true });
  });
  await batch.commit();
}

export async function setTypingStatus(chatId, userId, isTyping) {
  await updateDoc(doc(db, "chats", chatId), {
    [`typing_${userId}`]: isTyping,
  });
}

// ==================== REPORT SERVICES ====================

export async function reportContent(reportData) {
  await addDoc(collection(db, "reports"), {
    ...reportData,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

export async function getReports() {
  const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function resolveReport(reportId, action) {
  await updateDoc(doc(db, "reports", reportId), {
    status: action,
    resolvedAt: serverTimestamp(),
  });
}

export async function banUser(userId) {
  await updateDoc(doc(db, "users", userId), { banned: true });
}

export async function unbanUser(userId) {
  await updateDoc(doc(db, "users", userId), { banned: false });
}

export async function getAllUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}
