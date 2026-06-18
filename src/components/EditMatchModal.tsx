import React, { useState } from 'react';
import { useMatchStore } from '../store/matchStore';
import { Trash2, Plus, Settings } from 'lucide-react';
import { NeonButton } from './NeonButton';

export const EditMatchModal = ({ onClose }: { onClose: () => void }) => {
  const store = useMatchStore();
  const [overs, setOvers] = useState(store.totalOvers.toString());
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedTeamForAdd, setSelectedTeamForAdd] = useState<1 | 2>(1);

  const handleUpdateOvers = () => {
    const o = parseInt(overs);
    if (o > 0) {
      store.updateTotalOvers(o);
      alert('Total overs updated!');
    }
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
      store.addPlayerMidMatch(selectedTeamForAdd, newPlayerName.trim());
      setNewPlayerName('');
      alert('Player added successfully!');
    }
  };

  const handleRemovePlayer = (teamNum: 1 | 2, playerId: string) => {
    if (confirm('Are you sure you want to remove this player?')) {
      store.removePlayerMidMatch(teamNum, playerId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-darkSurface border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 text-neonBlue" /> Edit Match
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white px-2 py-1 rounded">
            Close
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-6">
          
          {/* Update Overs */}
          <div className="bg-black/30 p-4 rounded-xl border border-white/5">
            <h3 className="text-sm text-neonBlue font-semibold mb-3 uppercase tracking-wider">Update Total Overs</h3>
            <div className="flex gap-2">
              <input 
                type="number" 
                min="1"
                className="bg-darkBackground border border-gray-700 rounded-lg px-3 py-2 w-full text-white focus:outline-none focus:border-neonBlue"
                value={overs}
                onChange={(e) => setOvers(e.target.value)}
              />
              <NeonButton onClick={handleUpdateOvers} className="!px-4 !py-2 shrink-0">Update</NeonButton>
            </div>
          </div>

          {/* Add Player */}
          <div className="bg-black/30 p-4 rounded-xl border border-white/5">
            <h3 className="text-sm text-neonGreen font-semibold mb-3 uppercase tracking-wider">Add Player</h3>
            <form onSubmit={handleAddPlayer} className="space-y-3">
              <div className="flex gap-2">
                <button 
                  type="button"
                  className={`flex-1 py-2 rounded font-semibold text-sm transition-colors ${selectedTeamForAdd === 1 ? 'bg-white/20 text-white' : 'bg-black/40 text-gray-400'}`}
                  onClick={() => setSelectedTeamForAdd(1)}
                >
                  {store.team1.name}
                </button>
                <button 
                  type="button"
                  className={`flex-1 py-2 rounded font-semibold text-sm transition-colors ${selectedTeamForAdd === 2 ? 'bg-white/20 text-white' : 'bg-black/40 text-gray-400'}`}
                  onClick={() => setSelectedTeamForAdd(2)}
                >
                  {store.team2.name}
                </button>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Player Name"
                  className="bg-darkBackground border border-gray-700 rounded-lg px-3 py-2 w-full text-white focus:outline-none focus:border-neonGreen"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                />
                <NeonButton type="submit" className="!px-3 !py-2 shrink-0"><Plus className="w-5 h-5" /></NeonButton>
              </div>
            </form>
          </div>

          {/* Remove Player */}
          <div className="bg-black/30 p-4 rounded-xl border border-white/5">
            <h3 className="text-sm text-red-400 font-semibold mb-3 uppercase tracking-wider">Remove Player</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xs text-gray-400 mb-2">{store.team1.name}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {store.team1.players.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-black/50 p-2 rounded text-sm">
                      <span className="truncate">{p.name}</span>
                      <button onClick={() => handleRemovePlayer(1, p.id)} className="text-red-500 hover:text-red-400 ml-2 shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs text-gray-400 mb-2">{store.team2.name}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {store.team2.players.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-black/50 p-2 rounded text-sm">
                      <span className="truncate">{p.name}</span>
                      <button onClick={() => handleRemovePlayer(2, p.id)} className="text-red-500 hover:text-red-400 ml-2 shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
          </div>

        </div>
      </div>
    </div>
  );
};
