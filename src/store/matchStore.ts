import { create } from 'zustand';

export type Player = {
  id: string;
  name: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  isOut: boolean;
};

export type Team = {
  id: string;
  name: string;
  players: Player[];
  runs: number;
  wickets: number;
  totalBalls: number;
};

export type MatchStatus = 'SETUP' | 'PLAYERS_SETUP' | 'IN_PROGRESS' | 'INNINGS_BREAK' | 'COMPLETED';

export type BallEvent = {
  id: string;
  runs: number;
  isWicket: boolean;
  isExtra: boolean;
  extraType?: 'WD' | 'NB';
  batsmanId: string | null;
  bowlerName: string;
  overNum: number;
  ballNum: number;
};

export type CompletedMatch = {
  id: string;
  team1: Team;
  team2: Team;
  totalOvers: number;
  ballHistory: BallEvent[];
};

// Snapshot for undo
export type StateSnapshot = {
  status: MatchStatus;
  team1: Team;
  team2: Team;
  currentInnings: 1 | 2;
  strikerId: string | null;
  nonStrikerId: string | null;
  currentBowler: string;
  ballHistory: BallEvent[];
  innings1BallHistory: BallEvent[];
};

type MatchState = {
  matchCode: string;
  status: MatchStatus;
  totalOvers: number;
  team1: Team;
  team2: Team;
  currentInnings: 1 | 2;
  strikerId: string | null;
  nonStrikerId: string | null;
  currentBowler: string;
  ballHistory: BallEvent[];
  innings1BallHistory: BallEvent[];
  whiteBallRuns: boolean;
  pastStates: StateSnapshot[]; // For undo history
  sessionMatches: CompletedMatch[]; // Matches in current session

  // Actions
  setMatchDetails: (team1Name: string, team2Name: string, overs: number, whiteBallRuns: boolean) => void;
  addPlayer: (teamNum: 1 | 2, playerName: string) => void;
  updatePlayer: (teamNum: 1 | 2, playerId: string, newName: string) => void;
  removePlayer: (teamNum: 1 | 2, playerId: string) => void;
  startMatch: () => void;
  setBatsmen: (strikerId: string, nonStrikerId: string | null) => void;
  setBatsmanForSlot: (slot: 'striker' | 'nonStriker', playerId: string) => void;
  setBowler: (name: string) => void;
  addRuns: (runs: number) => void;
  addWicket: () => void;
  addExtra: (type: 'WD' | 'NB') => void;
  switchInnings: () => void;
  undoLastAction: () => void;
  swapStrikeManually: (newStrikerId: string) => void;
  deleteMatch: () => void;
  startNewMatchInSession: () => void;
  endSession: () => void;
  removePlayerMidMatch: (teamNum: 1 | 2, playerId: string) => void;
  addPlayerMidMatch: (teamNum: 1 | 2, playerName: string) => void;
  updateTotalOvers: (overs: number) => void;
  deleteBall: (ballId: string) => void;
};

const generateId = () => Math.random().toString(36).substring(2, 9);
const generateMatchCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const initialTeam = (id: string): Team => ({
  id,
  name: '',
  players: [],
  runs: 0,
  wickets: 0,
  totalBalls: 0,
});

// Helper to create a snapshot of the current state before mutation
const createSnapshot = (state: MatchState): StateSnapshot => ({
  status: state.status,
  team1: JSON.parse(JSON.stringify(state.team1)),
  team2: JSON.parse(JSON.stringify(state.team2)),
  currentInnings: state.currentInnings,
  strikerId: state.strikerId,
  nonStrikerId: state.nonStrikerId,
  currentBowler: state.currentBowler,
  ballHistory: JSON.parse(JSON.stringify(state.ballHistory)),
  innings1BallHistory: JSON.parse(JSON.stringify(state.innings1BallHistory || [])),
});

// Helper to push a snapshot to history (max 10)
const pushSnapshot = (state: MatchState) => {
  const snapshot = createSnapshot(state);
  const newPastStates = [...state.pastStates, snapshot].slice(-10);
  return { pastStates: newPastStates };
};

