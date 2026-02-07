# Device Test

A comprehensive web application for testing computer input/output devices including keyboard, mouse, microphone, and camera.

**Live Demo:** [https://any-device-test.vercel.app](https://any-device-test.vercel.app)

## Features

### Keyboard Test
- Full 104-key keyboard layout support (ANSI)
- Main keyboard, navigation cluster, and numpad sections
- Fn key combination detection (media keys, brightness, etc.)
- Real-time key press visualization
- Event details display (key code, key name, modifiers)

### Mouse Test
- 5-button mouse support (left, right, middle, back, forward)
- Scroll wheel tracking (up/down/left/right)
- Click counter for each button
- Position tracking and drag detection
- Event history log

### Microphone Test
- Device selection from available microphones
- Real-time volume meter with peak detection
- Waveform visualization
- Frequency spectrum analyzer
- Audio recording with playback
- Download recorded audio

### Camera Test
- Device selection (camera and microphone)
- Live video preview with filters:
  - B&W, Sepia, Invert, Blur, Vivid, Cool, Warm
- Adjustable settings:
  - Zoom, Brightness, Contrast
  - Exposure compensation (if supported by camera)
  - White balance/Color temperature (if supported)
- Studio Mode:
  - Face effects (Subtle, Smooth, Strong)
  - Auto framing
  - Pause/Resume
- Photo capture with download
- Video recording with audio
- Seamless microphone switching during recording (via Web Audio API mixer)
- Mirror toggle

## Tech Stack

- React 18
- Vite
- React Router DOM
- Web APIs: MediaDevices, MediaRecorder, Web Audio API, Canvas

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/dtr9/device-tester.git

# Navigate to project directory
cd device-tester

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Browser Support

- Chrome/Edge (recommended) - full feature support
- Firefox - full feature support
- Safari - partial support (some camera features may be limited)

## Permissions

The application requires the following permissions:
- **Microphone**: For microphone testing and audio recording
- **Camera**: For camera testing and video recording

## License

MIT
