import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import './KeyboardTester.css'

// Detect if user is on Mac
const isMacOS = () => {
  if (typeof navigator !== 'undefined') {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
           navigator.userAgent.toUpperCase().indexOf('MAC') >= 0
  }
  return false
}

// Windows Main keyboard section (left side)
const WINDOWS_MAIN_KEYBOARD = [
  // Row 1 - Function keys
  [
    { code: 'Escape', label: 'Esc', width: 1 },
    { code: 'spacer', label: '', width: 0.5, spacer: true },
    { code: 'F1', label: 'F1', width: 1 },
    { code: 'F2', label: 'F2', width: 1 },
    { code: 'F3', label: 'F3', width: 1 },
    { code: 'F4', label: 'F4', width: 1 },
    { code: 'spacer2', label: '', width: 0.5, spacer: true },
    { code: 'F5', label: 'F5', width: 1 },
    { code: 'F6', label: 'F6', width: 1 },
    { code: 'F7', label: 'F7', width: 1 },
    { code: 'F8', label: 'F8', width: 1 },
    { code: 'spacer3', label: '', width: 0.5, spacer: true },
    { code: 'F9', label: 'F9', width: 1 },
    { code: 'F10', label: 'F10', width: 1 },
    { code: 'F11', label: 'F11', width: 1 },
    { code: 'F12', label: 'F12', width: 1 },
  ],
  // Row 2 - Number row
  [
    { code: 'Backquote', label: '`', width: 1 },
    { code: 'Digit1', label: '1', width: 1 },
    { code: 'Digit2', label: '2', width: 1 },
    { code: 'Digit3', label: '3', width: 1 },
    { code: 'Digit4', label: '4', width: 1 },
    { code: 'Digit5', label: '5', width: 1 },
    { code: 'Digit6', label: '6', width: 1 },
    { code: 'Digit7', label: '7', width: 1 },
    { code: 'Digit8', label: '8', width: 1 },
    { code: 'Digit9', label: '9', width: 1 },
    { code: 'Digit0', label: '0', width: 1 },
    { code: 'Minus', label: '-', width: 1 },
    { code: 'Equal', label: '=', width: 1 },
    { code: 'Backspace', label: 'Backspace', width: 2 },
  ],
  // Row 3 - QWERTY row
  [
    { code: 'Tab', label: 'Tab', width: 1.5 },
    { code: 'KeyQ', label: 'Q', width: 1 },
    { code: 'KeyW', label: 'W', width: 1 },
    { code: 'KeyE', label: 'E', width: 1 },
    { code: 'KeyR', label: 'R', width: 1 },
    { code: 'KeyT', label: 'T', width: 1 },
    { code: 'KeyY', label: 'Y', width: 1 },
    { code: 'KeyU', label: 'U', width: 1 },
    { code: 'KeyI', label: 'I', width: 1 },
    { code: 'KeyO', label: 'O', width: 1 },
    { code: 'KeyP', label: 'P', width: 1 },
    { code: 'BracketLeft', label: '[', width: 1 },
    { code: 'BracketRight', label: ']', width: 1 },
    { code: 'Backslash', label: '\\', width: 1.5 },
  ],
  // Row 4 - ASDF row
  [
    { code: 'CapsLock', label: 'Caps', width: 1.75, modifier: true },
    { code: 'KeyA', label: 'A', width: 1 },
    { code: 'KeyS', label: 'S', width: 1 },
    { code: 'KeyD', label: 'D', width: 1 },
    { code: 'KeyF', label: 'F', width: 1 },
    { code: 'KeyG', label: 'G', width: 1 },
    { code: 'KeyH', label: 'H', width: 1 },
    { code: 'KeyJ', label: 'J', width: 1 },
    { code: 'KeyK', label: 'K', width: 1 },
    { code: 'KeyL', label: 'L', width: 1 },
    { code: 'Semicolon', label: ';', width: 1 },
    { code: 'Quote', label: "'", width: 1 },
    { code: 'Enter', label: 'Enter', width: 2.25 },
  ],
  // Row 5 - ZXCV row
  [
    { code: 'ShiftLeft', label: 'Shift', width: 2.25, modifier: true },
    { code: 'KeyZ', label: 'Z', width: 1 },
    { code: 'KeyX', label: 'X', width: 1 },
    { code: 'KeyC', label: 'C', width: 1 },
    { code: 'KeyV', label: 'V', width: 1 },
    { code: 'KeyB', label: 'B', width: 1 },
    { code: 'KeyN', label: 'N', width: 1 },
    { code: 'KeyM', label: 'M', width: 1 },
    { code: 'Comma', label: ',', width: 1 },
    { code: 'Period', label: '.', width: 1 },
    { code: 'Slash', label: '/', width: 1 },
    { code: 'ShiftRight', label: 'Shift', width: 2.75, modifier: true },
  ],
  // Row 6 - Bottom row (includes Fn key which is inferred, not directly detected)
  [
    { code: 'ControlLeft', label: 'Ctrl', width: 1.25, modifier: true },
    { code: 'Fn', label: 'Fn', width: 1.25, modifier: true, isFnKey: true },
    { code: 'MetaLeft', label: 'Win', width: 1.25, modifier: true },
    { code: 'AltLeft', label: 'Alt', width: 1.25, modifier: true },
    { code: 'Space', label: 'Space', width: 5 },
    { code: 'AltRight', label: 'Alt', width: 1.25, modifier: true },
    { code: 'MetaRight', label: 'Win', width: 1.25, modifier: true },
    { code: 'ContextMenu', label: 'Menu', width: 1.25 },
    { code: 'ControlRight', label: 'Ctrl', width: 1.25, modifier: true },
  ],
]

