import React from 'react';
import { useMatchStore } from '../store/matchStore';

export const Scoreboard = ({ onClose }: { onClose: () => void }) => {
  const store = useMatchStore();

  const isTeam1Batting = store.currentInnings === 1;
  const battingTeam = isTeam1Batting ? store.team1 : store.team2;
  const bowlingTeam = isTeam1Batting ? store.team2 : store.team1;

  const striker = battingTeam.players.find(p => p.id === store.strikerId);
  const nonStriker = battingTeam.players.find(p => p.id === store.nonStrikerId);
  
  const currentBowlerHistory = store.ballHistory.filter(b => b.bowlerName === store.currentBowler && store.currentBowler !== '');
  const bowlerRuns = currentBowlerHistory.reduce((sum, b) => sum + b.runs + (b.isExtra ? 1 : 0), 0);
  const bowlerWickets = currentBowlerHistory.filter(b => b.isWicket).length;
  const bowlerLegalBalls = currentBowlerHistory.filter(b => !b.isExtra).length;
  const bowlerOvers = `${Math.floor(bowlerLegalBalls / 6)}.${bowlerLegalBalls % 6}`;

  const currentOverBalls = store.ballHistory.filter(b => b.overNum === Math.floor(battingTeam.totalBalls / 6));

  const formatOvers = (totalBalls: number) => `${Math.floor(totalBalls / 6)}.${totalBalls % 6}`;

  return (
    <div className="fixed inset-0 z-40 bg-darkBackground/95 backdrop-blur-md flex flex-col items-center overflow-y-auto p-4 md:p-8">
      
      {/* Header */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <h1 className="text-2xl md:text-4xl font-bold tracking-wider uppercase text-white">
          <span className="text-neonBlue">WPL</span> Live Match
        </h1>
        <button onClick={onClose} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors text-sm font-bold tracking-wider">
          CLOSE SCOREBOARD
        </button>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Main Score Area */}
        <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-neonGreen via-neonBlue to-purple-500"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left flex-1">
              <h2 className="text-xl md:text-2xl text-gray-400 font-bold uppercase tracking-widest mb-2">{battingTeam.name}</h2>
              <div className="flex items-baseline justify-center md:justify-start gap-2">
                <span className="text-7xl md:text-9xl font-extrabold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{battingTeam.runs}</span>
                <span className="text-4xl md:text-6xl font-bold text-gray-500">/</span>
                <span className="text-5xl md:text-7xl font-bold text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">{battingTeam.wickets}</span>
              </div>
              <div className="text-xl md:text-2xl text-neonBlue font-mono mt-2">
                Overs: <span className="text-white">{formatOvers(battingTeam.totalBalls)}</span> <span className="text-gray-500 text-lg">({store.totalOvers})</span>
              </div>
            </div>

            {/* Target Area if Innings 2 */}
            {store.currentInnings === 2 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center md:text-right min-w-[200px]">
                <div className="text-sm text-gray-400 uppercase tracking-widest mb-1">Target</div>
                <div className="text-3xl font-bold text-neonGreen">{store.team1.runs + 1}</div>
                <div className="text-sm text-gray-300 mt-2">
                  Need <span className="font-bold text-white">{store.team1.runs + 1 - store.team2.runs}</span> in <span className="font-bold text-white">{(store.totalOvers * 6) - store.team2.totalBalls}</span> balls
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Batsmen Area */}
        <div className="bg-gray-900/80 border border-white/5 rounded-xl p-6">
          <h3 className="text-sm text-gray-500 uppercase tracking-widest border-b border-white/10 pb-2 mb-4">Batsmen</h3>
          <div className="space-y-4">
            {[striker, nonStriker].map((p, idx) => {
              if (!p) return null;
              const isStriker = idx === 0;
              return (
                <div key={p.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg md:text-xl font-bold ${isStriker ? 'text-white' : 'text-gray-400'}`}>{p.name}</span>
                    {isStriker && <span className="text-neonGreen text-xl">*</span>}
                  </div>
                  <div className="flex gap-4 md:gap-6 font-mono text-base md:text-lg">
                    <span className="w-8 text-right font-bold text-white">{p.runs}</span>
                    <span className="w-8 text-right text-gray-500">{p.ballsFaced}</span>
                    <span className="w-6 text-right text-gray-500 text-sm md:text-base">{p.fours}</span>
                    <span className="w-6 text-right text-gray-500 text-sm md:text-base">{p.sixes}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bowler Area */}
        <div className="bg-gray-900/80 border border-white/5 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm text-gray-500 uppercase tracking-widest border-b border-white/10 pb-2 mb-4">Current Bowler</h3>
            {store.currentBowler ? (
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-neonBlue">{store.currentBowler}</span>
                <div className="flex gap-4 md:gap-6 font-mono text-lg">
                  <div className="flex flex-col items-center"><span className="text-xs text-gray-500">O</span><span>{bowlerOvers}</span></div>
                  <div className="flex flex-col items-center"><span className="text-xs text-gray-500">R</span><span>{bowlerRuns}</span></div>
                  <div className="flex flex-col items-center"><span className="text-xs text-gray-500">W</span><span className="text-white font-bold">{bowlerWickets}</span></div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 italic">Waiting for bowler...</div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <h4 className="text-xs text-gray-500 uppercase tracking-widest mb-2">This Over</h4>
            <div className="flex gap-2 items-center flex-wrap">
              {currentOverBalls.length === 0 && <span className="text-sm text-gray-600">...</span>}
              {currentOverBalls.map((b) => (
                <div key={b.id} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm border
                  ${b.isWicket ? 'bg-red-500 text-white border-red-400' 
                  : b.runs === 4 || b.runs === 6 ? 'bg-neonGreen text-black border-green-400' 
                  : b.isExtra ? 'bg-yellow-400 text-black border-yellow-300' 
                  : 'bg-gray-800 text-white border-gray-600'}`}>
                  {b.isWicket ? 'W' : b.isExtra ? b.extraType : b.runs}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
