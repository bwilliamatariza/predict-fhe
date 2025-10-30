import { useState } from 'react';
import { Header } from './components/Header';
import { PredictApp } from './components/PredictApp';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState<'browse' | 'create' | 'about'>('browse');

  return (
    <div className="app-container">
      <Header currentView={currentView} onNavigate={setCurrentView} />
      <main className="main-content">
        <PredictApp currentView={currentView} onViewChange={setCurrentView} />
      </main>
    </div>
  );
}

export default App