// Mac Main keyboard section
const MAC_MAIN_KEYBOARD = [
  // Row 1 - Function keys (same as Windows)
  [
    { code: 'Escape', label: 'esc', width: 1 },
    { code: 'spacer', label: '', width: 0.5, spacer: true },
    { code: 'F1', label: 'F1', width: 1 },
    { code: 'F2', label: 'F2', width: 1 },
    { code: 'F3', label: 'F3', width: 1 },
    { code: 'F4', label: 'F4', width: 1 },
    { code: 'spacer2', label: '', width: 0.5, spacer: true },
    { code: 'F5', label: 'F5', width: 1 },
    { code: 'F6', label: 'F6', width: 1 },
    { code: 'F7', label: 'F7', width: 1 },
    { code: 'F8', label: 'F8', width: 1 },
    { code: 'spacer3', label: '', width: 0.5, spacer: true },
    { code: 'F9', label: 'F9', width: 1 },
    { code: 'F10', label: 'F10', width: 1 },
    { code: 'F11', label: 'F11', width: 1 },
    { code: 'F12', label: 'F12', width: 1 },
  ],
  // Row 2 - Number row
  [
    { code: 'Backquote', label: '`', width: 1 },
    { code: 'Digit1', label: '1', width: 1 },
    { code: 'Digit2', label: '2', width: 1 },
    { code: 'Digit3', label: '3', width: 1 },
    { code: 'Digit4', label: '4', width: 1 },
    { code: 'Digit5', label: '5', width: 1 },
    { code: 'Digit6', label: '6', width: 1 },
    { code: 'Digit7', label: '7', width: 1 },
    { code: 'Digit8', label: '8', width: 1 },
    { code: 'Digit9', label: '9', width: 1 },
    { code: 'Digit0', label: '0', width: 1 },
    { code: 'Minus', label: '-', width: 1 },
    { code: 'Equal', label: '=', width: 1 },
    { code: 'Backspace', label: 'delete', width: 2 },
  ],
  // Row 3 - QWERTY row
  [
    { code: 'Tab', label: 'tab', width: 1.5 },
    { code: 'KeyQ', label: 'Q', width: 1 },
    { code: 'KeyW', label: 'W', width: 1 },
    { code: 'KeyE', label: 'E', width: 1 },
    { code: 'KeyR', label: 'R', width: 1 },
    { code: 'KeyT', label: 'T', width: 1 },
    { code: 'KeyY', label: 'Y', width: 1 },
    { code: 'KeyU', label: 'U', width: 1 },
    { code: 'KeyI', label: 'I', width: 1 },
    { code: 'KeyO', label: 'O', width: 1 },
    { code: 'KeyP', label: 'P', width: 1 },
    { code: 'BracketLeft', label: '[', width: 1 },
    { code: 'BracketRight', label: ']', width: 1 },
    { code: 'Backslash', label: '\\', width: 1.5 },
  ],
  // Row 4 - ASDF row
  [
    { code: 'CapsLock', label: 'caps lock', width: 1.75, modifier: true },
    { code: 'KeyA', label: 'A', width: 1 },
    { code: 'KeyS', label: 'S', width: 1 },
    { code: 'KeyD', label: 'D', width: 1 },
    { code: 'KeyF', label: 'F', width: 1 },
    { code: 'KeyG', label: 'G', width: 1 },
    { code: 'KeyH', label: 'H', width: 1 },
    { code: 'KeyJ', label: 'J', width: 1 },
    { code: 'KeyK', label: 'K', width: 1 },
    { code: 'KeyL', label: 'L', width: 1 },
    { code: 'Semicolon', label: ';', width: 1 },
    { code: 'Quote', label: "'", width: 1 },
    { code: 'Enter', label: 'return', width: 2.25 },
  ],
  // Row 5 - ZXCV row
  [
    { code: 'ShiftLeft', label: '⇧ shift', width: 2.25, modifier: true },
    { code: 'KeyZ', label: 'Z', width: 1 },
    { code: 'KeyX', label: 'X', width: 1 },
    { code: 'KeyC', label: 'C', width: 1 },
    { code: 'KeyV', label: 'V', width: 1 },
    { code: 'KeyB', label: 'B', width: 1 },
    { code: 'KeyN', label: 'N', width: 1 },
    { code: 'KeyM', label: 'M', width: 1 },
    { code: 'Comma', label: ',', width: 1 },
    { code: 'Period', label: '.', width: 1 },
    { code: 'Slash', label: '/', width: 1 },
    { code: 'ShiftRight', label: '⇧ shift', width: 2.75, modifier: true },
  ],
  // Row 6 - Bottom row (Mac layout: fn, control, option, command, space, command, option)
  [
    { code: 'Fn', label: 'fn', width: 1.25, modifier: true, isFnKey: true },
    { code: 'ControlLeft', label: '⌃ control', width: 1.25, modifier: true },
    { code: 'AltLeft', label: '⌥ option', width: 1.25, modifier: true },
    { code: 'MetaLeft', label: '⌘ command', width: 1.5, modifier: true },
    { code: 'Space', label: 'space', width: 5 },
    { code: 'MetaRight', label: '⌘ command', width: 1.5, modifier: true },
    { code: 'AltRight', label: '⌥ option', width: 1.25, modifier: true },
    { code: 'ControlRight', label: '⌃ control', width: 1.25, modifier: true },
  ],
]

