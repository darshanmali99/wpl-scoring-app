import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { NeonButton } from '../components/NeonButton';
import { Card } from '../components/Card';
import { useMatchStore } from '../store/matchStore';
import { ArrowRight } from 'lucide-react';

export const CreateMatch = () => {
  const navigate = useNavigate();
  const setMatchDetails = useMatchStore(state => state.setMatchDetails);
  
  const [team1, setTeam1] = useState('');
  const [team2, setTeam2] = useState('');
  const [overs, setOvers] = useState('5');
  const [whiteBallRuns, setWhiteBallRuns] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (team1 && team2 && overs) {
      setMatchDetails(team1, team2, parseInt(overs), whiteBallRuns);
      const newMatchCode = useMatchStore.getState().matchCode;
      localStorage.setItem(`wpl_admin_${newMatchCode}`, 'true');
      navigate('/add-players');
    }
  };

  return (
    <div className="min-h-screen p-6 flex flex-col max-w-md mx-auto">
      <Header />
      
      <div className="flex-1">
        <h2 className="text-2xl font-bold mb-6 text-center neon-text-green">Match Setup</h2>
        
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Team 1 Name (Batting First)</label>
              <input 
                required
                type="text" 
                placeholder="e.g. Mumbai Indians" 
                className="w-full bg-darkBackground border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-neonGreen transition-colors"
                value={team1}
                onChange={(e) => setTeam1(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Team 2 Name (Bowling First)</label>
              <input 
                required
                type="text" 
                placeholder="e.g. Chennai Super Kings" 
                className="w-full bg-darkBackground border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-neonGreen transition-colors"
                value={team2}
                onChange={(e) => setTeam2(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Total Overs</label>
              <input 
                required
                type="number" 
                min="1"
                placeholder="e.g. 5" 
                className="w-full bg-darkBackground border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-neonGreen transition-colors text-center text-xl"
                value={overs}
                onChange={(e) => setOvers(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-700 rounded-lg">
              <div className="flex flex-col">
                <span className="text-white font-medium">White Ball Runs</span>
                <span className="text-xs text-gray-400">Add 1 run for wides</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={whiteBallRuns}
                  onChange={(e) => setWhiteBallRuns(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neonGreen"></div>
              </label>
            </div>

            <NeonButton type="submit" className="w-full flex items-center justify-center gap-2 mt-4">
              Next Step <ArrowRight className="w-5 h-5" />
            </NeonButton>
          </form>
        </Card>
      </div>
    </div>
  );
};