export const useMatchStore = create<MatchState>((set) => ({
  matchCode: '',
  status: 'SETUP',
  totalOvers: 0,
  team1: initialTeam('t1'),
  team2: initialTeam('t2'),
  currentInnings: 1,
  strikerId: null,
  nonStrikerId: null,
  currentBowler: '',
  ballHistory: [],
  innings1BallHistory: [],
  pastStates: [],
  sessionMatches: [],
  whiteBallRuns: false,

  setMatchDetails: (team1Name, team2Name, overs, whiteBallRuns) => set((state) => ({
    matchCode: generateMatchCode(),
    status: 'PLAYERS_SETUP',
    totalOvers: overs,
    whiteBallRuns,
    team1: { ...state.team1, name: team1Name },
    team2: { ...state.team2, name: team2Name },
  })),

  addPlayer: (teamNum, playerName) => set((state) => {
    const teamKey = teamNum === 1 ? 'team1' : 'team2';
    const newPlayer: Player = {
      id: generateId(),
      name: playerName,
      runs: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
    };
    return {
      [teamKey]: {
        ...state[teamKey],
        players: [...state[teamKey].players, newPlayer],
      }
    };
  }),

  updatePlayer: (teamNum, playerId, newName) => set((state) => {
    const teamKey = teamNum === 1 ? 'team1' : 'team2';
    return {
      [teamKey]: {
        ...state[teamKey],
        players: state[teamKey].players.map(p => p.id === playerId ? { ...p, name: newName } : p)
      }
    };
  }),

  removePlayer: (teamNum, playerId) => set((state) => {
    const teamKey = teamNum === 1 ? 'team1' : 'team2';
    return {
      [teamKey]: {
        ...state[teamKey],
        players: state[teamKey].players.filter(p => p.id !== playerId)
      }
    };
  }),

  startMatch: () => set(() => {
    return {
      status: 'IN_PROGRESS',
      strikerId: null,
      nonStrikerId: null,
      pastStates: [], // reset on match start
    };
  }),

  setBatsmen: (strikerId, nonStrikerId) => set((state) => ({ 
    ...pushSnapshot(state),
    strikerId, 
    nonStrikerId 
  })),

  setBatsmanForSlot: (slot, playerId) => set((state) => {
    if (slot === 'striker') return { ...pushSnapshot(state), strikerId: playerId };
    return { ...pushSnapshot(state), nonStrikerId: playerId };
  }),

  setBowler: (name) => set(() => ({
    currentBowler: name
  })),

  addRuns: (runs) => set((state) => {
    const isTeam1Batting = state.currentInnings === 1;
    const teamKey = isTeam1Batting ? 'team1' : 'team2';
    const battingTeam = state[teamKey];

    // Update striker stats
    const updatedPlayers = battingTeam.players.map(p => {
      if (p.id === state.strikerId) {
        return {
          ...p,
          runs: p.runs + runs,
          ballsFaced: p.ballsFaced + 1,
          fours: p.fours + (runs === 4 ? 1 : 0),
          sixes: p.sixes + (runs === 6 ? 1 : 0),
        };
      }
      return p;
    });

    const newTeamTotal = battingTeam.runs + runs;
    const newTotalBalls = battingTeam.totalBalls + 1;

    let newStrikerId = state.strikerId;
    let newNonStrikerId = state.nonStrikerId;

    // Rotate strike on odd runs or end of over (if non-striker exists)
    if (newNonStrikerId !== null) {
      const isEndOfOver = newTotalBalls % 6 === 0;
      const isOddRuns = runs % 2 !== 0;

      if (isOddRuns !== isEndOfOver) { // XOR: swap if odd runs OR end of over, but not both
        newStrikerId = state.nonStrikerId;
        newNonStrikerId = state.strikerId;
      }
    }

    const newBallHistory = [...state.ballHistory, {
      id: generateId(),
      runs,
      isWicket: false,
      isExtra: false,
      batsmanId: state.strikerId,
      bowlerName: state.currentBowler,
      overNum: Math.floor((battingTeam.totalBalls) / 6),
      ballNum: (battingTeam.totalBalls % 6) + 1,
    }];

    let nextStatus = state.status;
    let nextBowler = state.currentBowler;
    if (newTotalBalls % 6 === 0) {
      nextBowler = '';
    }
    if (newTotalBalls >= state.totalOvers * 6 || (state.currentInnings === 2 && newTeamTotal > state.team1.runs)) {
       if (state.currentInnings === 1) {
           nextStatus = 'INNINGS_BREAK';
       } else {
           nextStatus = 'COMPLETED';
       }
    }

    return {
      ...pushSnapshot(state),
      [teamKey]: {
        ...battingTeam,
        runs: newTeamTotal,
        totalBalls: newTotalBalls,
        players: updatedPlayers,
      },
      currentBowler: nextBowler,
      strikerId: newStrikerId,
      nonStrikerId: newNonStrikerId,
      status: nextStatus,
      ballHistory: newBallHistory,
    };
  }),

  addWicket: () => set((state) => {
    const isTeam1Batting = state.currentInnings === 1;
    const teamKey = isTeam1Batting ? 'team1' : 'team2';
    const battingTeam = state[teamKey];

    const updatedPlayers = battingTeam.players.map(p => {
      if (p.id === state.strikerId) {
        return { ...p, ballsFaced: p.ballsFaced + 1, isOut: true };
      }
      return p;
    });

    const newWickets = battingTeam.wickets + 1;
    const newTotalBalls = battingTeam.totalBalls + 1;
    
    const newBallHistory = [...state.ballHistory, {
      id: generateId(),
      runs: 0,
      isWicket: true,
      isExtra: false,
      batsmanId: state.strikerId,
      bowlerName: state.currentBowler,
      overNum: Math.floor((battingTeam.totalBalls) / 6),
      ballNum: (battingTeam.totalBalls % 6) + 1,
    }];

    let newStriker: string | null = null;
    let newNonStriker: string | null = state.nonStrikerId;

    const remainingPlayers = updatedPlayers.filter(p => !p.isOut);
    
    // Last man standing logic
    if (remainingPlayers.length === 1) {
        newStriker = remainingPlayers[0].id;
        newNonStriker = null;
    } else {
        // End of over logic, swap strike if a nonStriker exists
        if (newTotalBalls % 6 === 0 && newNonStriker !== null) {
           newStriker = newNonStriker;
           newNonStriker = null;
        }
    }

    let nextStatus = state.status;
    let nextBowler = state.currentBowler;
    if (newTotalBalls % 6 === 0) {
      nextBowler = '';
    }
    // Innings ends if ALL players are out, or overs are finished
    if (newWickets >= battingTeam.players.length || newTotalBalls >= state.totalOvers * 6) {
       if (state.currentInnings === 1) {
           nextStatus = 'INNINGS_BREAK';
       } else {
           nextStatus = 'COMPLETED';
       }
    }

    return {
      ...pushSnapshot(state),
      [teamKey]: {
        ...battingTeam,
        wickets: newWickets,
        totalBalls: newTotalBalls,
        players: updatedPlayers,
      },
      currentBowler: nextBowler,
      strikerId: newStriker,
      nonStrikerId: newNonStriker,
      status: nextStatus,
      ballHistory: newBallHistory,
    };
  }),

  addExtra: (type) => set((state) => {
    const isTeam1Batting = state.currentInnings === 1;
    const teamKey = isTeam1Batting ? 'team1' : 'team2';
    const battingTeam = state[teamKey];
    
    let extraRuns = 0;
    if (type === 'NB') {
      extraRuns = 1;
    } else if (type === 'WD') {
      extraRuns = state.whiteBallRuns ? 1 : 0;
    }

    const newTeamTotal = battingTeam.runs + extraRuns;

    const newBallHistory = [...state.ballHistory, {
      id: generateId(),
      runs: 0,
      isWicket: false,
      isExtra: true,
      extraType: type,
      batsmanId: null,
      bowlerName: state.currentBowler,
      overNum: Math.floor((battingTeam.totalBalls) / 6),
      ballNum: (battingTeam.totalBalls % 6) + 1,
    }];

    return {
      ...pushSnapshot(state),
      [teamKey]: {
        ...battingTeam,
        runs: newTeamTotal,
      },
      ballHistory: newBallHistory,
    };
  }),

  switchInnings: () => set((state) => {
    return {
      ...pushSnapshot(state),
      currentInnings: 2,
      status: 'IN_PROGRESS',
      strikerId: null,
      nonStrikerId: null,
      currentBowler: '', // Reset bowler
      innings1BallHistory: [...state.ballHistory],
      ballHistory: [], // reset history for new innings
    };
  }),

  undoLastAction: () => set((state) => {
    if (state.pastStates.length === 0) return state; // nothing to undo
    
    const newPastStates = [...state.pastStates];
    const snapshot = newPastStates.pop()!;
    
    return {
      status: snapshot.status,
      team1: snapshot.team1,
      team2: snapshot.team2,
      currentInnings: snapshot.currentInnings,
      strikerId: snapshot.strikerId,
      nonStrikerId: snapshot.nonStrikerId,
      currentBowler: snapshot.currentBowler,
      ballHistory: snapshot.ballHistory,
      innings1BallHistory: snapshot.innings1BallHistory,
      pastStates: newPastStates,
    };
  }),

  swapStrikeManually: (newStrikerId) => set((state) => {
    // Only swap if the clicked ID is the non-striker
    if (newStrikerId === state.nonStrikerId && state.strikerId !== null) {
      return {
        ...pushSnapshot(state),
        strikerId: state.nonStrikerId,
        nonStrikerId: state.strikerId,
      };
    }
    return state;
  }),

  deleteMatch: () => set({
    matchCode: '',
    status: 'SETUP',
    totalOvers: 0,
    whiteBallRuns: false,
    team1: initialTeam('t1'),
    team2: initialTeam('t2'),
    currentInnings: 1,
    strikerId: null,
    nonStrikerId: null,
    currentBowler: '',
    ballHistory: [],
    pastStates: [],
    sessionMatches: [],
  }),

  startNewMatchInSession: () => set((state) => {
    const completedMatch: CompletedMatch = {
      id: generateId(),
      team1: JSON.parse(JSON.stringify(state.team1)),
      team2: JSON.parse(JSON.stringify(state.team2)),
      totalOvers: state.totalOvers,
      ballHistory: [...state.innings1BallHistory, ...state.ballHistory],
    };

    const resetTeam = (team: Team): Team => ({
      ...team,
      runs: 0,
      wickets: 0,
      totalBalls: 0,
      players: team.players.map(p => ({
        ...p,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
        isOut: false
      }))
    });

    return {
      sessionMatches: [...state.sessionMatches, completedMatch],
      status: 'PLAYERS_SETUP',
      team1: resetTeam(state.team1),
      team2: resetTeam(state.team2),
      currentInnings: 1,
      strikerId: null,
      nonStrikerId: null,
      currentBowler: '',
      ballHistory: [],
      innings1BallHistory: [],
      pastStates: [],
    };
  }),

  endSession: () => set({
    matchCode: '',
    status: 'SETUP',
    totalOvers: 0,
    whiteBallRuns: false,
    team1: initialTeam('t1'),
    team2: initialTeam('t2'),
    currentInnings: 1,
    strikerId: null,
    nonStrikerId: null,
    currentBowler: '',
    ballHistory: [],
    innings1BallHistory: [],
    pastStates: [],
    sessionMatches: [],
  }),

  removePlayerMidMatch: (teamNum, playerId) => set((state) => {
    const teamKey = teamNum === 1 ? 'team1' : 'team2';
    return {
      ...pushSnapshot(state),
      [teamKey]: {
        ...state[teamKey],
        players: state[teamKey].players.filter(p => p.id !== playerId)
      }
    };
  }),

  addPlayerMidMatch: (teamNum, playerName) => set((state) => {
    const teamKey = teamNum === 1 ? 'team1' : 'team2';
    const newPlayer: Player = {
      id: generateId(),
      name: playerName,
      runs: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
    };
    return {
      ...pushSnapshot(state),
      [teamKey]: {
        ...state[teamKey],
        players: [...state[teamKey].players, newPlayer]
      }
    };
  }),

  updateTotalOvers: (overs) => set((state) => {
    return {
      ...pushSnapshot(state),
      totalOvers: overs
    };
  }),

  deleteBall: (ballId) => set((state) => {
    return state; 
  }),
}));
