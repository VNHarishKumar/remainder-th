import './App.css';
import Nav from './Nav/Nav.js';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Postremainder from './Postremainder/Postremainder.js';
import Getremainder from './Getremainder/Getremainder.js';


function App() {
  return (
    // <div className="App">
    <Router>
      <Nav />
      <Routes>
        <Route path="/postremainder" element={<Postremainder />} />
        <Route path="/Getremainder" element={<Getremainder />} />
      </Routes>
    </Router>
 
    // </div>
  );
}

export default App;
