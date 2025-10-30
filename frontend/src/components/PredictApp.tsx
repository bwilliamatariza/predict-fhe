import { PredictionList } from './PredictionList';
import { CreatePrediction } from './CreatePrediction';
import { About } from './About';

interface PredictAppProps {
  currentView: 'browse' | 'create' | 'about';
  onViewChange: (view: 'browse' | 'create' | 'about') => void;
}

export function PredictApp({ currentView, onViewChange }: PredictAppProps) {
  return (
    <div className="animate-fadeIn">
      {currentView === 'browse' && <PredictionList />}
      {currentView === 'create' && <CreatePrediction onCreated={() => onViewChange('browse')} />}
      {currentView === 'about' && <About />}
    </div>
  );
}

