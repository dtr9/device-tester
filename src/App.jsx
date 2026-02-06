import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import KeyboardTester from './pages/KeyboardTester'
import MouseTester from './pages/MouseTester'
import MicrophoneTester from './pages/MicrophoneTester'
import CameraTester from './pages/CameraTester'
import './App.css'

function App() {
  return (
    <div className="app">
      <Navbar />
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
