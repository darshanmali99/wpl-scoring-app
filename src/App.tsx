
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { CreateMatch } from './pages/CreateMatch';
import { AddPlayers } from './pages/AddPlayers';
import { LiveScore } from './pages/LiveScore';

function App() {
  return (
    <Router>
      <div className="relative pb-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateMatch />} />
          <Route path="/add-players" element={<AddPlayers />} />
          <Route path="/live/:code" element={<LiveScore />} />
        </Routes>
        <div className="fixed bottom-0 w-full left-0 right-0 p-2 text-center text-xs text-gray-500 z-50 pointer-events-none bg-darkBackground/50 backdrop-blur-sm border-t border-white/5">
          Created by <span className="text-neonBlue font-semibold">Darshan Mali</span>
        </div>
      </div>
    </Router>
  );
}

export default App;
