import { useEffect, useState } from 'react';
import { ref, onValue, set, off, get } from 'firebase/database';
import { database } from '../lib/firebase';
import { useMatchStore } from '../store/matchStore';

// Helper to extract only serializable data from the Zustand store
const getSerializableState = (state: any) => {
  return {
    matchCode: state.matchCode,
    status: state.status,
    totalOvers: state.totalOvers,
    team1: state.team1,
    team2: state.team2,
    currentInnings: state.currentInnings,
    strikerId: state.strikerId,
    nonStrikerId: state.nonStrikerId,
    currentBowler: state.currentBowler,
    ballHistory: state.ballHistory || [],
    sessionMatches: state.sessionMatches || [],
    innings1BallHistory: state.innings1BallHistory || [],
  };
};

export const useFirebaseSync = (matchCode: string | undefined, isAdmin: boolean) => {
  const [isLoading, setIsLoading] = useState(true);

  // 1. Initial Load & Viewer Subscription
  useEffect(() => {
    if (!matchCode) return;

    const matchRef = ref(database, `matches/${matchCode}`);
    
    // If Admin and we already have this match in local state, DO NOT fetch and overwrite.
    // This prevents losing local state when navigating from Setup/AddPlayers pages to LiveScore.
    if (isAdmin && useMatchStore.getState().matchCode === matchCode) {
      setIsLoading(false);
    } else {
      // Fetch once to load initial state (for viewers, or admins who refreshed the page)
      get(matchRef).then((snapshot) => {
        if (snapshot.exists()) {
          useMatchStore.setState(snapshot.val());
        }
        setIsLoading(false);
      }).catch((err) => {
        console.error("Firebase read error:", err);
        setIsLoading(false);
      });
    }

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
    const initialState = getSerializableState(useMatchStore.getState());
    
    console.log("WRITING TO FIREBASE", matchCode, initialState);
    
    // Using Promise.resolve().then to prevent synchronous throws from Firebase from crashing React
    Promise.resolve()
      .then(() => set(matchRef, initialState))
      .then(() => console.log("FIREBASE WRITE SUCCESS", matchCode))
      .catch((err) => {
        console.error("FIREBASE WRITE FAILED", err);
      });

    const unsubscribe = useMatchStore.subscribe((state) => {
      const stateToSync = getSerializableState(state);
      
      console.log("SYNC UPDATE", stateToSync);
      
      // Push state to Firebase
      Promise.resolve()
        .then(() => set(matchRef, stateToSync))
        .then(() => console.log("SYNC UPDATE SUCCESS", matchCode))
        .catch((err) => {
          console.error("FIREBASE WRITE FAILED", err);
        });
    });

    return () => unsubscribe();
  }, [matchCode, isAdmin, isLoading]);

  return { isLoading };
};
