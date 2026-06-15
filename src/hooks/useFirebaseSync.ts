import { useEffect, useState } from 'react';
import { ref, onValue, set, off, get } from 'firebase/database';
import { database } from '../lib/firebase';
import { useMatchStore } from '../store/matchStore';

export const useFirebaseSync = (matchCode: string | undefined, isAdmin: boolean) => {
  const [isLoading, setIsLoading] = useState(true);

  // 1. Initial Load & Viewer Subscription
  useEffect(() => {
    if (!matchCode) return;

    const matchRef = ref(database, `matches/${matchCode}`);
    
    // First, try to fetch once to resolve loading quickly
    get(matchRef).then((snapshot) => {
      if (snapshot.exists()) {
        useMatchStore.setState(snapshot.val());
      }
      setIsLoading(false);
    });

    // If viewer, keep listening to updates
    if (!isAdmin) {
      const unsubscribe = onValue(matchRef, (snapshot) => {
        if (snapshot.exists()) {
          useMatchStore.setState(snapshot.val());
        }
      });
      return () => {
        off(matchRef, 'value', unsubscribe);
      };
    }
  }, [matchCode, isAdmin]);

  // 2. Admin Push Updates
  useEffect(() => {
    if (!matchCode || !isAdmin || isLoading) return; // Don't push while loading initial state!

    const matchRef = ref(database, `matches/${matchCode}`);

    // Push initial state immediately (useful for newly created matches)
    const { pastStates, ...initialState } = useMatchStore.getState();
    set(matchRef, initialState).catch((err) => {
      console.error("Firebase sync error.", err);
    });

    const unsubscribe = useMatchStore.subscribe((state) => {
      // Don't sync the pastStates or it will get too large
      const { pastStates, ...stateToSync } = state;
      // Push state to Firebase
      set(matchRef, stateToSync).catch((err) => {
        console.error("Firebase sync error. Did you add the configuration in src/lib/firebase.ts?", err);
      });
    });

    return () => unsubscribe();
  }, [matchCode, isAdmin, isLoading]);

  return { isLoading };
};
