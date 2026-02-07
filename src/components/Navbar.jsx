import { NavLink } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <NavLink to="/">Device Test</NavLink>
      </div>
      <ul className="navbar-links">
        <li>
          <NavLink to="/keyboard" className={({ isActive }) => isActive ? 'active' : ''}>
            Keyboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/mouse" className={({ isActive }) => isActive ? 'active' : ''}>
            Mouse
          </NavLink>
        </li>
        <li>
          <NavLink to="/microphone" className={({ isActive }) => isActive ? 'active' : ''}>
            Microphone
          </NavLink>
        </li>
        <li>
          <NavLink to="/camera" className={({ isActive }) => isActive ? 'active' : ''}>
            Camera
          </NavLink>
        </li>
      </ul>
    </nav>
  )
}

export default Navbar
