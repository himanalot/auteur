import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import MainInterface from './components/MainInterface';
import './App.css';

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <MainInterface />
      </div>
    </Provider>
  );
}

export default App;