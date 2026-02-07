import { useState, useEffect, useRef, useCallback } from 'react'
import './CameraTester.css'

function CameraTester() {
  // State
  const [hasPermission, setHasPermission] = useState(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [videoDevices, setVideoDevices] = useState([])
  const [audioDevices, setAudioDevices] = useState([])
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('')
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('')
  const [isMirrored, setIsMirrored] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [recordWithAudio, setRecordWithAudio] = useState(true)
  const [recordedVideo, setRecordedVideo] = useState(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [capturedPhotos, setCapturedPhotos] = useState([])
  const [cameraInfo, setCameraInfo] = useState(null)
  const [error, setError] = useState(null)
  const [selectedFilter, setSelectedFilter] = useState('none')
  const [zoom, setZoom] = useState(1)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [audioLevel, setAudioLevel] = useState(0)

  // Advanced camera settings
  const [capabilities, setCapabilities] = useState(null)
  const [exposureCompensation, setExposureCompensation] = useState(0)
  const [colorTemperature, setColorTemperature] = useState(6500)

  // Studio Mode
  const [showStudioMode, setShowStudioMode] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [faceEffect, setFaceEffect] = useState('none') // none, subtle, smooth, strong
  const [expandedStudioOption, setExpandedStudioOption] = useState(null) // 'face' or null

  // Refs
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const recordingCanvasRef = useRef(null)
  const canvasStreamRef = useRef(null)
  const videoStreamRef = useRef(null)
  const audioStreamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const recordingIntervalRef = useRef(null)
  const recordingAnimationRef = useRef(null)
  const drawFilteredFrameRef = useRef(null)

  // Audio monitoring refs
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const audioAnimationRef = useRef(null)

  // Recording audio mixer refs (for seamless mic switching)
  const recordingAudioContextRef = useRef(null)
  const audioDestinationRef = useRef(null)
  const audioSourceNodeRef = useRef(null)

  // Filters
  const filters = [
    { id: 'none', label: 'None', css: '' },
    { id: 'grayscale', label: 'B&W', css: 'grayscale(100%)' },
    { id: 'sepia', label: 'Sepia', css: 'sepia(100%)' },
    { id: 'invert', label: 'Invert', css: 'invert(100%)' },
    { id: 'blur', label: 'Blur', css: 'blur(3px)' },
    { id: 'saturate', label: 'Vivid', css: 'saturate(200%)' },
    { id: 'hue1', label: 'Cool', css: 'hue-rotate(180deg)' },
    { id: 'hue2', label: 'Warm', css: 'hue-rotate(-30deg) saturate(150%)' },
  ]

  // Get available devices
  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = devices.filter(device => device.kind === 'videoinput')
      const audioInputs = devices.filter(device => device.kind === 'audioinput')

      setVideoDevices(videoInputs)
      setAudioDevices(audioInputs)

      // Only set default device if none selected (use functional update to avoid stale closure)
      if (videoInputs.length > 0) {
        setSelectedVideoDevice(prev => prev || videoInputs[0].deviceId)
      }
      if (audioInputs.length > 0) {
        setSelectedAudioDevice(prev => prev || audioInputs[0].deviceId)
      }
    } catch (err) {
      console.error('Error getting devices:', err)
    }
  }, []) // No dependencies - uses functional updates

  // Start audio monitoring
  const startAudioMonitoring = useCallback((stream) => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256

      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

      const updateLevel = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        setAudioLevel(Math.round((average / 255) * 100))
        audioAnimationRef.current = requestAnimationFrame(updateLevel)
      }

      updateLevel()
    } catch (err) {
      console.log('Audio monitoring error:', err)
    }
  }, [])

  // Stop audio monitoring
  const stopAudioMonitoring = useCallback(() => {
    if (audioAnimationRef.current) {
      cancelAnimationFrame(audioAnimationRef.current)
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    setAudioLevel(0)
  }, [])

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null)

      // Get video stream
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: selectedVideoDevice ? { deviceId: { ideal: selectedVideoDevice } } : true
      })
      videoStreamRef.current = videoStream

      // Get audio stream
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: selectedAudioDevice ? { deviceId: { ideal: selectedAudioDevice } } : true
        })
        audioStreamRef.current = audioStream
        startAudioMonitoring(audioStream)
      } catch (audioErr) {
        console.log('Audio access not available:', audioErr)
      }

      setHasPermission(true)
      setIsStreaming(true)

      // Get video track info
      const videoTrack = videoStream.getVideoTracks()[0]
      const settings = videoTrack.getSettings()
      const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}

      setCameraInfo({
        label: videoTrack.label,
        width: settings.width,
        height: settings.height,
        frameRate: settings.frameRate ? Math.round(settings.frameRate) : 'N/A',
        facingMode: settings.facingMode || 'N/A',
        aspectRatio: settings.aspectRatio ? settings.aspectRatio.toFixed(2) : 'N/A',
        hasZoom: !!capabilities.zoom,
        hasTorch: !!capabilities.torch,
      })

      // Get advanced capabilities for Studio Mode
      getAdvancedCapabilities(videoTrack)

      // Refresh device list
      await getDevices()

      // Update selected devices
      if (settings.deviceId) {
        setSelectedVideoDevice(settings.deviceId)
      }
    } catch (err) {
      console.error('Error accessing camera:', err.name, err.message)
      setHasPermission(false)

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera access was denied. Please click the camera icon in your browser\'s address bar to allow access.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found. Please check that your camera is connected and not disabled in Windows Settings > Privacy > Camera.')
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is in use by another application. Please close other apps using the camera and try again.')
      } else {
        setError(`Could not access camera: ${err.message || err.name || 'Unknown error'}`)
      }
    }
  }, [selectedVideoDevice, selectedAudioDevice, getDevices, startAudioMonitoring])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop())
      videoStreamRef.current = null
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop())
      audioStreamRef.current = null
    }

    stopAudioMonitoring()

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsStreaming(false)
    setCameraInfo(null)
  }, [stopAudioMonitoring])

  // Switch video device while streaming
  const switchVideoDevice = useCallback(async (deviceId) => {
    if (!isStreaming) {
      setSelectedVideoDevice(deviceId)
      return
    }

    try {
      // Stop current video stream
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop())
      }

      // Get new video stream
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      })
      videoStreamRef.current = videoStream

      // Update video element
      if (videoRef.current) {
        videoRef.current.srcObject = videoStream
        await videoRef.current.play()
      }

      // Update camera info
      const videoTrack = videoStream.getVideoTracks()[0]
      const settings = videoTrack.getSettings()

      setCameraInfo(prev => ({
        ...prev,
        label: videoTrack.label,
        width: settings.width,
        height: settings.height,
        frameRate: settings.frameRate ? Math.round(settings.frameRate) : 'N/A',
      }))

      setSelectedVideoDevice(deviceId)
    } catch (err) {
      console.error('Error switching camera:', err)
      setError('Could not switch camera: ' + err.message)
    }
  }, [isStreaming])

  // Switch audio device while streaming (seamless switching during recording via audio mixer)
  const switchAudioDevice = useCallback(async (deviceId) => {
    if (!isStreaming) {
      setSelectedAudioDevice(deviceId)
      return
    }

    try {
      // If recording with audio, swap the audio source in the mixer (no need to stop recorder!)
      if (isRecording && recordWithAudio && recordingAudioContextRef.current && audioDestinationRef.current) {
        // Disconnect old source
        if (audioSourceNodeRef.current) {
          audioSourceNodeRef.current.disconnect()
        }
      }

      // Stop current audio stream
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
      }
      stopAudioMonitoring()

      // Get new audio stream
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
      })
      audioStreamRef.current = audioStream
      startAudioMonitoring(audioStream)

      // If recording with audio, connect new source to the mixer
      if (isRecording && recordWithAudio && recordingAudioContextRef.current && audioDestinationRef.current) {
        const newSource = recordingAudioContextRef.current.createMediaStreamSource(audioStream)
        newSource.connect(audioDestinationRef.current)
        audioSourceNodeRef.current = newSource
      }

      setSelectedAudioDevice(deviceId)
      setError(null)
    } catch (err) {
      console.error('Error switching microphone:', err)
      setError('Could not switch microphone: ' + err.message)
    }
  }, [isStreaming, isRecording, recordWithAudio, stopAudioMonitoring, startAudioMonitoring])

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    if (isMirrored) {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }

    const filterCss = filters.find(f => f.id === selectedFilter)?.css || ''
    ctx.filter = `${filterCss} brightness(${brightness}%) contrast(${contrast}%)`

    ctx.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/png')
    setCapturedPhotos(prev => [{
      id: Date.now(),
      url: dataUrl,
      timestamp: new Date().toLocaleTimeString()
    }, ...prev].slice(0, 10))

    // Flash effect
    if (videoRef.current.parentElement) {
      videoRef.current.parentElement.classList.add('flash')
      setTimeout(() => {
        videoRef.current?.parentElement?.classList.remove('flash')
      }, 200)
    }
  }, [isMirrored, selectedFilter, brightness, contrast, filters])

  // Draw video frame with filters to recording canvas
  // This function is stored in a ref so the recording loop always gets latest values
  const drawFilteredFrame = useCallback(() => {
    if (!videoRef.current || !recordingCanvasRef.current) return

    const video = videoRef.current
    const canvas = recordingCanvasRef.current
    const ctx = canvas.getContext('2d')

    // Set canvas size to match video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Save context state
    ctx.save()

    // Apply mirror transform
    if (isMirrored) {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }

    // Apply zoom (scale from center)
    if (zoom !== 1) {
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      ctx.translate(centerX, centerY)
      ctx.scale(zoom, zoom)
      ctx.translate(-centerX, -centerY)
    }

    // Build filter string for canvas context
    const filterParts = []

    // Add selected filter (B&W, Sepia, etc.)
    const filterCss = filters.find(f => f.id === selectedFilter)?.css || ''
    if (filterCss) filterParts.push(filterCss)

    // Add face effect
    if (faceEffect === 'subtle') filterParts.push('saturate(105%)')
    else if (faceEffect === 'smooth') filterParts.push('saturate(110%)')
    else if (faceEffect === 'strong') filterParts.push('saturate(120%)')

    // Add brightness and contrast (only if not default)
    if (brightness !== 100) filterParts.push(`brightness(${brightness}%)`)
    if (contrast !== 100) filterParts.push(`contrast(${contrast}%)`)

    ctx.filter = filterParts.length > 0 ? filterParts.join(' ') : 'none'

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Restore context
    ctx.restore()
  }, [isMirrored, zoom, selectedFilter, faceEffect, brightness, contrast, filters])

  // Keep ref updated with latest drawFilteredFrame function
  useEffect(() => {
    drawFilteredFrameRef.current = drawFilteredFrame
  }, [drawFilteredFrame])

  // Start recording with filters
  const startRecording = useCallback(() => {
    if (!videoRef.current) return

    recordedChunksRef.current = []
    setRecordingDuration(0)
    setRecordedVideo(null)

    // Create recording canvas if not exists
    if (!recordingCanvasRef.current) {
      recordingCanvasRef.current = document.createElement('canvas')
    }

    const canvas = recordingCanvasRef.current
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480

    // Start drawing frames to canvas using ref (so filter changes are captured)
    const drawFrame = () => {
      if (drawFilteredFrameRef.current) {
        drawFilteredFrameRef.current()
      }
      recordingAnimationRef.current = requestAnimationFrame(drawFrame)
    }
    drawFrame()

    // Get canvas stream and store reference
    const canvasStream = canvas.captureStream(30)
    canvasStreamRef.current = canvasStream

    // Set up audio mixer for seamless mic switching
    let combinedStream
    if (recordWithAudio && audioStreamRef.current) {
      // Create audio context and destination for mixing
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      recordingAudioContextRef.current = audioCtx

      // Create destination that provides a stream
      const destination = audioCtx.createMediaStreamDestination()
      audioDestinationRef.current = destination

      // Connect current mic to destination
      const source = audioCtx.createMediaStreamSource(audioStreamRef.current)
      source.connect(destination)
      audioSourceNodeRef.current = source

      // Combine canvas video with audio destination stream
      const audioTracks = destination.stream.getAudioTracks()
      combinedStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks])
    } else {
      combinedStream = canvasStream
    }

    // Create MediaRecorder
    let mimeType = 'video/webm;codecs=vp9,opus'
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm'
    }

    const mediaRecorder = new MediaRecorder(combinedStream, { mimeType })
    mediaRecorderRef.current = mediaRecorder

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      setRecordedVideo(url)

      // Clean up audio context
      if (recordingAudioContextRef.current) {
        recordingAudioContextRef.current.close()
        recordingAudioContextRef.current = null
        audioDestinationRef.current = null
        audioSourceNodeRef.current = null
      }
    }

    mediaRecorder.start(100) // Collect data every 100ms
    setIsRecording(true)

    recordingIntervalRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1)
    }, 1000)
  }, [recordWithAudio])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Stop canvas animation
      if (recordingAnimationRef.current) {
        cancelAnimationFrame(recordingAnimationRef.current)
        recordingAnimationRef.current = null
      }

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

  // Delete photo
  const deletePhoto = (id) => {
    setCapturedPhotos(prev => prev.filter(p => p.id !== id))
  }

  // Download photo
  const downloadPhoto = (photo) => {
    const link = document.createElement('a')
    link.href = photo.url
    link.download = `photo-${photo.id}.png`
    link.click()
  }

  // Get video style with filters
  const getVideoStyle = () => {
    const filterCss = filters.find(f => f.id === selectedFilter)?.css || ''

    // Face effect styles (simulated with CSS)
    let faceEffectCss = ''
    if (faceEffect === 'subtle') {
      faceEffectCss = 'contrast(102%) saturate(105%)'
    } else if (faceEffect === 'smooth') {
      faceEffectCss = 'contrast(105%) saturate(110%) brightness(102%)'
    } else if (faceEffect === 'strong') {
      faceEffectCss = 'contrast(110%) saturate(120%) brightness(105%)'
    }

    const allFilters = [filterCss, faceEffectCss, `brightness(${brightness}%)`, `contrast(${contrast}%)`]
      .filter(Boolean)
      .join(' ')

    return {
      transform: `scaleX(${isMirrored ? -1 : 1}) scale(${zoom})`,
      filter: allFilters,
    }
  }

  // Toggle video pause
  const togglePause = useCallback(() => {
    if (!videoRef.current) return

    if (isPaused) {
      videoRef.current.play()
      setIsPaused(false)
    } else {
      videoRef.current.pause()
      setIsPaused(true)
    }
  }, [isPaused])

  // Get advanced camera capabilities
  const getAdvancedCapabilities = useCallback((videoTrack) => {
    if (!videoTrack.getCapabilities) return null

    const caps = videoTrack.getCapabilities()
    setCapabilities(caps)

    // Get current settings
    const settings = videoTrack.getSettings()
    if (settings.exposureCompensation !== undefined) {
      setExposureCompensation(settings.exposureCompensation)
    }
    if (settings.colorTemperature !== undefined) {
      setColorTemperature(settings.colorTemperature)
    }

    return caps
  }, [])

  // Apply camera setting
  const applyCameraSetting = useCallback(async (setting, value) => {
    if (!videoStreamRef.current) return

    const videoTrack = videoStreamRef.current.getVideoTracks()[0]
    if (!videoTrack) return

    try {
      const constraints = { advanced: [{ [setting]: value }] }
      await videoTrack.applyConstraints(constraints)
    } catch (err) {
      console.log(`Could not apply ${setting}:`, err)
    }
  }, [])

  // Reset all adjustments
  const resetAllAdjustments = useCallback(async () => {
    // Reset visual filters
    setZoom(1)
    setBrightness(100)
    setContrast(100)
    setSelectedFilter('none')
    setIsMirrored(true)

    // Reset camera hardware settings
    if (videoStreamRef.current && capabilities) {
      const videoTrack = videoStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        try {
          const resetConstraints = { advanced: [{}] }

          if (capabilities.exposureCompensation) {
            const defaultExp = (capabilities.exposureCompensation.min + capabilities.exposureCompensation.max) / 2
            resetConstraints.advanced[0].exposureCompensation = defaultExp
            setExposureCompensation(defaultExp)
          }
          if (capabilities.colorTemperature) {
            resetConstraints.advanced[0].colorTemperature = 6500
            setColorTemperature(6500)
          }

          await videoTrack.applyConstraints(resetConstraints)
        } catch (err) {
          console.log('Could not reset camera settings:', err)
        }
      }
    }
  }, [capabilities])

  // Connect stream to video element when both are available
  useEffect(() => {
    if (isStreaming && videoStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = videoStreamRef.current
      videoRef.current.play().catch(err => console.log('Play error:', err))
    }
  }, [isStreaming])

  // Initialize on mount only
  useEffect(() => {
    getDevices()
    navigator.mediaDevices.addEventListener('devicechange', getDevices)

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getDevices)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup streams on unmount
  useEffect(() => {
    return () => {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (recordingAnimationRef.current) {
        cancelAnimationFrame(recordingAnimationRef.current)
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [])

  return (
    <div className="camera-tester">
      <h1>Camera Test</h1>
      <p className="subtitle">Test your camera, capture photos, and record videos with audio.</p>

      {!isStreaming ? (
        <div className="start-section">
          {videoDevices.length > 0 && (
            <div className="device-selector">
              <label>Select Camera:</label>
              <select
                value={selectedVideoDevice}
                onChange={(e) => setSelectedVideoDevice(e.target.value)}
              >
                {videoDevices.map((device, index) => (
                  <option key={device.deviceId || index} value={device.deviceId}>
                    {device.label || `Camera ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {videoDevices.length === 0 && hasPermission === null && (
            <p className="permission-note">
              Click the button below to allow camera access and detect available cameras.
            </p>
          )}

          <button className="start-btn" onClick={startCamera}>
            <span className="camera-icon">📷</span>
            Start Camera Test
          </button>

          {error && (
            <div className="error-message">
              <span>⚠️</span> {error}
            </div>
          )}

          {hasPermission === false && (
            <div className="permission-help">
              <h4>Camera Access Issue</h4>
              <p><strong>Check these settings:</strong></p>
              <ol>
                <li><strong>Browser:</strong> Click the camera/lock icon in the address bar and allow camera access</li>
                <li><strong>Windows Settings:</strong> Go to Settings → Privacy & Security → Camera → Make sure "Camera access" and "Let desktop apps access your camera" are ON</li>
                <li><strong>Other apps:</strong> Close any other apps that might be using the camera (Zoom, Teams, etc.)</li>
              </ol>
            </div>
          )}
        </div>
      ) : (
        <div className="testing-section">
          {/* Controls Bar */}
          <div className="controls-bar">
            <div className="device-info">
              <span className="device-label">{cameraInfo?.label || 'Camera'}</span>
              <span className="streaming-indicator">
                <span className="pulse"></span>
                Live
              </span>
            </div>
            <div className="control-buttons">
              <button className="capture-btn" onClick={capturePhoto}>
                <span>📸</span> Capture
              </button>
              {!isRecording ? (
                <button className="record-btn" onClick={startRecording}>
                  <span>●</span> Record
                </button>
              ) : (
                <button className="record-btn recording" onClick={stopRecording}>
                  <span>■</span> Stop ({formatDuration(recordingDuration)})
                </button>
              )}
              <button className="stop-btn" onClick={stopCamera}>
                Stop Camera
              </button>
            </div>
          </div>

          <div className="camera-content">
            {/* Video Preview */}
            <div className="preview-section">
              <div className="video-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={getVideoStyle()}
                  onLoadedMetadata={(e) => {
                    e.target.play().catch(err => console.log('Play error:', err))
                  }}
                />
                {isRecording && (
                  <div className="recording-indicator">
                    <span className="rec-dot"></span>
                    REC {formatDuration(recordingDuration)}
                  </div>
                )}

                {/* Paused indicator */}
                {isPaused && (
                  <div className="paused-indicator">
                    <span>⏸</span> PAUSED
                  </div>
                )}
              </div>

              {/* Studio Mode Section - Below Video */}
              <div className="studio-mode-section">
                <div className="studio-mode-header">
                  <span>Studio mode</span>
                  <button
                    className="studio-collapse-btn"
                    onClick={() => setShowStudioMode(!showStudioMode)}
                  >
                    {showStudioMode ? '▼' : '▶'}
                  </button>
                </div>
                {showStudioMode && (
                  <div className="studio-mode-content">
                    <div className="studio-mode-options">
                      <button
                        className={`studio-option ${faceEffect !== 'none' ? 'active' : ''} ${expandedStudioOption === 'face' ? 'expanded' : ''}`}
                        onClick={() => setExpandedStudioOption(expandedStudioOption === 'face' ? null : 'face')}
                      >
                        <span className="studio-option-icon">😊</span>
                        <span className="studio-option-label">Face effects</span>
                      </button>
                      <button
                        className={`studio-option ${zoom > 1 ? 'active' : ''}`}
                        onClick={() => setZoom(zoom === 1 ? 1.2 : 1)}
                        title="Auto-center and zoom"
                      >
                        <span className="studio-option-icon">⛶</span>
                        <span className="studio-option-label">Auto framing</span>
                      </button>
                      <button
                        className={`studio-option ${isPaused ? 'active' : ''}`}
                        onClick={togglePause}
                      >
                        <span className="studio-option-icon">{isPaused ? '▶' : '⏸'}</span>
                        <span className="studio-option-label">{isPaused ? 'Resume' : 'Pause'}</span>
                      </button>
                    </div>

                    {/* Face Effects Sub-options */}
                    {expandedStudioOption === 'face' && (
                      <div className="studio-sub-options">
                        <span className="sub-options-label">Face effects</span>
                        <div className="sub-options-grid">
                          <button
                            className={`sub-option ${faceEffect === 'none' ? 'active' : ''}`}
                            onClick={() => setFaceEffect('none')}
                          >
                            Off
                          </button>
                          <button
                            className={`sub-option ${faceEffect === 'subtle' ? 'active' : ''}`}
                            onClick={() => setFaceEffect('subtle')}
                          >
                            Subtle
                          </button>
                          <button
                            className={`sub-option ${faceEffect === 'smooth' ? 'active' : ''}`}
                            onClick={() => setFaceEffect('smooth')}
                          >
                            Smooth
                          </button>
                          <button
                            className={`sub-option ${faceEffect === 'strong' ? 'active' : ''}`}
                            onClick={() => setFaceEffect('strong')}
                          >
                            Strong
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {/* Side Panels */}
            <div className="side-panels">
              {/* Device Selection Panel */}
              <div className="panel device-panel">
                <h3>Device Selection</h3>
                <div className="device-select-group">
                  <label>Camera:</label>
                  <select
                    value={selectedVideoDevice}
                    onChange={(e) => switchVideoDevice(e.target.value)}
                  >
                    {videoDevices.map((device, index) => (
                      <option key={device.deviceId || index} value={device.deviceId}>
                        {device.label || `Camera ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="device-select-group">
                  <label>Microphone:</label>
                  <select
                    value={selectedAudioDevice}
                    onChange={(e) => switchAudioDevice(e.target.value)}
                  >
                    {audioDevices.map((device, index) => (
                      <option key={device.deviceId || index} value={device.deviceId}>
                        {device.label || `Microphone ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Audio Level */}
                <div className="audio-level-container">
                  <label>Mic Level:</label>
                  <div className="audio-level-bar">
                    <div
                      className="audio-level-fill"
                      style={{ width: `${audioLevel}%` }}
                    />
                  </div>
                  <span className="audio-level-value">{audioLevel}%</span>
                </div>
              </div>

              {/* Recording Options */}
              <div className="panel recording-panel">
                <h3>Recording Options</h3>
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={recordWithAudio}
                    onChange={(e) => setRecordWithAudio(e.target.checked)}
                    disabled={isRecording}
                  />
                  <span>Record with audio</span>
                </label>
                {recordWithAudio && audioLevel > 0 && (
                  <p className="audio-status">🎤 Microphone active</p>
                )}
                {recordWithAudio && audioLevel === 0 && (
                  <p className="audio-status warning">⚠️ No audio detected</p>
                )}
              </div>

              {/* Filters & Adjustments Panel */}
              <div className="panel filters-panel">
                <h3>Filters & Adjustments</h3>

                {/* Filter Buttons */}
                <div className="filter-grid">
                  {filters.map(filter => (
                    <button
                      key={filter.id}
                      className={`filter-btn ${selectedFilter === filter.id ? 'active' : ''}`}
                      onClick={() => setSelectedFilter(filter.id)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Adjustments */}
                <div className="adjustments-section">
                  <div className="adjustment">
                    <label>Zoom: {zoom.toFixed(1)}x</label>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="adjustment">
                    <label>Brightness: {brightness}%</label>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={brightness}
                      onChange={(e) => setBrightness(parseInt(e.target.value))}
                    />
                  </div>
                  <div className="adjustment">
                    <label>Contrast: {contrast}%</label>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={contrast}
                      onChange={(e) => setContrast(parseInt(e.target.value))}
                    />
                  </div>

                  {/* Hardware Exposure (if camera supports it) */}
                  {capabilities?.exposureCompensation && (
                    <div className="adjustment">
                      <label>Exposure: {exposureCompensation.toFixed(1)}</label>
                      <input
                        type="range"
                        min={capabilities.exposureCompensation.min}
                        max={capabilities.exposureCompensation.max}
                        step={capabilities.exposureCompensation.step || 0.1}
                        value={exposureCompensation}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          setExposureCompensation(val)
                          applyCameraSetting('exposureCompensation', val)
                        }}
                      />
                    </div>
                  )}

                  {/* Hardware White Balance (if camera supports it) */}
                  {capabilities?.colorTemperature && (
                    <div className="adjustment">
                      <label>White Balance: {colorTemperature}K</label>
                      <input
                        type="range"
                        min={capabilities.colorTemperature.min}
                        max={capabilities.colorTemperature.max}
                        step={capabilities.colorTemperature.step || 100}
                        value={colorTemperature}
                        onChange={(e) => {
                          const val = parseInt(e.target.value)
                          setColorTemperature(val)
                          applyCameraSetting('colorTemperature', val)
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="quick-actions">
                  <button
                    className={`toggle-btn ${isMirrored ? 'active' : ''}`}
                    onClick={() => setIsMirrored(!isMirrored)}
                  >
                    🪞 Mirror
                  </button>
                  <button className="reset-btn" onClick={resetAllAdjustments}>
                    ↺ Reset
                  </button>
                </div>
              </div>

              {/* Camera Info */}
              <div className="panel info-panel">
                <h3>Camera Information</h3>
                {cameraInfo && (
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Resolution</span>
                      <span className="info-value">{cameraInfo.width} x {cameraInfo.height}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Frame Rate</span>
                      <span className="info-value">{cameraInfo.frameRate} fps</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Aspect Ratio</span>
                      <span className="info-value">{cameraInfo.aspectRatio}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Facing</span>
                      <span className="info-value">{cameraInfo.facingMode}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Recorded Video */}
              {recordedVideo && (
                <div className="panel video-panel">
                  <h3>Recorded Video</h3>
                  <video controls src={recordedVideo} className="recorded-video" />
                  <a
                    href={recordedVideo}
                    download={`video-${Date.now()}.webm`}
                    className="download-btn"
                  >
                    Download Video
                  </a>
                </div>
              )}

              {/* Captured Photos */}
              <div className="panel photos-panel">
                <h3>Captured Photos ({capturedPhotos.length})</h3>
                {capturedPhotos.length > 0 ? (
                  <div className="photos-grid">
                    {capturedPhotos.map(photo => (
                      <div key={photo.id} className="photo-item">
                        <img src={photo.url} alt={`Captured at ${photo.timestamp}`} />
                        <div className="photo-overlay">
                          <button onClick={() => downloadPhoto(photo)} title="Download">
                            ⬇
                          </button>
                          <button onClick={() => deletePhoto(photo.id)} title="Delete">
                            ✕
                          </button>
                        </div>
                        <span className="photo-time">{photo.timestamp}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-photos">No photos captured yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CameraTester
