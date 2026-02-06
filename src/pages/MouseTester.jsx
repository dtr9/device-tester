import { useState, useEffect, useCallback, useRef } from 'react'
import './MouseTester.css'

// Mouse button mapping
const MOUSE_BUTTONS = [
  { id: 0, label: 'Left', code: 'left' },
  { id: 1, label: 'Middle', code: 'middle' },
  { id: 2, label: 'Right', code: 'right' },
  { id: 3, label: 'Back', code: 'back' },
  { id: 4, label: 'Forward', code: 'forward' },
]

function MouseTester() {
  const [pressedButtons, setPressedButtons] = useState(new Set())
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [testAreaPosition, setTestAreaPosition] = useState({ x: 0, y: 0 })
  const [clickCount, setClickCount] = useState({ left: 0, right: 0, middle: 0 })
  const [scrollData, setScrollData] = useState({ deltaX: 0, deltaY: 0, total: 0 })
  const [lastEvent, setLastEvent] = useState(null)
  const [history, setHistory] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [dragDistance, setDragDistance] = useState(0)
  const [doubleClickDetected, setDoubleClickDetected] = useState(false)

  const testAreaRef = useRef(null)
  const scrollTimeoutRef = useRef(null)

  // Handle mouse down
  const handleMouseDown = useCallback((e) => {
    e.preventDefault()

    setPressedButtons(prev => new Set([...prev, e.button]))

    // Track drag start
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setDragDistance(0)

    const eventInfo = {
      type: 'mousedown',
      button: MOUSE_BUTTONS[e.button]?.label || `Button ${e.button}`,
      buttonId: e.button,
      x: e.clientX,
      y: e.clientY,
      timestamp: new Date().toLocaleTimeString(),
      id: Date.now(),
    }

    setLastEvent(eventInfo)
    setHistory(prev => [eventInfo, ...prev].slice(0, 50))
  }, [])

  // Handle mouse up
  const handleMouseUp = useCallback((e) => {
    e.preventDefault()

    setPressedButtons(prev => {
      const next = new Set(prev)
      next.delete(e.button)
      return next
    })

    // End drag tracking
    setIsDragging(false)
    setDragStart(null)

    const eventInfo = {
      type: 'mouseup',
      button: MOUSE_BUTTONS[e.button]?.label || `Button ${e.button}`,
      buttonId: e.button,
      x: e.clientX,
      y: e.clientY,
      timestamp: new Date().toLocaleTimeString(),
      id: Date.now(),
    }

    setLastEvent(eventInfo)
    setHistory(prev => [eventInfo, ...prev].slice(0, 50))
  }, [])

  // Handle click (for counting)
  const handleClick = useCallback((e) => {
    if (e.button === 0) {
      setClickCount(prev => ({ ...prev, left: prev.left + 1 }))
    }
  }, [])

  // Handle context menu (right click)
  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    setClickCount(prev => ({ ...prev, right: prev.right + 1 }))
  }, [])

  // Handle middle click
  const handleAuxClick = useCallback((e) => {
    if (e.button === 1) {
      setClickCount(prev => ({ ...prev, middle: prev.middle + 1 }))
    }
  }, [])

  // Handle double click
  const handleDoubleClick = useCallback((e) => {
    setDoubleClickDetected(true)
    setTimeout(() => setDoubleClickDetected(false), 500)

    const eventInfo = {
      type: 'dblclick',
      button: 'Left',
      buttonId: 0,
      x: e.clientX,
      y: e.clientY,
      timestamp: new Date().toLocaleTimeString(),
      id: Date.now(),
    }

    setLastEvent(eventInfo)
    setHistory(prev => [eventInfo, ...prev].slice(0, 50))
  }, [])

  // Handle mouse move
  const handleMouseMove = useCallback((e) => {
    setMousePosition({ x: e.clientX, y: e.clientY })

    // Calculate position relative to test area
    if (testAreaRef.current) {
      const rect = testAreaRef.current.getBoundingClientRect()
      setTestAreaPosition({
        x: Math.round(e.clientX - rect.left),
        y: Math.round(e.clientY - rect.top),
      })
    }

    // Track drag distance
    if (isDragging && dragStart) {
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y
      setDragDistance(Math.round(Math.sqrt(dx * dx + dy * dy)))
    }
  }, [isDragging, dragStart])

  // Handle scroll
  const handleWheel = useCallback((e) => {
    e.preventDefault()

    const direction = e.deltaY < 0 ? 'up' : e.deltaY > 0 ? 'down' :
                     e.deltaX < 0 ? 'left' : e.deltaX > 0 ? 'right' : 'none'

    setScrollData(prev => ({
      deltaX: e.deltaX,
      deltaY: e.deltaY,
      total: prev.total + Math.abs(e.deltaY) + Math.abs(e.deltaX),
    }))

    const eventInfo = {
      type: 'scroll',
      direction,
      deltaX: Math.round(e.deltaX),
      deltaY: Math.round(e.deltaY),
      timestamp: new Date().toLocaleTimeString(),
      id: Date.now(),
    }

    setLastEvent(eventInfo)
    setHistory(prev => [eventInfo, ...prev].slice(0, 50))

    // Reset scroll display after a delay
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setScrollData(prev => ({ ...prev, deltaX: 0, deltaY: 0 }))
    }, 300)
  }, [])

  // Set up event listeners
  useEffect(() => {
    const testArea = testAreaRef.current
    if (!testArea) return

    testArea.addEventListener('mousedown', handleMouseDown)
    testArea.addEventListener('mouseup', handleMouseUp)
    testArea.addEventListener('click', handleClick)
    testArea.addEventListener('contextmenu', handleContextMenu)
    testArea.addEventListener('auxclick', handleAuxClick)
    testArea.addEventListener('dblclick', handleDoubleClick)
    testArea.addEventListener('mousemove', handleMouseMove)
    testArea.addEventListener('wheel', handleWheel, { passive: false })

    // Global mouseup to handle release outside test area
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      testArea.removeEventListener('mousedown', handleMouseDown)
      testArea.removeEventListener('mouseup', handleMouseUp)
      testArea.removeEventListener('click', handleClick)
      testArea.removeEventListener('contextmenu', handleContextMenu)
      testArea.removeEventListener('auxclick', handleAuxClick)
      testArea.removeEventListener('dblclick', handleDoubleClick)
      testArea.removeEventListener('mousemove', handleMouseMove)
      testArea.removeEventListener('wheel', handleWheel)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseDown, handleMouseUp, handleClick, handleContextMenu, handleAuxClick, handleDoubleClick, handleMouseMove, handleWheel])

  const clearHistory = () => {
    setHistory([])
    setLastEvent(null)
    setClickCount({ left: 0, right: 0, middle: 0 })
    setScrollData({ deltaX: 0, deltaY: 0, total: 0 })
  }

  const resetAll = () => {
    clearHistory()
    setDragDistance(0)
  }

  return (
    <div className="mouse-tester">
      <h1>Mouse Tester</h1>
      <p className="subtitle">Click, scroll, and move your mouse in the test area below.</p>

      <div className="mouse-content">
        {/* Test Area */}
        <div className="test-area-container">
          <div
            ref={testAreaRef}
            className={`test-area ${isDragging ? 'dragging' : ''} ${doubleClickDetected ? 'double-clicked' : ''}`}
          >
            <div className="crosshair horizontal" style={{ top: testAreaPosition.y }} />
            <div className="crosshair vertical" style={{ left: testAreaPosition.x }} />
            <div className="position-indicator" style={{ left: testAreaPosition.x, top: testAreaPosition.y }}>
              <span className="coords">{testAreaPosition.x}, {testAreaPosition.y}</span>
            </div>
            {doubleClickDetected && (
              <div className="double-click-indicator">Double Click!</div>
            )}
          </div>

          {/* Mouse Visual */}
          <div className="mouse-visual">
            <div className="mouse-body">
              <div className={`mouse-button left ${pressedButtons.has(0) ? 'pressed' : ''}`}>
                <span>L</span>
              </div>
              <div className={`mouse-scroll ${scrollData.deltaY !== 0 ? (scrollData.deltaY < 0 ? 'scroll-up' : 'scroll-down') : ''}`}>
                <div className={`scroll-wheel ${pressedButtons.has(1) ? 'pressed' : ''}`}></div>
              </div>
              <div className={`mouse-button right ${pressedButtons.has(2) ? 'pressed' : ''}`}>
                <span>R</span>
              </div>
            </div>
            <div className="mouse-side-buttons">
              <div className={`side-button back ${pressedButtons.has(3) ? 'pressed' : ''}`}>
                <span>Back</span>
              </div>
              <div className={`side-button forward ${pressedButtons.has(4) ? 'pressed' : ''}`}>
                <span>Fwd</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Panels */}
        <div className="info-panels">
          {/* Button Status */}
          <div className="panel button-panel">
            <h3>Mouse Buttons</h3>
            <div className="button-grid">
              {MOUSE_BUTTONS.map(btn => (
                <div
                  key={btn.id}
                  className={`button-indicator ${pressedButtons.has(btn.id) ? 'pressed' : ''}`}
                >
                  <span className="button-label">{btn.label}</span>
                  <span className="button-status">{pressedButtons.has(btn.id) ? 'Pressed' : 'Released'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Position & Movement */}
          <div className="panel position-panel">
            <h3>Position & Movement</h3>
            <div className="stat-grid">
              <div className="stat">
                <span className="stat-label">Screen Position</span>
                <span className="stat-value">{mousePosition.x}, {mousePosition.y}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Test Area Position</span>
                <span className="stat-value">{testAreaPosition.x}, {testAreaPosition.y}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Dragging</span>
                <span className={`stat-value ${isDragging ? 'active' : ''}`}>
                  {isDragging ? `Yes (${dragDistance}px)` : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Click Counter */}
          <div className="panel click-panel">
            <h3>Click Counter</h3>
            <div className="click-grid">
              <div className="click-stat">
                <span className="click-count">{clickCount.left}</span>
                <span className="click-label">Left Clicks</span>
              </div>
              <div className="click-stat">
                <span className="click-count">{clickCount.middle}</span>
                <span className="click-label">Middle Clicks</span>
              </div>
              <div className="click-stat">
                <span className="click-count">{clickCount.right}</span>
                <span className="click-label">Right Clicks</span>
              </div>
            </div>
          </div>

          {/* Scroll Info */}
          <div className="panel scroll-panel">
            <h3>Scroll Wheel</h3>
            <div className="scroll-visual">
              <div className={`scroll-direction up ${scrollData.deltaY < 0 ? 'active' : ''}`}>↑</div>
              <div className="scroll-center">
                <div className={`scroll-direction left ${scrollData.deltaX < 0 ? 'active' : ''}`}>←</div>
                <div className="scroll-info">
                  <div className="scroll-delta">
                    {scrollData.deltaY !== 0 && <span>Y: {scrollData.deltaY > 0 ? '+' : ''}{Math.round(scrollData.deltaY)}</span>}
                    {scrollData.deltaX !== 0 && <span>X: {scrollData.deltaX > 0 ? '+' : ''}{Math.round(scrollData.deltaX)}</span>}
                  </div>
                </div>
                <div className={`scroll-direction right ${scrollData.deltaX > 0 ? 'active' : ''}`}>→</div>
              </div>
              <div className={`scroll-direction down ${scrollData.deltaY > 0 ? 'active' : ''}`}>↓</div>
            </div>
            <div className="scroll-total">Total: {Math.round(scrollData.total)}px</div>
          </div>

          {/* Event Details */}
          <div className="panel event-panel">
            <h3>Last Event</h3>
            {lastEvent ? (
              <div className="event-details">
                <div className="event-row">
                  <span className="label">Type</span>
                  <span className="value">{lastEvent.type}</span>
                </div>
                {lastEvent.button && (
                  <div className="event-row">
                    <span className="label">Button</span>
                    <span className="value">{lastEvent.button} ({lastEvent.buttonId})</span>
                  </div>
                )}
                {lastEvent.direction && (
                  <div className="event-row">
                    <span className="label">Direction</span>
                    <span className="value">{lastEvent.direction}</span>
                  </div>
                )}
                {lastEvent.x !== undefined && (
                  <div className="event-row">
                    <span className="label">Position</span>
                    <span className="value">{lastEvent.x}, {lastEvent.y}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="no-event">Interact with the test area</p>
            )}
          </div>

          {/* History */}
          <div className="panel history-panel">
            <div className="history-header">
              <h3>Event History</h3>
              <button onClick={resetAll} className="clear-btn">Reset All</button>
            </div>
            <div className="history-list">
              {history.length > 0 ? (
                history.map(item => (
                  <div key={item.id} className="history-item">
                    <span className={`history-type ${item.type}`}>{item.type}</span>
                    <span className="history-detail">
                      {item.button || item.direction || ''}
                    </span>
                    <span className="history-time">{item.timestamp}</span>
                  </div>
                ))
              ) : (
                <p className="no-history">No events yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MouseTester
