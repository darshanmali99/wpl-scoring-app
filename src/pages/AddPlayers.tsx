import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { NeonButton } from '../components/NeonButton';
import { Card } from '../components/Card';
import { useMatchStore } from '../store/matchStore';
import { Plus, Play, Trash2 } from 'lucide-react';

export const AddPlayers = () => {
  const navigate = useNavigate();
  const { team1, team2, addPlayer, updatePlayer, removePlayer, startMatch, matchCode } = useMatchStore();
  const [activeTab, setActiveTab] = useState<1 | 2>(1);
  const [playerName, setPlayerName] = useState('');

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      addPlayer(activeTab, playerName.trim());
      setPlayerName('');
    }
  };

  const handleStartMatch = () => {
    startMatch();
    navigate(`/live/${matchCode}`);
  };

  const currentTeam = activeTab === 1 ? team1 : team2;
  const canStart = team1.players.length >= 1 && team2.players.length >= 1;

  return (
    <div className="min-h-screen p-6 flex flex-col max-w-md mx-auto">
      <Header />
      
      <div className="flex-1 flex flex-col">
        <div className="flex space-x-2 mb-6">
          <button 
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${activeTab === 1 ? 'bg-neonGreen text-black' : 'bg-darkSurface text-gray-400'}`}
            onClick={() => setActiveTab(1)}
          >
            {team1.name || 'Team 1'}
          </button>
          <button 
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${activeTab === 2 ? 'bg-neonBlue text-black' : 'bg-darkSurface text-gray-400'}`}
            onClick={() => setActiveTab(2)}
          >
            {team2.name || 'Team 2'}
          </button>
        </div>

        <Card className="flex-1 flex flex-col mb-6">
          <form onSubmit={handleAddPlayer} className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Enter player name" 
              className="flex-1 bg-darkBackground border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-neonGreen transition-colors text-white"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <NeonButton type="submit" className="!px-4 !py-2" disabled={!playerName.trim()}>
              <Plus className="w-5 h-5" />
            </NeonButton>
          </form>

          <div className="flex-1 overflow-y-auto space-y-2">
            {currentTeam.players.length === 0 ? (
              <p className="text-center text-gray-500 mt-4">No players added yet.</p>
            ) : (
              currentTeam.players.map((p, i) => (
                <div key={p.id} className="bg-darkBackground p-2 rounded-lg flex items-center gap-3 border border-white/5 focus-within:border-white/20 transition-colors">
                  <span className="text-gray-500 text-sm w-4 text-right">{i + 1}.</span>
                  <input
                    type="text"
                    value={p.name}
                    onChange={(e) => updatePlayer(activeTab, p.id, e.target.value)}
                    className="flex-1 bg-transparent text-white font-semibold focus:outline-none focus:text-neonBlue"
                  />
                  <button onClick={() => removePlayer(activeTab, p.id)} className="text-red-500 hover:text-red-400 p-2">
                     <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        <NeonButton 
          className="w-full flex items-center justify-center gap-2" 
          disabled={!canStart}
          onClick={handleStartMatch}
        >
          <Play className="w-5 h-5" /> Start Match
        </NeonButton>
        {!canStart && (
          <p className="text-center text-sm text-gray-500 mt-2">Add at least 1 player per team to start.</p>
        )}
      </div>
    </div>
  );
};
