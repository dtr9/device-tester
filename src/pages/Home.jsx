import { Link } from 'react-router-dom'

function Home() {
  const testers = [
    {
      name: 'Keyboard Tester',
      description: 'Test your keyboard keys, view key codes, and check for stuck keys.',
      path: '/keyboard',
      available: true,
      icon: '⌨️',
    },
    {
      name: 'Mouse Tester',
      description: 'Test mouse buttons, scroll wheel, and track cursor position.',
      path: '/mouse',
      available: false,
      icon: '🖱️',
    },
    {
      name: 'Microphone Tester',
      description: 'Test your microphone input and monitor audio levels.',
      path: '/microphone',
      available: false,
      icon: '🎤',
    },
    {
      name: 'Camera Tester',
      description: 'Preview your webcam and test video input.',
      path: '/camera',
      available: false,
      icon: '📷',
    },
  ]

  return (
    <div className="home">
      <header className="home-header">
        <h1>Device Tester</h1>
        <p>Test and diagnose your hardware devices right in your browser.</p>
      </header>

      <div className="tester-grid">
        {testers.map((tester) => (
          <div key={tester.name} className={`tester-card ${!tester.available ? 'disabled' : ''}`}>
            <div className="tester-icon">{tester.icon}</div>
            <h2>{tester.name}</h2>
            <p>{tester.description}</p>
            {tester.available ? (
              <Link to={tester.path} className="tester-link">
                Open Tester
              </Link>
            ) : (
              <span className="coming-soon-badge">Coming Soon</span>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .home {
          text-align: center;
        }

        .home-header {
          margin-bottom: 3rem;
        }

        .home-header h1 {
          font-size: 2.5rem;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .home-header p {
          font-size: 1.125rem;
          color: #64748b;
        }

        .tester-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .tester-card {
          background: #fff;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .tester-card:not(.disabled):hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
        }

        .tester-card.disabled {
          opacity: 0.6;
        }

        .tester-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .tester-card h2 {
          font-size: 1.25rem;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .tester-card p {
          color: #64748b;
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
        }

        .tester-link {
          display: inline-block;
          background: #2563eb;
          color: #fff;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          text-decoration: none;
          font-weight: 500;
          transition: background 0.2s ease;
        }

        .tester-link:hover {
          background: #1d4ed8;
        }

        .coming-soon-badge {
          display: inline-block;
          background: #f1f5f9;
          color: #94a3b8;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}

export default Home