// Windows Navigation cluster (middle section) - Print Screen, Nav, Arrows
const WINDOWS_NAV_CLUSTER = [
  // Row 1 - Print Screen cluster (multiple codes for browser compatibility)
  [
    { code: 'PrintScreen', altCodes: ['Snapshot', 'PrintScreen'], label: 'PrtSc', width: 1 },
    { code: 'ScrollLock', label: 'ScrLk', width: 1 },
    { code: 'Pause', altCodes: ['Pause', 'Break'], label: 'Pause', width: 1 },
  ],
  // Row 2 - Insert, Home, Page Up
  [
    { code: 'Insert', label: 'Ins', width: 1 },
    { code: 'Home', label: 'Home', width: 1 },
    { code: 'PageUp', label: 'PgUp', width: 1 },
  ],
  // Row 3 - Delete, End, Page Down
  [
    { code: 'Delete', label: 'Del', width: 1 },
    { code: 'End', label: 'End', width: 1 },
    { code: 'PageDown', label: 'PgDn', width: 1 },
  ],
  // Row 4 - Empty (spacer for alignment)
  [],
  // Row 5 - Arrow Up
  [
    { code: 'spacer4', label: '', width: 1, spacer: true },
    { code: 'ArrowUp', label: '↑', width: 1 },
    { code: 'spacer5', label: '', width: 1, spacer: true },
  ],
  // Row 6 - Arrow Left, Down, Right
  [
    { code: 'ArrowLeft', label: '←', width: 1 },
    { code: 'ArrowDown', label: '↓', width: 1 },
    { code: 'ArrowRight', label: '→', width: 1 },
  ],
]

