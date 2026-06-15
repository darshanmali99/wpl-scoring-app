import { Trophy } from 'lucide-react';

export const Header = () => {
  return (
    <header className="flex flex-col items-center py-6 mb-6">
      <div className="flex items-center gap-3">
        <Trophy className="w-10 h-10 text-neonGreen neon-text-green" />
        <h1 className="text-4xl font-extrabold tracking-wider">
          <span className="text-white">W</span>
          <span className="text-neonBlue">P</span>
          <span className="text-neonGreen">L</span>
        </h1>
      </div>
      <p className="text-sm text-gray-400 mt-2 tracking-widest uppercase">Wasan Premier League</p>
    </header>
  );
};
