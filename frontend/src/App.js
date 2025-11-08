import { useEffect, useState } from 'react';
import './App.css';
// router 
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Foot from './components/Foot';
import Home from './components/Home';
import Sign_in from './components/Sign_in';
import Sign_up from './components/Sign_up';
import Upload from './components/Upload';
import Search from './components/Search';
import { extractUsernameFromToken } from './utils/auth';

function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem("SnapSwapAuthtoken"));
  const [currentUsername, setCurrentUsername] = useState(() => extractUsernameFromToken(localStorage.getItem("SnapSwapAuthtoken")));

  useEffect(() => {
    setCurrentUsername(extractUsernameFromToken(authToken));
  }, [authToken]);

  return (
    <BrowserRouter>
      <div className="app-shell">
        <div className="app-content">
          <Routes>
            <Route index path="/" element={<Home authToken={authToken} setAuthToken={setAuthToken} currentUsername={currentUsername} />} />
            <Route path="/upload" element={<Upload authToken={authToken} setAuthToken={setAuthToken} />} />
            <Route path="/search" element={<Search authToken={authToken} setAuthToken={setAuthToken} currentUsername={currentUsername} />} />
            <Route path="/sign_up" element={<Sign_up authToken={authToken} setAuthToken={setAuthToken} />} />
            <Route path="/sign_in" element={<Sign_in authToken={authToken} setAuthToken={setAuthToken} />} />
          </Routes>
        </div>
        <Foot />
      </div>
    </BrowserRouter>
  );
}

export default App;