// Mac Navigation cluster (no Insert, different labels)
const MAC_NAV_CLUSTER = [
  // Row 1 - Function cluster (Mac has F13-F15 or media keys here on extended keyboards)
  [
    { code: 'F13', label: 'F13', width: 1 },
    { code: 'F14', label: 'F14', width: 1 },
    { code: 'F15', label: 'F15', width: 1 },
  ],
  // Row 2 - Fn+Delete = Forward Delete, Home, Page Up
  [
    { code: 'Help', label: 'help', width: 1 },
    { code: 'Home', label: 'home', width: 1 },
    { code: 'PageUp', label: 'page up', width: 1 },
  ],
  // Row 3 - Forward Delete, End, Page Down
  [
    { code: 'Delete', label: 'del', width: 1 },
    { code: 'End', label: 'end', width: 1 },
    { code: 'PageDown', label: 'page down', width: 1 },
  ],
  // Row 4 - Empty (spacer for alignment)
  [],
  // Row 5 - Arrow Up
  [
    { code: 'spacer4', label: '', width: 1, spacer: true },
    { code: 'ArrowUp', label: '↑', width: 1 },
    { code: 'spacer5', label: '', width: 1, spacer: true },
  ],
  // Row 6 - Arrow Left, Down, Right
  [
    { code: 'ArrowLeft', label: '←', width: 1 },
    { code: 'ArrowDown', label: '↓', width: 1 },
    { code: 'ArrowRight', label: '→', width: 1 },
  ],
]

// Media/Function keys (triggered by Fn+key combinations)
// These are keys that are typically accessed via Fn+[key] on laptops
const MEDIA_KEYS = [
  // Row 1 - Volume and mute
  [
    { code: 'AudioVolumeMute', label: '🔇 Mute', width: 1.5, fnCombo: 'Fn + Mute' },
    { code: 'AudioVolumeDown', label: '🔉 Vol-', width: 1.5, fnCombo: 'Fn + Vol-' },
    { code: 'AudioVolumeUp', label: '🔊 Vol+', width: 1.5, fnCombo: 'Fn + Vol+' },
  ],
  // Row 2 - Media controls
  [
    { code: 'MediaTrackPrevious', label: '⏮ Prev', width: 1.5, fnCombo: 'Fn + Prev' },
    { code: 'MediaPlayPause', label: '⏯ Play', width: 1.5, fnCombo: 'Fn + Play' },
    { code: 'MediaTrackNext', label: '⏭ Next', width: 1.5, fnCombo: 'Fn + Next' },
  ],
  // Row 3 - Brightness and other
  [
    { code: 'BrightnessDown', label: '🔅 Dim', width: 1.5, fnCombo: 'Fn + Bright-' },
    { code: 'BrightnessUp', label: '🔆 Bright', width: 1.5, fnCombo: 'Fn + Bright+' },
    { code: 'MediaStop', label: '⏹ Stop', width: 1.5, fnCombo: 'Fn + Stop' },
  ],
  // Row 4 - Additional function keys
  [
    { code: 'LaunchMail', label: '✉ Mail', width: 1.5, fnCombo: 'Fn + Mail' },
    { code: 'LaunchApp2', label: '🖩 Calc', width: 1.5, fnCombo: 'Fn + Calc' },
    { code: 'Sleep', label: '💤 Sleep', width: 1.5, fnCombo: 'Fn + Sleep' },
  ],
]

