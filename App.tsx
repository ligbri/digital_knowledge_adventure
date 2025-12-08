import React from 'react';
import RunnerGame from './components/RunnerGame';

const App: React.FC = () => {
  return (
    <div className="w-screen h-screen bg-gray-900 flex flex-col items-center justify-center overflow-hidden">
      <RunnerGame />
    </div>
  );
};

export default App;