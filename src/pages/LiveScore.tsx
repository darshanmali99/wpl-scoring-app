import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useMatchStore } from '../store/matchStore';
import type { Player, BallEvent } from '../store/matchStore';
import { Card } from '../components/Card';
import { NeonButton } from '../components/NeonButton';
import { Trophy, Trash2, Undo2, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import { useFirebaseSync } from '../hooks/useFirebaseSync';

const ScoreButton = ({ value, onClick, color = 'green', className = '', disabled = false }: { value: string | number, onClick: () => void, color?: 'green' | 'blue' | 'red' | 'yellow', className?: string, disabled?: boolean }) => {
  const colorClass = color === 'green' ? 'border-neonGreen text-neonGreen hover:bg-neonGreen/20' 
                   : color === 'blue' ? 'border-neonBlue text-neonBlue hover:bg-neonBlue/20'
                   : color === 'yellow' ? 'border-yellow-400 text-yellow-400 hover:bg-yellow-400/20'
                   : 'border-red-500 text-red-500 hover:bg-red-500/20';
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 font-bold text-lg sm:text-xl flex items-center justify-center transition-all transform active:scale-90 ${colorClass} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {value}
    </button>
  );
};

export const LiveScore = () => {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const isAdmin = searchParams.get('admin') === 'true';
  const navigate = useNavigate();

  const store = useMatchStore();
  const [cheer, setCheer] = useState<string | null>(null);
  const [showOverHistory, setShowOverHistory] = useState(false);

  // Sync state with Firebase
  const { isLoading } = useFirebaseSync(code, isAdmin);

  useEffect(() => {
    if (store.matchCode && store.matchCode !== code) {
      // Logic for mismatched code
    }
  }, [code, store.matchCode]);

  // Trigger cheer effect when a 4 or 6 is hit
  useEffect(() => {
    if (store.ballHistory.length > 0) {
      const lastBall = store.ballHistory[store.ballHistory.length - 1];
      if (lastBall.runs === 4) {
        setCheer('FOUR!');
      } else if (lastBall.runs === 6) {
        setCheer('SIX!');
      } else {
        setCheer(null);
      }

      if (lastBall.runs === 4 || lastBall.runs === 6) {
        const timer = setTimeout(() => setCheer(null), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [store.ballHistory]);

  if (isLoading) {
    return <div className="p-6 text-center text-gray-500 flex flex-col items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-4 border-neonBlue border-t-transparent rounded-full animate-spin mb-4"></div>
      <p>Loading Live Score...</p>
    </div>;
  }

  if (store.status === 'SETUP' || store.status === 'PLAYERS_SETUP') {
    return <div className="p-6 text-center text-gray-500 flex flex-col items-center justify-center min-h-screen">
      <p>Match not found or not started.</p>
      <NeonButton className="mt-4" onClick={() => navigate('/')}>Go Home</NeonButton>
    </div>;
  }

  const isTeam1Batting = store.currentInnings === 1;
  const battingTeam = isTeam1Batting ? store.team1 : store.team2;
  const bowlingTeam = isTeam1Batting ? store.team2 : store.team1;

  const striker = battingTeam.players.find(p => p.id === store.strikerId);
  const nonStriker = battingTeam.players.find(p => p.id === store.nonStrikerId);
  const availableBatsmen = battingTeam.players.filter(p => !p.isOut);

  const formatOvers = (totalBalls: number) => `${Math.floor(totalBalls / 6)}.${totalBalls % 6}`;

  const currentBowlerHistory = store.ballHistory.filter(b => b.bowlerName === store.currentBowler && store.currentBowler !== '');
  const bowlerRuns = currentBowlerHistory.reduce((sum, b) => sum + b.runs, 0);
  const bowlerWickets = currentBowlerHistory.filter(b => b.isWicket).length;
  const bowlerLegalBalls = currentBowlerHistory.filter(b => !b.isExtra).length;
  const bowlerOvers = `${Math.floor(bowlerLegalBalls / 6)}.${bowlerLegalBalls % 6}`;

  const currentOverBalls = store.ballHistory.filter(b => b.overNum === Math.floor(battingTeam.totalBalls / 6));

  const handleDeleteMatch = () => {
    if (confirm("Are you sure you want to delete this match? This cannot be undone.")) {
      store.deleteMatch();
      navigate('/');
    }
  };

  const oversHistory = Array.from({ length: Math.floor(battingTeam.totalBalls / 6) + (battingTeam.totalBalls % 6 === 0 ? 0 : 1) }).map((_, i) => {
    return store.ballHistory.filter(b => b.overNum === i);
  });

  let manOfTheMatch = null;
  let bowlerOfTheMatch = null;

  if (store.status === 'COMPLETED') {
    const allPlayers = [...store.team1.players, ...store.team2.players];
    manOfTheMatch = allPlayers.reduce((max, p) => p.runs > max.runs ? p : max, allPlayers[0]);
    
    const allBalls = [...store.innings1BallHistory, ...store.ballHistory];
    const bowlerStats: Record<string, { wickets: number, runs: number }> = {};
    allBalls.forEach(b => {
       if (!b.bowlerName) return;
       if (!bowlerStats[b.bowlerName]) bowlerStats[b.bowlerName] = { wickets: 0, runs: 0 };
       if (b.isWicket) bowlerStats[b.bowlerName].wickets += 1;
       bowlerStats[b.bowlerName].runs += b.runs + (b.isExtra ? 1 : 0);
    });
    const bowlers = Object.entries(bowlerStats).map(([name, stats]) => ({ name, ...stats }));
    if (bowlers.length > 0) {
       bowlerOfTheMatch = bowlers.reduce((best, b) => {
          if (b.wickets > best.wickets) return b;
          if (b.wickets === best.wickets && b.runs < best.runs) return b;
          return best;
       }, bowlers[0]);
    }
  }

  const renderBall = (b: BallEvent) => {
    if (b.isWicket) return 'W';
    if (b.isExtra) return b.extraType;
    return b.runs.toString();
  };

  const renderBatsmanRow = (p: Player | undefined, slot: 'striker' | 'nonStriker') => {
    if (!p) {
      if (!isAdmin) return null;
      return (
        <div className="flex justify-between items-center p-1 -mx-1">
          <select 
            className="bg-black/50 border border-white/20 rounded p-1 text-sm text-white focus:outline-none"
            value=""
            onChange={e => store.setBatsmanForSlot(slot, e.target.value)}
          >
            <option value="">Select Batsman</option>
            {availableBatsmen.filter(b => b.id !== (slot === 'striker' ? store.nonStrikerId : store.strikerId)).map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div 
        onClick={() => isAdmin && slot === 'nonStriker' && store.swapStrikeManually(p.id)}
        className={`flex justify-between items-center ${isAdmin && slot === 'nonStriker' ? 'cursor-pointer hover:bg-white/5 p-1 -mx-1 rounded' : 'p-1 -mx-1'}`}
      >
        <div className="flex items-center gap-1">
          {isAdmin ? (
            <select 
              className={`bg-transparent font-semibold text-sm sm:text-base focus:outline-none focus:text-neonBlue appearance-none ${slot === 'striker' ? 'text-neonGreen' : 'text-white'}`}
              value={p.id}
              onChange={e => store.setBatsmanForSlot(slot, e.target.value)}
              onClick={e => e.stopPropagation()}
            >
              {availableBatsmen.map(b => (
                <option key={b.id} value={b.id} className="text-black">{b.name}</option>
              ))}
            </select>
          ) : (
            <span className={`font-semibold text-sm sm:text-base ${slot === 'striker' ? 'text-neonGreen' : ''}`}>
              {p.name}
            </span>
          )}
          {slot === 'striker' && <span className="text-neonGreen text-lg leading-none">*</span>}
        </div>
        <div className="flex gap-2 sm:gap-4 font-mono text-sm sm:text-base">
          <span className="w-6 sm:w-8 text-right font-bold text-white">{p.runs}</span>
          <span className="w-6 sm:w-8 text-right text-gray-400">{p.ballsFaced}</span>
          <span className="w-6 sm:w-8 text-right text-gray-400">{p.fours}</span>
          <span className="w-6 sm:w-8 text-right text-gray-400">{p.sixes}</span>
        </div>
      </div>
    );
  };

  const umpireDisabled = !store.strikerId || !store.currentBowler;

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-darkBackground text-white relative">
      
      {/* Cheer Overlay */}
      {cheer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative">
            {/* Fancy Bat and Ball Animation */}
            {cheer === 'SIX!' || cheer === 'FOUR!' ? (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none flex items-center justify-center">
                <div className="w-4 h-24 bg-[#e6c280] rounded-sm animate-bat-swing origin-bottom absolute bottom-10 -left-10 shadow-[0_0_15px_rgba(230,194,128,0.5)] z-20"></div>
                <div className="w-6 h-6 bg-red-600 rounded-full animate-ball-fly absolute bottom-10 left-0 shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.5),0_0_10px_red] z-10">
                  <div className="w-full h-[2px] bg-white/50 absolute top-1/2 -translate-y-1/2 shadow-sm"></div>
                </div>
              </div>
            ) : null}
            <div className="text-8xl font-extrabold italic transform -rotate-12 scale-150 animate-bounce relative z-30">
              <span className={`drop-shadow-[0_0_20px_currentColor] ${cheer === 'SIX!' ? 'text-neonGreen' : 'text-neonBlue'}`}>
                {cheer}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-darkSurface p-4 flex justify-between items-center shadow-lg border-b border-white/5">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-neonGreen" />
          <span className="font-bold tracking-wider text-sm sm:text-base">WPL LIVE</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-xs sm:text-sm font-mono bg-black/50 px-2 py-1 rounded-full border border-white/10">
            CODE: <span className="text-neonBlue">{store.matchCode || code}</span>
          </div>
          {isAdmin && (
            <button onClick={handleDeleteMatch} className="text-red-500 hover:text-red-400 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4 flex-1 flex flex-col space-y-3 overflow-y-auto pb-8">
        {/* Main Score Card */}
        <Card className="text-center relative overflow-hidden p-4 sm:p-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neonGreen to-neonBlue"></div>
          <p className="text-xs sm:text-sm text-gray-400 mb-1">{battingTeam.name} Innings</p>
          <div className="flex justify-center items-end gap-2 mb-2">
            <h1 className="text-5xl sm:text-6xl font-extrabold neon-text-green">{battingTeam.runs}</h1>
            <span className="text-2xl sm:text-3xl font-bold text-gray-400 mb-1">/ {battingTeam.wickets}</span>
          </div>
          <p className="text-base sm:text-lg font-mono text-gray-300">
            Overs: <span className="text-white">{formatOvers(battingTeam.totalBalls)}</span> / {store.totalOvers}
          </p>
          
          {/* This Over sequence */}
          <div className="mt-3 flex gap-2 overflow-x-auto justify-center pb-2">
             <span className="text-xs text-gray-400 flex items-center pr-2">This Over:</span>
             {currentOverBalls.length === 0 && <span className="text-xs text-gray-600 flex items-center">No balls yet</span>}
             {currentOverBalls.map((b) => (
                <div key={b.id} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${b.isWicket ? 'bg-red-500/20 text-red-500 border border-red-500/50' : b.runs === 4 || b.runs === 6 ? 'bg-neonGreen/20 text-neonGreen border border-neonGreen/50' : b.isExtra ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50' : 'bg-white/10 text-white border border-white/20'}`}>
                  {renderBall(b)}
                </div>
             ))}
          </div>

          {/* Target Info */}
          {store.currentInnings === 2 && (
             <div className="mt-3 p-2 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs sm:text-sm text-neonBlue font-bold tracking-wider mb-1">TARGET: {store.team1.runs + 1}</p>
                <p className="text-xs text-gray-300">
                  Need <span className="text-white font-bold">{store.team1.runs + 1 - store.team2.runs}</span> runs in <span className="text-white font-bold">{(store.totalOvers * 6) - store.team2.totalBalls}</span> balls
                </p>
             </div>
          )}

          {/* Over History Accordion */}
          {oversHistory.length > 0 && (
            <div className="mt-4 border-t border-white/10 pt-3">
              <button 
                onClick={() => setShowOverHistory(!showOverHistory)}
                className="w-full flex items-center justify-between text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
              >
                <span>Previous Overs History</span>
                {showOverHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {showOverHistory && (
                <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar text-left">
                  {oversHistory.map((overBalls, index) => {
                    const overRuns = overBalls.reduce((sum, b) => sum + b.runs + (b.isExtra ? 1 : 0), 0);
                    return (
                      <div key={index} className="flex items-center justify-between bg-black/30 p-2 rounded border border-white/5">
                        <span className="text-xs text-gray-400 w-12">Over {index + 1}</span>
                        <div className="flex-1 flex gap-1 overflow-x-auto mx-2 custom-scrollbar pb-1">
                          {overBalls.map(b => (
                            <div key={b.id} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${b.isWicket ? 'bg-red-500/20 text-red-500 border border-red-500/50' : b.runs === 4 || b.runs === 6 ? 'bg-neonGreen/20 text-neonGreen border border-neonGreen/50' : b.isExtra ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/50' : 'bg-white/10 text-white border border-white/20'}`}>
                              {renderBall(b)}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs font-bold text-neonBlue w-14 text-right">{overRuns} runs</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Batsmen Card */}
        <Card className="p-3 sm:p-4">
          <div className="flex justify-between text-xs sm:text-sm text-gray-400 mb-2 pb-2 border-b border-white/10">
            <span>Batsman {isAdmin ? "(Click to swap)" : ""}</span>
            <div className="flex gap-2 sm:gap-4">
              <span className="w-6 sm:w-8 text-right">R</span>
              <span className="w-6 sm:w-8 text-right">B</span>
              <span className="w-6 sm:w-8 text-right">4s</span>
              <span className="w-6 sm:w-8 text-right">6s</span>
            </div>
          </div>
          <div className="space-y-3">
            {renderBatsmanRow(striker, 'striker')}
            {renderBatsmanRow(nonStriker, 'nonStriker')}
          </div>

          <div className="mt-3 pt-3 border-t border-white/10 flex justify-between items-center text-sm">
            <div className="flex flex-col flex-1">
              <span className="text-gray-400">Bowler:</span>
              {isAdmin ? (
                <select 
                  value={store.currentBowler}
                  onChange={e => store.setBowler(e.target.value)}
                  className="bg-black/50 border border-white/20 rounded p-1 text-sm text-neonBlue focus:outline-none w-3/4 mt-1"
                >
                  <option value="">Select Bowler</option>
                  {bowlingTeam.players.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              ) : (
                <span className="font-semibold text-neonBlue">{store.currentBowler || 'Not Set'}</span>
              )}
            </div>
            {store.currentBowler && (
               <div className="flex gap-4 font-mono text-sm sm:text-base pr-2">
                 <div className="flex flex-col items-center"><span className="text-gray-400 text-[10px] sm:text-xs leading-none">O</span><span className="mt-1">{bowlerOvers}</span></div>
                 <div className="flex flex-col items-center"><span className="text-gray-400 text-[10px] sm:text-xs leading-none">R</span><span className="mt-1">{bowlerRuns}</span></div>
                 <div className="flex flex-col items-center"><span className="text-gray-400 text-[10px] sm:text-xs leading-none">W</span><span className="mt-1 font-bold text-white">{bowlerWickets}</span></div>
               </div>
            )}
          </div>
        </Card>

        {/* Admin Controls */}
        {isAdmin && store.status === 'IN_PROGRESS' && (
          <Card className="mt-2 p-3 sm:p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs sm:text-sm text-gray-400 tracking-widest uppercase">
                Umpire Controls
                {umpireDisabled && <span className="text-red-400 ml-2 normal-case text-xs">(Select Bowler & Striker)</span>}
              </h3>
              {store.pastStates.length > 0 && (
                <button 
                  onClick={() => store.undoLastAction()}
                  className="flex items-center gap-1 text-[10px] sm:text-xs text-yellow-400 hover:text-yellow-300 transition-colors bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20"
                >
                  <Undo2 className="w-3 h-3" /> Undo Last
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-3 place-items-center">
              <ScoreButton disabled={umpireDisabled} value={0} onClick={() => store.addRuns(0)} color="blue" />
              <ScoreButton disabled={umpireDisabled} value={1} onClick={() => store.addRuns(1)} />
              <ScoreButton disabled={umpireDisabled} value={2} onClick={() => store.addRuns(2)} />
              <ScoreButton disabled={umpireDisabled} value={3} onClick={() => store.addRuns(3)} />
              <ScoreButton disabled={umpireDisabled} value={4} onClick={() => store.addRuns(4)} color="blue" />
              <ScoreButton disabled={umpireDisabled} value={6} onClick={() => store.addRuns(6)} color="green" />
              <ScoreButton disabled={umpireDisabled} value="WD" onClick={() => store.addExtra('WD')} color="yellow" className="text-xs sm:text-sm" />
              <ScoreButton disabled={umpireDisabled} value="NB" onClick={() => store.addExtra('NB')} color="yellow" className="text-xs sm:text-sm" />
            </div>
            <div className="mt-3 flex justify-center">
              <ScoreButton disabled={umpireDisabled} value="W" onClick={() => store.addWicket()} color="red" />
            </div>
          </Card>
        )}

        {store.status === 'INNINGS_BREAK' && isAdmin && (
          <div className="mt-4 pt-4">
            <NeonButton className="w-full" onClick={() => store.switchInnings()}>
              Start 2nd Innings
            </NeonButton>
          </div>
        )}

        {store.status === 'COMPLETED' && (
          <Card className="text-center bg-neonGreen/10 border-neonGreen mt-4 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 text-neonGreen/20 pointer-events-none">
              <Trophy className="w-40 h-40" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-neonGreen mb-2 relative z-10">Match Completed</h2>
            <p className="text-lg sm:text-xl relative z-10 mb-4">
              {store.team1.runs > store.team2.runs ? `${store.team1.name} Won!` : 
               store.team1.runs < store.team2.runs ? `${store.team2.name} Won!` : 'Match Tied!'}
            </p>

            {/* Awards Section */}
            <div className="space-y-3 mb-6 relative z-10">
              {manOfTheMatch && (
                <div className="bg-black/50 p-3 rounded-lg border border-yellow-400/30 flex items-center gap-3">
                  <div className="p-2 bg-yellow-400/20 rounded-full text-yellow-400 shrink-0">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Man of the Match</div>
                    <div className="font-bold text-white text-lg">{manOfTheMatch.name}</div>
                    <div className="text-xs text-neonGreen">{manOfTheMatch.runs} runs ({manOfTheMatch.ballsFaced} balls)</div>
                  </div>
                </div>
              )}
              {bowlerOfTheMatch && (
                <div className="bg-black/50 p-3 rounded-lg border border-blue-400/30 flex items-center gap-3">
                  <div className="p-2 bg-blue-400/20 rounded-full text-blue-400 shrink-0">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Bowler of the Match</div>
                    <div className="font-bold text-white text-lg">{bowlerOfTheMatch.name}</div>
                    <div className="text-xs text-neonBlue">{bowlerOfTheMatch.wickets} Wickets ({bowlerOfTheMatch.runs} runs)</div>
                  </div>
                </div>
              )}
            </div>

            {isAdmin && (
              <div className="flex flex-col gap-3 relative z-10">
                <NeonButton className="w-full" onClick={() => {
                  store.startNewMatchInSession();
                  navigate('/add-players');
                }}>
                  Start Next Match in Session
                </NeonButton>
                <button className="w-full py-3 rounded-lg border-2 border-red-500 text-red-500 hover:bg-red-500/10 font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]" onClick={() => {
                  if (confirm("End session and clear all match records?")) {
                    store.endSession();
                    navigate('/');
                  }
                }}>
                  End Session
                </button>
              </div>
            )}
            {!isAdmin && (
              <NeonButton className="mt-6 w-full relative z-10" onClick={() => navigate('/')}>Back to Home</NeonButton>
            )}
          </Card>
        )}
      {/* Session Match History */}
      {store.sessionMatches && store.sessionMatches.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
             Session History <span className="text-sm font-normal text-gray-400">({store.sessionMatches.length} Matches)</span>
          </h3>
          <div className="space-y-4">
            {store.sessionMatches.map((m, i) => {
              const t1Won = m.team1.runs > m.team2.runs;
              const tied = m.team1.runs === m.team2.runs;
              return (
                <Card key={m.id} className="bg-darkSurface/50 border-gray-700/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-neonBlue font-semibold">Match {i + 1}</span>
                    <span className="text-xs px-2 py-1 bg-gray-800 rounded text-gray-300">
                      {m.totalOvers} Overs
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className={`font-bold ${t1Won ? 'text-neonGreen' : 'text-gray-300'}`}>
                        {m.team1.name} <span className="text-sm">({m.team1.runs}/{m.team1.wickets})</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.floor(m.team1.totalBalls / 6)}.{m.team1.totalBalls % 6} overs
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 px-2 font-bold">VS</div>
                    <div className="flex-1 text-right">
                      <div className={`font-bold ${!t1Won && !tied ? 'text-neonGreen' : 'text-gray-300'}`}>
                        <span className="text-sm">({m.team2.runs}/{m.team2.wickets})</span> {m.team2.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.floor(m.team2.totalBalls / 6)}.{m.team2.totalBalls % 6} overs
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-center text-xs text-gray-400 border-t border-gray-800 pt-2">
                    {tied ? 'Match Tied' : `${t1Won ? m.team1.name : m.team2.name} Won`}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