// Set of all Fn-triggered key codes (to detect when Fn is being used)
const FN_TRIGGERED_CODES = new Set([
  'AudioVolumeMute', 'AudioVolumeDown', 'AudioVolumeUp',
  'MediaTrackPrevious', 'MediaPlayPause', 'MediaTrackNext', 'MediaStop',
  'BrightnessDown', 'BrightnessUp',
  'LaunchMail', 'LaunchApp1', 'LaunchApp2',
  'Sleep', 'WakeUp', 'Power',
  'Eject', 'MediaSelect',
])

// Windows Numpad section (right side) - using grid positioning for tall keys
const WINDOWS_NUMPAD_KEYS = [
  // Row 1
  { code: 'NumLock', label: 'Num', gridCol: '1', gridRow: '1', modifier: true },
  { code: 'NumpadDivide', label: '/', gridCol: '2', gridRow: '1' },
  { code: 'NumpadMultiply', label: '*', gridCol: '3', gridRow: '1' },
  { code: 'NumpadSubtract', label: '-', gridCol: '4', gridRow: '1' },
  // Row 2
  { code: 'Numpad7', label: '7', gridCol: '1', gridRow: '2' },
  { code: 'Numpad8', label: '8', gridCol: '2', gridRow: '2' },
  { code: 'Numpad9', label: '9', gridCol: '3', gridRow: '2' },
  { code: 'NumpadAdd', label: '+', gridCol: '4', gridRow: '2 / 4' }, // Spans 2 rows
  // Row 3
  { code: 'Numpad4', label: '4', gridCol: '1', gridRow: '3' },
  { code: 'Numpad5', label: '5', gridCol: '2', gridRow: '3' },
  { code: 'Numpad6', label: '6', gridCol: '3', gridRow: '3' },
  // Row 4
  { code: 'Numpad1', label: '1', gridCol: '1', gridRow: '4' },
  { code: 'Numpad2', label: '2', gridCol: '2', gridRow: '4' },
  { code: 'Numpad3', label: '3', gridCol: '3', gridRow: '4' },
  { code: 'NumpadEnter', label: 'Enter', gridCol: '4', gridRow: '4 / 6' }, // Spans 2 rows
  // Row 5
  { code: 'Numpad0', label: '0', gridCol: '1 / 3', gridRow: '5' }, // Spans 2 columns
  { code: 'NumpadDecimal', label: '.', gridCol: '3', gridRow: '5' },
]

// Mac Numpad section (Clear instead of NumLock)
const MAC_NUMPAD_KEYS = [
  // Row 1
  { code: 'NumLock', label: 'clear', gridCol: '1', gridRow: '1', modifier: true },
  { code: 'NumpadEqual', label: '=', gridCol: '2', gridRow: '1' },
  { code: 'NumpadDivide', label: '/', gridCol: '3', gridRow: '1' },
  { code: 'NumpadMultiply', label: '*', gridCol: '4', gridRow: '1' },
  // Row 2
  { code: 'Numpad7', label: '7', gridCol: '1', gridRow: '2' },
  { code: 'Numpad8', label: '8', gridCol: '2', gridRow: '2' },
  { code: 'Numpad9', label: '9', gridCol: '3', gridRow: '2' },
  { code: 'NumpadSubtract', label: '-', gridCol: '4', gridRow: '2' },
  // Row 3
  { code: 'Numpad4', label: '4', gridCol: '1', gridRow: '3' },
  { code: 'Numpad5', label: '5', gridCol: '2', gridRow: '3' },
  { code: 'Numpad6', label: '6', gridCol: '3', gridRow: '3' },
  { code: 'NumpadAdd', label: '+', gridCol: '4', gridRow: '3' },
  // Row 4
  { code: 'Numpad1', label: '1', gridCol: '1', gridRow: '4' },
  { code: 'Numpad2', label: '2', gridCol: '2', gridRow: '4' },
  { code: 'Numpad3', label: '3', gridCol: '3', gridRow: '4' },
  { code: 'NumpadEnter', label: 'enter', gridCol: '4', gridRow: '4 / 6' }, // Spans 2 rows
  // Row 5
  { code: 'Numpad0', label: '0', gridCol: '1 / 3', gridRow: '5' }, // Spans 2 columns
  { code: 'NumpadDecimal', label: '.', gridCol: '3', gridRow: '5' },
]

