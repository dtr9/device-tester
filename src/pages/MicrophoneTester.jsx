import { useState, useEffect, useRef, useCallback } from 'react'
import './MicrophoneTester.css'

function MicrophoneTester() {
  // State
  const [hasPermission, setHasPermission] = useState(null)
  const [isListening, setIsListening] = useState(false)
  const [audioDevices, setAudioDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState('')
  const [volume, setVolume] = useState(0)
  const [peakVolume, setPeakVolume] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedAudio, setRecordedAudio] = useState(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [audioInfo, setAudioInfo] = useState(null)
  const [error, setError] = useState(null)

  // Refs
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const animationFrameRef = useRef(null)
  const waveformCanvasRef = useRef(null)
  const spectrumCanvasRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const recordingIntervalRef = useRef(null)
  const peakResetTimeoutRef = useRef(null)

  // Get available audio devices
  const getAudioDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter(device => device.kind === 'audioinput')
      setAudioDevices(audioInputs)
      if (audioInputs.length > 0 && !selectedDevice) {
        setSelectedDevice(audioInputs[0].deviceId)
      }
    } catch (err) {
      console.error('Error getting devices:', err)
    }
  }, [selectedDevice])

  // Request microphone permission and start listening
  const startListening = useCallback(async () => {
    try {
      setError(null)

      const constraints = {
        audio: selectedDevice ? { deviceId: { exact: selectedDevice } } : true
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      mediaStreamRef.current = stream

      setHasPermission(true)
      setIsListening(true)

      // Get audio track info
      const audioTrack = stream.getAudioTracks()[0]
      const settings = audioTrack.getSettings()
      setAudioInfo({
        label: audioTrack.label,
        sampleRate: settings.sampleRate || 'N/A',
        channelCount: settings.channelCount || 'N/A',
        autoGainControl: settings.autoGainControl ? 'On' : 'Off',
        echoCancellation: settings.echoCancellation ? 'On' : 'Off',
        noiseSuppression: settings.noiseSuppression ? 'On' : 'Off',
      })

      // Set up audio context and analyser
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 2048
      analyserRef.current.smoothingTimeConstant = 0.8

      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      // Start visualization
      visualize()

      // Refresh device list
      getAudioDevices()
    } catch (err) {
      console.error('Error accessing microphone:', err)
      setHasPermission(false)
      setError(err.message || 'Could not access microphone')
    }
  }, [selectedDevice, getAudioDevices])

  // Stop listening
  const stopListening = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    setIsListening(false)
    setVolume(0)
    setPeakVolume(0)

    // Clear canvases
    clearCanvas(waveformCanvasRef.current)
    clearCanvas(spectrumCanvasRef.current)
  }, [])

  // Visualize audio
  const visualize = useCallback(() => {
    if (!analyserRef.current) return

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const frequencyData = new Uint8Array(bufferLength)

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw)

      // Get time domain data for waveform
      analyser.getByteTimeDomainData(dataArray)

      // Get frequency data for spectrum
      analyser.getByteFrequencyData(frequencyData)

      // Calculate volume (RMS)
      let sum = 0
      for (let i = 0; i < bufferLength; i++) {
        const value = (dataArray[i] - 128) / 128
        sum += value * value
      }
      const rms = Math.sqrt(sum / bufferLength)
      const volumePercent = Math.min(100, Math.round(rms * 300))
      setVolume(volumePercent)

      // Update peak volume
      if (volumePercent > peakVolume) {
        setPeakVolume(volumePercent)
        // Reset peak after 2 seconds
        if (peakResetTimeoutRef.current) {
          clearTimeout(peakResetTimeoutRef.current)
        }
        peakResetTimeoutRef.current = setTimeout(() => {
          setPeakVolume(0)
        }, 2000)
      }

      // Draw waveform
      drawWaveform(dataArray, bufferLength)

      // Draw spectrum
      drawSpectrum(frequencyData, bufferLength)
    }

    draw()
  }, [peakVolume])

  // Draw waveform
  const drawWaveform = (dataArray, bufferLength) => {
    const canvas = waveformCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, width, height)

    ctx.lineWidth = 2
    ctx.strokeStyle = '#3b82f6'
    ctx.beginPath()

    const sliceWidth = width / bufferLength
    let x = 0

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0
      const y = (v * height) / 2

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    ctx.lineTo(width, height / 2)
    ctx.stroke()

    // Draw center line
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
    ctx.stroke()
  }

  // Draw spectrum
  const drawSpectrum = (frequencyData, bufferLength) => {
    const canvas = spectrumCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, width, height)

    const barCount = 64
    const barWidth = width / barCount
    const step = Math.floor(bufferLength / barCount)

    for (let i = 0; i < barCount; i++) {
      const value = frequencyData[i * step]
      const barHeight = (value / 255) * height

      // Gradient color based on height
      const hue = 200 + (value / 255) * 60
      ctx.fillStyle = `hsl(${hue}, 80%, 50%)`

      ctx.fillRect(
        i * barWidth,
        height - barHeight,
        barWidth - 1,
        barHeight
      )
    }
  }

  // Clear canvas
  const clearCanvas = (canvas) => {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // Start recording
  const startRecording = useCallback(() => {
    if (!mediaStreamRef.current) return

    recordedChunksRef.current = []
    setRecordingDuration(0)
    setRecordedAudio(null)

    const mediaRecorder = new MediaRecorder(mediaStreamRef.current)
    mediaRecorderRef.current = mediaRecorder

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
      const url = URL.createObjectURL(blob)
      setRecordedAudio(url)
    }

    mediaRecorder.start()
    setIsRecording(true)

    // Track duration
    recordingIntervalRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1)
    }, 1000)
  }, [])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }, [isRecording])

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Get volume level color
  const getVolumeColor = (vol) => {
    if (vol < 30) return '#22c55e'
    if (vol < 70) return '#eab308'
    return '#ef4444'
  }

  // Initialize
  useEffect(() => {
    getAudioDevices()

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', getAudioDevices)

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getAudioDevices)
      stopListening()
    }
  }, [getAudioDevices, stopListening])

  // Handle device change while listening
  useEffect(() => {
    if (isListening && selectedDevice) {
      stopListening()
      startListening()
    }
  }, [selectedDevice])

  return (
    <div className="microphone-tester">
      <h1>Microphone Test</h1>
      <p className="subtitle">Test your microphone input, visualize audio, and record samples.</p>

      {/* Permission / Start Section */}
      {!isListening ? (
        <div className="start-section">
          <div className="device-selector">
            <label>Select Microphone:</label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              disabled={audioDevices.length === 0}
            >
              {audioDevices.length === 0 ? (
                <option>No microphones found</option>
              ) : (
                audioDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))
              )}
            </select>
          </div>

          <button className="start-btn" onClick={startListening}>
            <span className="mic-icon">🎤</span>
            Start Microphone Test
          </button>

          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          {hasPermission === false && (
            <div className="permission-help">
              <h4>Microphone Access Denied</h4>
              <p>Please allow microphone access in your browser settings to use this tester.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="testing-section">
          {/* Controls */}
          <div className="controls-bar">
            <div className="device-info">
              <span className="device-label">{audioInfo?.label || 'Microphone'}</span>
              <span className="listening-indicator">
                <span className="pulse"></span>
                Listening
              </span>
            </div>
            <div className="control-buttons">
              {!isRecording ? (
                <button className="record-btn" onClick={startRecording}>
                  <span>●</span> Record
                </button>
              ) : (
                <button className="record-btn recording" onClick={stopRecording}>
                  <span>■</span> Stop ({formatDuration(recordingDuration)})
                </button>
              )}
              <button className="stop-btn" onClick={stopListening}>
                Stop Test
              </button>
            </div>
          </div>

          <div className="visualizations">
            {/* Volume Meter */}
            <div className="panel volume-panel">
              <h3>Volume Level</h3>
              <div className="volume-meter">
                <div className="meter-container">
                  <div
                    className="meter-fill"
                    style={{
                      height: `${volume}%`,
                      backgroundColor: getVolumeColor(volume)
                    }}
                  />
                  <div
                    className="peak-marker"
                    style={{ bottom: `${peakVolume}%` }}
                  />
                </div>
                <div className="meter-labels">
                  <span>100%</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                  <span>0%</span>
                </div>
              </div>
              <div className="volume-value">
                <span className="current">{volume}%</span>
                <span className="peak">Peak: {peakVolume}%</span>
              </div>
            </div>

            {/* Waveform */}
            <div className="panel waveform-panel">
              <h3>Waveform</h3>
              <canvas
                ref={waveformCanvasRef}
                width={600}
                height={150}
                className="visualization-canvas"
              />
            </div>

            {/* Spectrum */}
            <div className="panel spectrum-panel">
              <h3>Frequency Spectrum</h3>
              <canvas
                ref={spectrumCanvasRef}
                width={600}
                height={150}
                className="visualization-canvas"
              />
            </div>

            {/* Audio Info */}
            <div className="panel info-panel">
              <h3>Audio Information</h3>
              {audioInfo && (
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Device</span>
                    <span className="info-value">{audioInfo.label}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Sample Rate</span>
                    <span className="info-value">{audioInfo.sampleRate} Hz</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Channels</span>
                    <span className="info-value">{audioInfo.channelCount}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Auto Gain</span>
                    <span className="info-value">{audioInfo.autoGainControl}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Echo Cancel</span>
                    <span className="info-value">{audioInfo.echoCancellation}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Noise Suppress</span>
                    <span className="info-value">{audioInfo.noiseSuppression}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Recording Playback */}
            {recordedAudio && (
              <div className="panel playback-panel">
                <h3>Recording Playback</h3>
                <audio controls src={recordedAudio} className="audio-player" />
                <div className="playback-actions">
                  <a
                    href={recordedAudio}
                    download={`recording-${Date.now()}.webm`}
                    className="download-btn"
                  >
                    Download Recording
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MicrophoneTester
