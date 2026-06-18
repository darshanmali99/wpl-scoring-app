import React, { useState } from 'react';
import { useMatchStore, Team, BallEvent, Player } from '../store/matchStore';

export const Scoreboard = ({ onClose }: { onClose: () => void }) => {
  const store = useMatchStore();
  
  // Show whichever innings is currently happening, or default to 1
  const [activeTab, setActiveTab] = useState<1 | 2>(store.currentInnings);

  const isTab1 = activeTab === 1;
  const battingTeam = isTab1 ? store.team1 : store.team2;
  const bowlingTeam = isTab1 ? store.team2 : store.team1;
  const ballHistory = isTab1 ? store.innings1BallHistory.length > 0 ? store.innings1BallHistory : store.ballHistory : (store.currentInnings === 2 ? store.ballHistory : []);
  
  // If the game is in setup or inning hasn't started, handle empty gracefully
  const hasStarted = battingTeam.totalBalls > 0 || battingTeam.runs > 0;

  // Calculate bowler stats
  const bowlerStats: Record<string, { overs: number, balls: number, maidens: number, runs: number, wickets: number, name: string }> = {};
  
  let currentOverRuns = 0;
  let currentOverBowler = '';
  let currentOverLegalBalls = 0;

  ballHistory.forEach(b => {
    if (!b.bowlerName) return;
    if (!bowlerStats[b.bowlerName]) {
      bowlerStats[b.bowlerName] = { overs: 0, balls: 0, maidens: 0, runs: 0, wickets: 0, name: b.bowlerName };
    }
    
    // Tracking maidens logic
    if (b.bowlerName !== currentOverBowler || currentOverLegalBalls === 6) {
      // End of an over, check if maiden
      if (currentOverLegalBalls === 6 && currentOverRuns === 0 && currentOverBowler) {
         if (bowlerStats[currentOverBowler]) bowlerStats[currentOverBowler].maidens += 1;
      }
      currentOverBowler = b.bowlerName;
      currentOverRuns = 0;
      currentOverLegalBalls = 0;
    }

    currentOverRuns += b.runs + (b.isExtra ? 1 : 0);
    bowlerStats[b.bowlerName].runs += b.runs + (b.isExtra ? 1 : 0);
    if (b.isWicket) bowlerStats[b.bowlerName].wickets += 1;
    if (!b.isExtra) {
      bowlerStats[b.bowlerName].balls += 1;
      currentOverLegalBalls += 1;
    }
  });

  // Check last over for maiden
  if (currentOverLegalBalls === 6 && currentOverRuns === 0 && currentOverBowler) {
    if (bowlerStats[currentOverBowler]) bowlerStats[currentOverBowler].maidens += 1;
  }

  const bowlersList = Object.values(bowlerStats);

  // Extras calculation for this inning
  const extras = ballHistory.reduce((sum, b) => sum + (b.isExtra ? 1 : 0), 0);

  const formatOvers = (totalBalls: number) => `${Math.floor(totalBalls / 6)}.${totalBalls % 6}`;

  const renderBatsmanRow = (p: Player) => {
    const isStriker = store.currentInnings === activeTab && p.id === store.strikerId;
    const isNonStriker = store.currentInnings === activeTab && p.id === store.nonStrikerId;
    const isActive = isStriker || isNonStriker;
    
    // Find who took the wicket if out
    let dismissal = p.isOut ? 'Out' : isActive ? 'not out' : 'did not bat';
    if (p.isOut) {
      const outBall = ballHistory.find(b => b.isWicket && b.batsmanId === p.id);
      if (outBall && outBall.bowlerName) {
        dismissal = `b ${outBall.bowlerName}`;
      }
    }

    if (!p.isOut && !isActive && p.ballsFaced === 0) {
       return null; // Did not bat
    }

    const sr = p.ballsFaced > 0 ? ((p.runs / p.ballsFaced) * 100).toFixed(2) : '0.00';

    return (
      <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm md:text-base">
        <td className="py-2 px-3">
          <span className={`font-semibold ${isActive ? 'text-white' : 'text-gray-400'}`}>{p.name}</span>
          {isStriker && <span className="text-neonGreen ml-1">*</span>}
          <div className="text-xs text-gray-500 italic mt-0.5">{dismissal}</div>
        </td>
        <td className="py-2 px-3 text-right font-bold text-white">{p.runs}</td>
        <td className="py-2 px-3 text-right text-gray-400">{p.ballsFaced}</td>
        <td className="py-2 px-3 text-right text-gray-400">{p.fours}</td>
        <td className="py-2 px-3 text-right text-gray-400">{p.sixes}</td>
        <td className="py-2 px-3 text-right text-gray-400">{sr}</td>
      </tr>
    );
  };

  const renderBowlerRow = (b: typeof bowlersList[0]) => {
    const oversStr = formatOvers(b.balls);
    const econ = b.balls > 0 ? ((b.runs / b.balls) * 6).toFixed(2) : '0.00';
    return (
      <tr key={b.name} className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm md:text-base">
        <td className="py-2 px-3 text-neonBlue font-semibold">{b.name}</td>
        <td className="py-2 px-3 text-right text-gray-400">{oversStr}</td>
        <td className="py-2 px-3 text-right text-gray-400">{b.maidens}</td>
        <td className="py-2 px-3 text-right text-gray-400">{b.runs}</td>
        <td className="py-2 px-3 text-right font-bold text-white">{b.wickets}</td>
        <td className="py-2 px-3 text-right text-gray-400">{econ}</td>
      </tr>
    );
  };

  return (
    <div className="fixed inset-0 z-40 bg-darkBackground/95 backdrop-blur-md flex flex-col items-center overflow-y-auto p-2 md:p-8">
      
      {/* Header */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-6 border-b border-white/10 pb-4 sticky top-0 bg-darkBackground/95 z-10 pt-4">
        <h1 className="text-xl md:text-3xl font-bold tracking-wider uppercase text-white">
          <span className="text-neonBlue">Match</span> Scorecard
        </h1>
        <button onClick={onClose} className="px-3 py-1.5 md:px-4 md:py-2 bg-white/10 hover:bg-white/20 text-white rounded transition-colors text-xs md:text-sm font-bold tracking-wider">
          CLOSE
        </button>
      </div>

      <div className="w-full max-w-4xl space-y-6 pb-20">
        
        {/* Tabs */}
        <div className="flex bg-black/50 rounded-lg p-1 border border-white/10">
          <button 
            className={`flex-1 py-2 md:py-3 text-sm md:text-base font-bold rounded transition-colors ${activeTab === 1 ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => setActiveTab(1)}
          >
            1st Innings: {store.team1.name}
          </button>
          <button 
            className={`flex-1 py-2 md:py-3 text-sm md:text-base font-bold rounded transition-colors ${activeTab === 2 ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => setActiveTab(2)}
            disabled={store.currentInnings === 1 && store.status !== 'INNINGS_BREAK' && store.status !== 'COMPLETED'}
          >
            2nd Innings: {store.team2.name}
          </button>
        </div>

        {hasStarted ? (
          <div className="bg-darkSurface border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Innings Header */}
            <div className="bg-black/40 p-4 md:p-6 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-white">{battingTeam.name} Innings</h2>
                <p className="text-sm text-gray-400">{formatOvers(battingTeam.totalBalls)} / {store.totalOvers} Overs</p>
              </div>
              <div className="text-right">
                <div className="text-3xl md:text-4xl font-extrabold text-white">
                  {battingTeam.runs}<span className="text-gray-500 text-2xl md:text-3xl">/{battingTeam.wickets}</span>
                </div>
                <div className="text-xs md:text-sm text-gray-400 mt-1">CRR: {battingTeam.totalBalls > 0 ? ((battingTeam.runs / battingTeam.totalBalls) * 6).toFixed(2) : '0.00'}</div>
              </div>
            </div>

            {/* Batting Scorecard */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-white/5 text-gray-400 text-xs md:text-sm uppercase tracking-wider">
                    <th className="py-2 px-3 font-medium">Batter</th>
                    <th className="py-2 px-3 font-medium text-right w-12">R</th>
                    <th className="py-2 px-3 font-medium text-right w-12">B</th>
                    <th className="py-2 px-3 font-medium text-right w-12">4s</th>
                    <th className="py-2 px-3 font-medium text-right w-12">6s</th>
                    <th className="py-2 px-3 font-medium text-right w-16">SR</th>
                  </tr>
                </thead>
                <tbody>
                  {battingTeam.players.map(renderBatsmanRow)}
                  {/* Extras & Total Row */}
                  <tr className="border-b border-white/10 bg-black/20">
                    <td className="py-3 px-3 font-semibold text-gray-300">Extras</td>
                    <td colSpan={5} className="py-3 px-3 text-right font-bold text-white">{extras}</td>
                  </tr>
                  <tr className="bg-black/40 border-b border-white/20">
                    <td className="py-3 px-3 font-bold text-white">Total</td>
                    <td colSpan={5} className="py-3 px-3 text-right font-bold text-white">{battingTeam.runs} <span className="text-gray-500 text-sm font-normal">({battingTeam.wickets} wkts, {formatOvers(battingTeam.totalBalls)} Ov)</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* DNB (Did not bat) */}
            <div className="p-3 bg-black/20 border-b border-white/10 text-xs md:text-sm text-gray-400">
              <span className="font-semibold text-gray-300">Did not bat: </span>
              {battingTeam.players.filter(p => !p.isOut && p.id !== store.strikerId && p.id !== store.nonStrikerId && p.ballsFaced === 0).map(p => p.name).join(', ') || 'None'}
            </div>

            {/* Bowling Scorecard */}
            {bowlersList.length > 0 && (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="bg-white/5 text-gray-400 text-xs md:text-sm uppercase tracking-wider">
                      <th className="py-2 px-3 font-medium">Bowler</th>
                      <th className="py-2 px-3 font-medium text-right w-12">O</th>
                      <th className="py-2 px-3 font-medium text-right w-12">M</th>
                      <th className="py-2 px-3 font-medium text-right w-12">R</th>
                      <th className="py-2 px-3 font-medium text-right w-12">W</th>
                      <th className="py-2 px-3 font-medium text-right w-16">ECON</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bowlersList.map(renderBowlerRow)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-10 text-gray-500 italic bg-darkSurface rounded-2xl border border-white/10">
            Innings has not started yet.
          </div>
        )}
      </div>
    </div>
  );
};