function KeyboardTester() {
  const [pressedKeys, setPressedKeys] = useState(new Set())
  const [currentEvent, setCurrentEvent] = useState(null)
  const [history, setHistory] = useState([])
  const [modifiers, setModifiers] = useState({
    shift: false,
    ctrl: false,
    alt: false,
    meta: false,
  })
  const [fnActive, setFnActive] = useState(false)

  // Keyboard layout: 'windows' or 'mac' - auto-detect on mount
  const [keyboardLayout, setKeyboardLayout] = useState(() => isMacOS() ? 'mac' : 'windows')

  // Track keys that have been tested (pressed at least once)
  const [testedKeys, setTestedKeys] = useState(new Set())

  // Track if keydown was received for proper keyup handling
  const keyDownReceived = useRef(new Set())

  // Get the appropriate keyboard layouts based on selection
  const MAIN_KEYBOARD = useMemo(() =>
    keyboardLayout === 'mac' ? MAC_MAIN_KEYBOARD : WINDOWS_MAIN_KEYBOARD,
    [keyboardLayout]
  )
  const NAV_CLUSTER = useMemo(() =>
    keyboardLayout === 'mac' ? MAC_NAV_CLUSTER : WINDOWS_NAV_CLUSTER,
    [keyboardLayout]
  )
  const NUMPAD_KEYS = useMemo(() =>
    keyboardLayout === 'mac' ? MAC_NUMPAD_KEYS : WINDOWS_NUMPAD_KEYS,
    [keyboardLayout]
  )

  const handleKeyDown = useCallback((e) => {
    e.preventDefault()

    // Use both code and key for better detection (some keys like PrintScreen may vary)
    const keyCode = e.code || e.key

    // Track that we received keydown for this key
    keyDownReceived.current.add(keyCode)

    setPressedKeys((prev) => new Set([...prev, keyCode]))

    // Mark key as tested
    setTestedKeys((prev) => new Set([...prev, keyCode]))

    // Check if this is an Fn-triggered key (infer Fn is being held)
    const isFnTriggered = FN_TRIGGERED_CODES.has(keyCode)
    if (isFnTriggered) {
      setFnActive(true)
    }

    setModifiers({
      shift: e.shiftKey,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      meta: e.metaKey,
    })

    // Find the fnCombo label if this is an Fn-triggered key
    let fnComboLabel = null
    if (isFnTriggered) {
      for (const row of MEDIA_KEYS) {
        const found = row.find(k => k.code === keyCode)
        if (found) {
          fnComboLabel = found.fnCombo
          break
        }
      }
    }

    const eventInfo = {
      key: e.key,
      code: e.code,
      keyCode: e.keyCode,
      timestamp: new Date().toLocaleTimeString(),
      id: Date.now(),
      fnCombo: fnComboLabel,
      isFnTriggered,
    }

    setCurrentEvent(eventInfo)
    setHistory((prev) => [eventInfo, ...prev].slice(0, 50))
  }, [])

  const handleKeyUp = useCallback((e) => {
    e.preventDefault()

    const keyCode = e.code || e.key
    const isFnTriggered = FN_TRIGGERED_CODES.has(keyCode)

    // For keys like PrintScreen that may only fire on keyup, briefly show them as pressed
    if (!keyDownReceived.current.has(keyCode)) {
      // Key wasn't seen on keydown, show it briefly and log the event
      setPressedKeys((prev) => new Set([...prev, keyCode]))

      // Mark key as tested
      setTestedKeys((prev) => new Set([...prev, keyCode]))

      if (isFnTriggered) {
        setFnActive(true)
      }

      // Find the fnCombo label if this is an Fn-triggered key
      let fnComboLabel = null
      if (isFnTriggered) {
        for (const row of MEDIA_KEYS) {
          const found = row.find(k => k.code === keyCode)
          if (found) {
            fnComboLabel = found.fnCombo
            break
          }
        }
      }

      const eventInfo = {
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        timestamp: new Date().toLocaleTimeString(),
        id: Date.now(),
        note: '(keyup only)',
        fnCombo: fnComboLabel,
        isFnTriggered,
      }
      setCurrentEvent(eventInfo)
      setHistory((prev) => [eventInfo, ...prev].slice(0, 50))

      // Remove after a brief delay for visual feedback
      setTimeout(() => {
        setPressedKeys((prev) => {
          const next = new Set(prev)
          next.delete(keyCode)
          return next
        })
        if (isFnTriggered) {
          setFnActive(false)
        }
      }, 150)
    } else {
      // Normal keyup - remove from pressed set
      setPressedKeys((prev) => {
        const next = new Set(prev)
        next.delete(keyCode)
        return next
      })
      keyDownReceived.current.delete(keyCode)

      // Reset Fn active state when Fn-triggered key is released
      if (isFnTriggered) {
        setFnActive(false)
      }
    }

    setModifiers({
      shift: e.shiftKey,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      meta: e.metaKey,
    })
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  const clearHistory = () => {
    setHistory([])
    setCurrentEvent(null)
  }

  // Reset all tested keys
  const resetTestedKeys = () => {
    setTestedKeys(new Set())
  }

  // Helper to check if a key has been tested (pressed at least once)
  const isKeyTested = (key) => {
    if (key.isFnKey) {
      return testedKeys.has('Fn') || testedKeys.has(key.code)
    }
    if (testedKeys.has(key.code)) return true
    if (key.altCodes) {
      return key.altCodes.some(code => testedKeys.has(code))
    }
    return false
  }

  // Helper to check if a key is pressed (supports altCodes for browser compatibility)
  const isKeyPressed = (key) => {
    // Special handling for Fn key - it's inferred from Fn-triggered key presses
    if (key.isFnKey) {
      return fnActive
    }
    if (pressedKeys.has(key.code)) return true
    if (key.altCodes) {
      return key.altCodes.some(code => pressedKeys.has(code))
    }
    return false
  }

  return (
    <div className="keyboard-tester">
      <h1>Keyboard Test</h1>
      <p className="subtitle">Press any key to test. All key presses are captured. <span className="note">Fn key combinations (volume, brightness, media) are detected and shown below.</span></p>

      {/* Keyboard Controls */}
      <div className="keyboard-controls">
        <div className="layout-toggle">
          <span className="layout-label">Keyboard Layout:</span>
          <div className="layout-buttons">
            <button
              className={`layout-btn ${keyboardLayout === 'windows' ? 'active' : ''}`}
              onClick={() => setKeyboardLayout('windows')}
            >
              Windows
            </button>
            <button
              className={`layout-btn ${keyboardLayout === 'mac' ? 'active' : ''}`}
              onClick={() => setKeyboardLayout('mac')}
            >
              Mac
            </button>
          </div>
        </div>
        <button className="reset-btn" onClick={resetTestedKeys}>
          Reset All Keys
        </button>
      </div>

      <div className="keyboard-container">
        <div className="keyboard-full">
          {/* Main Keyboard Section */}
          <div className="keyboard-section main-section">
            {MAIN_KEYBOARD.map((row, rowIndex) => (
              <div key={rowIndex} className="keyboard-row">
                {row.map((key) => (
                  <div
                    key={key.code}
                    className={`key ${isKeyPressed(key) ? 'pressed' : ''} ${isKeyTested(key) ? 'tested' : ''} ${key.spacer ? 'spacer' : ''}`}
                    style={{
                      width: `${key.width * 50 + (key.width - 1) * 4}px`,
                      height: key.height ? `${key.height * 50 + (key.height - 1) * 6}px` : '50px'
                    }}
                  >
                    {key.label}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Navigation Cluster Section */}
          <div className="keyboard-section nav-section">
            {NAV_CLUSTER.map((row, rowIndex) => (
              <div key={rowIndex} className="keyboard-row">
                {row.map((key) => (
                  <div
                    key={key.code}
                    className={`key ${isKeyPressed(key) ? 'pressed' : ''} ${isKeyTested(key) ? 'tested' : ''} ${key.spacer ? 'spacer' : ''}`}
                    style={{
                      width: `${key.width * 50 + (key.width - 1) * 4}px`,
                      height: key.height ? `${key.height * 50 + (key.height - 1) * 6}px` : '50px'
                    }}
                  >
                    {key.label}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Numpad Section - using CSS Grid for tall keys */}
          <div className="keyboard-section numpad-section">
            {/* Spacer to align numpad with number row (skip function row) */}
            <div className="keyboard-row numpad-spacer"></div>
            <div className="numpad-grid">
              {NUMPAD_KEYS.map((key) => (
                <div
                  key={key.code}
                  className={`key ${isKeyPressed(key) ? 'pressed' : ''} ${isKeyTested(key) ? 'tested' : ''}`}
                  style={{
                    gridColumn: key.gridCol,
                    gridRow: key.gridRow,
                  }}
                >
                  {key.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Media/Function Keys Section - for Fn+key combinations */}
      <div className="media-keys-container">
        <h3>Media & Function Keys <span className="fn-note">(Fn + key combinations)</span></h3>
        <div className="media-keys">
          {MEDIA_KEYS.map((row, rowIndex) => (
            <div key={rowIndex} className="keyboard-row">
              {row.map((key) => (
                <div
                  key={key.code}
                  className={`key media-key ${isKeyPressed(key) ? 'pressed' : ''} ${isKeyTested(key) ? 'tested' : ''}`}
                  style={{
                    width: `${key.width * 50 + (key.width - 1) * 4}px`,
                  }}
                >
                  {key.label}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="panels">
        <div className="panel event-panel">
          <h2>Key Event Details</h2>
          {currentEvent ? (
            <div className="event-details">
              {currentEvent.fnCombo && (
                <div className="event-row fn-combo-row">
                  <span className="label">Combination</span>
                  <span className="value fn-combo-value">{currentEvent.fnCombo}</span>
                </div>
              )}
              <div className="event-row">
                <span className="label">event.key</span>
                <span className="value">{currentEvent.key}</span>
              </div>
              <div className="event-row">
                <span className="label">event.code</span>
                <span className="value">{currentEvent.code}</span>
              </div>
              <div className="event-row">
                <span className="label">event.keyCode</span>
                <span className="value">{currentEvent.keyCode}</span>
              </div>
              <div className="modifiers">
                <span className={`modifier-badge ${fnActive || currentEvent.isFnTriggered ? 'active' : ''}`}>Fn</span>
                <span className={`modifier-badge ${modifiers.shift ? 'active' : ''}`}>
                  {keyboardLayout === 'mac' ? '⇧ Shift' : 'Shift'}
                </span>
                <span className={`modifier-badge ${modifiers.ctrl ? 'active' : ''}`}>
                  {keyboardLayout === 'mac' ? '⌃ Control' : 'Ctrl'}
                </span>
                <span className={`modifier-badge ${modifiers.alt ? 'active' : ''}`}>
                  {keyboardLayout === 'mac' ? '⌥ Option' : 'Alt'}
                </span>
                <span className={`modifier-badge ${modifiers.meta ? 'active' : ''}`}>
                  {keyboardLayout === 'mac' ? '⌘ Command' : 'Meta'}
                </span>
              </div>
            </div>
          ) : (
            <p className="no-event">Press a key to see details</p>
          )}
        </div>

        <div className="panel history-panel">
          <div className="history-header">
            <h2>Key History</h2>
            <button onClick={clearHistory} className="clear-btn">Clear</button>
          </div>
          <div className="history-list">
            {history.length > 0 ? (
              history.map((item) => (
                <div key={item.id} className="history-item">
                  <span className="history-key">{item.key}</span>
                  <span className="history-code">{item.code}</span>
                  <span className="history-time">{item.timestamp}</span>
                </div>
              ))
            ) : (
              <p className="no-history">No keys pressed yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default KeyboardTester
