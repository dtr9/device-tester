import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import KeyboardTester from './pages/KeyboardTester'
import MouseTester from './pages/MouseTester'
import MicrophoneTester from './pages/MicrophoneTester'
import CameraTester from './pages/CameraTester'
import './App.css'

function App() {
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  return (
    <div className="app">
      {!isHomePage && <Navbar />}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/keyboard" element={<KeyboardTester />} />
          <Route path="/mouse" element={<MouseTester />} />
          <Route path="/microphone" element={<MicrophoneTester />} />
          <Route path="/camera" element={<CameraTester />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
