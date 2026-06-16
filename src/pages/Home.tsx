import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { NeonButton } from '../components/NeonButton';
import { Card } from '../components/Card';
import { Play, Users, Eye } from 'lucide-react';
import { useMatchStore } from '../store/matchStore';

export const Home = () => {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const matchCode = useMatchStore(state => state.matchCode);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/live/${joinCode}`);
    }
  };

  return (
    <div className="min-h-screen p-6 flex flex-col max-w-md mx-auto">
      <Header />
      
      <div className="flex-1 flex flex-col justify-center space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Score every ball like a pro.</h2>
          <p className="text-gray-400">Live gully cricket scoring made simple.</p>
        </div>

        <Card className="flex flex-col space-y-4">
          <div className="text-center mb-2">
            <h3 className="text-lg font-semibold text-neonBlue neon-text-blue">Umpire / Admin</h3>
          </div>
          <NeonButton 
            className="w-full flex items-center justify-center gap-2"
            onClick={() => navigate('/create')}
          >
            <Play className="w-5 h-5" /> Create New Match
          </NeonButton>
          {matchCode && (
             <NeonButton 
             variant="outline"
             className="w-full flex items-center justify-center gap-2"
             onClick={() => navigate(`/live/${matchCode}?admin=true`)}
           >
             <Users className="w-5 h-5" /> Resume Session
           </NeonButton>
          )}
        </Card>

        <Card className="flex flex-col space-y-4">
          <div className="text-center mb-2">
            <h3 className="text-lg font-semibold text-neonGreen neon-text-green">Viewer</h3>
          </div>
          <form onSubmit={handleJoin} className="flex flex-col space-y-4">
            <input 
              type="text" 
              placeholder="Enter Match Code" 
              className="bg-darkBackground border border-gray-700 rounded-lg px-4 py-3 text-center text-xl tracking-widest focus:outline-none focus:border-neonGreen transition-colors"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <NeonButton 
              type="submit"
              color="blue"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              disabled={!joinCode}
            >
              <Eye className="w-5 h-5" /> View Live Score
            </NeonButton>
          </form>
        </Card>
      </div>
    </div>
  );
};
