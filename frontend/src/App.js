import React from 'react';
import Map from './components/Map';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Guerre des Départements S2</h1>
        <p className="subtitle">Bataille de territoires interactive</p>
      </header>
      
      <main>
        <div className="instructions">
          <h2>Comment jouer</h2>
          <ul>
            <li>Utilisez la molette pour zoomer sur la carte</li>
            <li>Cliquez et faites glisser pour naviguer</li>
            <li>Choisissez votre département pour commencer à jouer</li>
          </ul>
        </div>
        
        <Map />
      </main>
    </div>
  );
}

export default App;