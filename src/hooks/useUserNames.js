import { useEffect, useState, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * useUserNames - React hook to fetch and cache user display names by user ID.
 * @param {string[]} userIds - Array of user IDs to resolve.
 * @returns {Object} Mapping from user ID to display name (or fallback to email/ID).
 */
export default function useUserNames(userIds) {
  const [userNames, setUserNames] = useState({});
  const userCache = useRef({});

  useEffect(() => {
    // Filter out IDs already in cache
    const idsToFetch = (userIds || []).filter(
      id => id && !userCache.current[id]
    );
    if (idsToFetch.length === 0) {
      // If no new IDs to fetch, update state from cache
      setUserNames(prev => ({ ...prev, ...userCache.current }));
      return;
    }
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const newUserNames = { ...userCache.current };
        usersSnapshot.docs.forEach(userDoc => {
          if (idsToFetch.includes(userDoc.id)) {
            const data = userDoc.data();
            newUserNames[userDoc.id] = data.name || data.displayName || data.email || userDoc.id;
          }
        });
        userCache.current = newUserNames;
        setUserNames(prev => ({ ...prev, ...newUserNames }));
      } catch (error) {
        console.error('Error fetching user names:', error);
      }
    };
    fetchUsers();
  }, [userIds && userIds.join(',')]);

  return userNames;
} 