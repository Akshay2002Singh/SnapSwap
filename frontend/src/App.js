import NavBar from './components/NavBar';
import './App.css';
import Foot from './components/Foot';
import Home from './components/Home';
import Sign_in from './components/Sign_in';
import Sign_up from './components/Sign_up';
import Upload from './components/Upload';

function App() {
  return (
    <>
      <NavBar />
        {/* <Home /> */}
        {/* <Sign_in /> */}
        {/* <Sign_up /> */}
        <Upload />
      <Foot />
    </>
  );
}

export default App;
