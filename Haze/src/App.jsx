import { useEffect, useRef, useState } from 'react'
import malaysiaStates from './assets/malaysia-states.json'
import malaysiaScene from './assets/klcc-sunrise.jpg'
import tamanNegaraCanopy from './assets/taman-negara-canopy.jpg'
import mistyForest from './assets/misty-forest-unsplash.jpg'
import marbleTexture from './assets/marble-texture.png'
import sumatraHaze from './assets/sumatra-haze-nasa.jpg'
import './App.css'

const hazeLevels = [
  { name: 'Clear', blur: 0, veil: 0, color: '#31865c' },
  { name: 'Light', blur: 3, veil: 0.28, color: '#74a942' },
  { name: 'Moderate', blur: 7, veil: 0.52, color: '#d1a431' },
  { name: 'Dense', blur: 12, veil: 0.76, color: '#c9584c' },
]

const tickerPhrases = ['CHECK THE AIR', 'PROTECT YOUR PEOPLE', 'BREATHING ROOM FOR ALL', 'STAY SAFE']

function AirMark() {
  return (
    <svg className="brand-mark" viewBox="-2 -2 36 32" fill="none" aria-hidden="true">
      <path d="M2 7h20a4 4 0 1 0-3.7-5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M2 14h25a3 3 0 1 0-2.8-4.1" stroke="var(--orange)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M2 21h17a4 4 0 1 1-3.7 5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

const malaysiaCities = [
  { name: 'George Town', region: 'Penang', latitude: 5.4141, longitude: 100.3288, labelSide: 'right' },
  { name: 'Ipoh', region: 'Perak', latitude: 4.5975, longitude: 101.0901, labelSide: 'right' },
  { name: 'Kuala Lumpur', region: 'Kuala Lumpur', latitude: 3.139, longitude: 101.6869, labelSide: 'left' },
  { name: 'Kuantan', region: 'Pahang', latitude: 3.8077, longitude: 103.326, labelSide: 'right' },
  { name: 'Johor Bahru', region: 'Johor', latitude: 1.4927, longitude: 103.7414, labelSide: 'right' },
  { name: 'Kuching', region: 'Sarawak', latitude: 1.5533, longitude: 110.3592, labelSide: 'right' },
  { name: 'Kota Kinabalu', region: 'Sabah', latitude: 5.9804, longitude: 116.0735, labelSide: 'left' },
]

function getMapPosition({ longitude, latitude }) {
  const { width, height, paddingX, paddingY, west, east, south, north } = malaysiaStates.projection
  const x = paddingX + ((longitude - west) / (east - west)) * (width - 2 * paddingX)
  const y = paddingY + ((north - latitude) / (north - south)) * (height - 2 * paddingY)
  return { left: `${(x / width) * 100}%`, top: `${(y / height) * 100}%` }
}

const getAirQualityLevel = (pm25) => {
  if (pm25 <= 5) return 'Clear'
  if (pm25 <= 15) return 'Light'
  if (pm25 <= 35) return 'Moderate'
  return 'Dense'
}

async function fetchMalaysiaReadings(signal) {
  const params = new URLSearchParams({
    latitude: malaysiaCities.map(({ latitude }) => latitude).join(','),
    longitude: malaysiaCities.map(({ longitude }) => longitude).join(','),
    current: 'pm2_5,pm10',
    timezone: 'Asia/Kuala_Lumpur',
  })
  const response = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`, { signal })
  if (!response.ok) throw new Error(`Air quality service returned ${response.status}.`)

  const payload = await response.json()
  const readings = Array.isArray(payload) ? payload : [payload]
  if (readings.length !== malaysiaCities.length) throw new Error('Air quality service returned an incomplete set of locations.')

  return readings.map(({ current }, index) => {
    if (current?.pm2_5 == null || current?.pm10 == null || !current?.time) {
      throw new Error(`Air quality reading is unavailable for ${malaysiaCities[index].name}.`)
    }
    const pm25 = Number(current?.pm2_5)
    const pm10 = Number(current?.pm10)
    if (!Number.isFinite(pm25) || !Number.isFinite(pm10) || !current?.time) {
      throw new Error(`Air quality reading is unavailable for ${malaysiaCities[index].name}.`)
    }
    return { pm25, pm10, time: current.time, level: getAirQualityLevel(pm25) }
  })
}

const steps = [
  { number: '01', title: 'Particles enter the air', text: 'Smoke from fires, traffic, and industry releases tiny particles into the air.', icon: '↗', tone: 'leaf' },
  { number: '02', title: 'Weather traps the smoke', text: 'Light winds and dry conditions can stop pollution from dispersing.', icon: '≈', tone: 'sun' },
  { number: '03', title: 'Haze reduces visibility', text: 'Particles scatter light and make distant places harder to see. Check air-quality readings, not just the sky.', icon: '◌', tone: 'sky' },
]

const protectionSteps = [
  {
    number: '01',
    label: 'WHERE TO BE',
    title: 'Stay in cleaner air',
    text: 'On hazy days, close windows. Use recirculating air-conditioning or a HEPA air cleaner if available.',
    art: 'windows',
  },
  {
    number: '02',
    label: 'IF YOU GO OUT',
    title: 'Limit time outdoors',
    text: 'If you must go out, a well-fitting N95 can reduce fine-particle exposure. Cloth and loose surgical masks offer less protection.',
    art: 'mask',
  },
  {
    number: '03',
    label: 'CHECK IN',
    title: 'Check on each other',
    text: 'Children, older adults, pregnant people, and people with heart or lung conditions may need extra care. Follow medical advice.',
    art: 'care',
  },
]

function paintHaze(canvas, image, severity) {
  const bounds = canvas.getBoundingClientRect()
  if (!image?.naturalWidth || !bounds.width || !bounds.height) return

  const ratio = window.devicePixelRatio || 1
  const context = canvas.getContext('2d')
  canvas.width = Math.round(bounds.width * ratio)
  canvas.height = Math.round(bounds.height * ratio)
  context.setTransform(ratio, 0, 0, ratio, 0, 0)
  context.globalCompositeOperation = 'source-over'
  context.clearRect(0, 0, bounds.width, bounds.height)
  if (severity.veil === 0) return

  const scale = Math.max(bounds.width / image.naturalWidth, bounds.height / image.naturalHeight)
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  const bleed = 24
  context.save()
  context.globalAlpha = severity.veil * 0.58
  context.filter = severity.name === 'Clear' ? 'none' : `blur(${severity.blur}px) saturate(0.65)`
  context.drawImage(image, (bounds.width - width) / 2 - bleed, (bounds.height - height) / 2 - bleed, width + bleed * 2, height + bleed * 2)
  context.restore()

  if (severity.veil > 0) {
    context.fillStyle = `rgba(210, 219, 211, ${severity.veil * 0.44})`
    context.fillRect(0, 0, bounds.width, bounds.height)
    const smokeClouds = [
      [0.08, 0.24, 0.43, 0.48], [0.36, 0.1, 0.38, 0.34], [0.73, 0.23, 0.48, 0.42],
      [0.22, 0.69, 0.5, 0.4], [0.55, 0.53, 0.54, 0.48], [0.91, 0.76, 0.4, 0.38],
      [0.41, 0.91, 0.43, 0.29], [0.83, 0.05, 0.36, 0.28],
    ]
    const radius = Math.max(bounds.width, bounds.height) * 0.46
    smokeClouds.forEach(([x, y, size, opacity]) => {
      const cloud = context.createRadialGradient(
        bounds.width * x, bounds.height * y, radius * 0.04,
        bounds.width * x, bounds.height * y, radius * size,
      )
      cloud.addColorStop(0, `rgba(239, 239, 226, ${severity.veil * opacity})`)
      cloud.addColorStop(0.48, `rgba(220, 225, 216, ${severity.veil * opacity * 0.7})`)
      cloud.addColorStop(1, 'rgba(220, 225, 216, 0)')
      context.fillStyle = cloud
      context.fillRect(0, 0, bounds.width, bounds.height)
    })
  }
}

function FogReveal() {
  const canvasRef = useRef(null)
  const progressCanvasRef = useRef(null)
  const imageRef = useRef(null)
  const lastPoint = useRef(null)
  const [cleared, setCleared] = useState(0)
  const [severityIndex, setSeverityIndex] = useState(2)
  const severity = hazeLevels[severityIndex]
  const severityRef = useRef(severity)

  const resetProgressCanvas = () => {
    const bounds = canvasRef.current.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return
    const progressCanvas = progressCanvasRef.current
    const scale = 100 / bounds.width
    progressCanvas.width = 100
    progressCanvas.height = Math.max(1, Math.round(bounds.height * scale))
    const context = progressCanvas.getContext('2d')
    context.globalCompositeOperation = 'source-over'
    context.fillStyle = '#000'
    context.fillRect(0, 0, progressCanvas.width, progressCanvas.height)
  }

  const measureCleared = () => {
    const progressCanvas = progressCanvasRef.current
    const context = progressCanvas.getContext('2d')
    const { data } = context.getImageData(0, 0, progressCanvas.width, progressCanvas.height)
    let clearedPixels = 0
    for (let alpha = 3; alpha < data.length; alpha += 4) {
      if (data[alpha] <= 8) clearedPixels += 1
    }
    return Math.floor((clearedPixels / (progressCanvas.width * progressCanvas.height)) * 100)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const image = new Image()
    imageRef.current = image
    const repaintHaze = () => {
      paintHaze(canvas, image, severityRef.current)
      resetProgressCanvas()
      setCleared(severityRef.current.name === 'Clear' ? 100 : 0)
    }
    image.onload = repaintHaze
    image.src = malaysiaScene
    const observer = new ResizeObserver(repaintHaze)
    observer.observe(canvas)
    return () => {
      observer.disconnect()
      image.onload = null
    }
  }, [])

  useEffect(() => {
    severityRef.current = severity
    paintHaze(canvasRef.current, imageRef.current, severity)
    resetProgressCanvas()
    lastPoint.current = null
  }, [severity])

  const getPoint = (event) => {
    const bounds = canvasRef.current.getBoundingClientRect()
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
  }

  const startClearing = (event) => {
    if (severityRef.current.name === 'Clear') return
    event.preventDefault()
    canvasRef.current.setPointerCapture(event.pointerId)
    lastPoint.current = getPoint(event)
  }

  const clearFog = (event) => {
    if (!lastPoint.current || severityRef.current.name === 'Clear') return
    const point = getPoint(event)
    const context = canvasRef.current.getContext('2d')
    const bounds = canvasRef.current.getBoundingClientRect()
    const progressCanvas = progressCanvasRef.current
    const progressContext = progressCanvas.getContext('2d')
    const scale = progressCanvas.width / bounds.width
    context.globalCompositeOperation = 'destination-out'
    context.lineWidth = 76
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.beginPath()
    context.moveTo(lastPoint.current.x, lastPoint.current.y)
    context.lineTo(point.x, point.y)
    context.stroke()
    progressContext.globalCompositeOperation = 'destination-out'
    progressContext.lineWidth = 76 * scale
    progressContext.lineCap = 'round'
    progressContext.lineJoin = 'round'
    progressContext.beginPath()
    progressContext.moveTo(lastPoint.current.x * scale, lastPoint.current.y * scale)
    progressContext.lineTo(point.x * scale, point.y * scale)
    progressContext.stroke()
    lastPoint.current = point
    setCleared(measureCleared())
  }

  const stopClearing = () => { lastPoint.current = null }

  const resetFog = () => {
    const canvas = canvasRef.current
    paintHaze(canvas, imageRef.current, severityRef.current)
    resetProgressCanvas()
    lastPoint.current = null
    setCleared(severityRef.current.name === 'Clear' ? 100 : 0)
  }

  const changeSeverity = (event) => {
    const nextSeverity = Number(event.target.value)
    setSeverityIndex(nextSeverity)
    setCleared(nextSeverity === 0 ? 100 : 0)
  }

  const revealAll = () => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0)
    const progressCanvas = progressCanvasRef.current
    progressCanvas.getContext('2d').clearRect(0, 0, progressCanvas.width, progressCanvas.height)
    lastPoint.current = null
    setCleared(100)
  }

  return (
    <div className="reveal-experience">
    <div className="reveal-scene" aria-label="Interactive haze reveal">
      <img className="scene-photo" src={malaysiaScene} alt="Petronas Twin Towers and Kuala Lumpur Tower at sunrise in Kuala Lumpur, Malaysia." />
      <div className="scene-reveal-copy">
        <span>HAZE, UP CLOSE</span>
        <strong>See what<br />haze hides.</strong>
        <small>Fine particles can affect health even when haze looks light.</small>
      </div>
      <div className="scene-caption"><span className="caption-dot" /> KLCC · Kuala Lumpur, Malaysia</div>
      <div className="scene-bottom-label"><span>HAZE LEVEL · <span className={`scene-level-tag air-level-${severity.name.toLowerCase()}`}>{severity.name.toUpperCase()}</span></span><span>{cleared === 100 || severity.name === 'Clear' ? 'CLEAR' : cleared > 0 ? 'CLEARING' : 'OBSCURED'}</span></div>
      <canvas ref={canvasRef} className="fog-canvas" style={{ opacity: severity.veil === 0 ? 0 : 0.35 + severity.veil * 0.45 }} aria-label="Drag across the image to clear the haze" onPointerDown={startClearing} onPointerMove={clearFog} onPointerUp={stopClearing} onPointerCancel={stopClearing} />
      <canvas ref={progressCanvasRef} hidden aria-hidden="true" />
      <a className="photo-credit" href="https://commons.wikimedia.org/wiki/File:58_Kuala_Lumpur_sunrise_city_skyline_with_Petronas_Towers_and_KL_Tower.jpg" target="_blank" rel="noreferrer">Photo by Marek Slusarczyk · CC BY 3.0</a>
    </div>
    <div className="haze-level-control">
      <div className="haze-level-copy"><strong>Explore the haze</strong><span>Drag the image to clear it, or adjust the level.</span></div>
      <input aria-label="Haze severity" aria-valuetext={severity.name} type="range" min="0" max={hazeLevels.length - 1} step="1" value={severityIndex} onChange={changeSeverity} style={{ '--range-progress': `${(severityIndex / (hazeLevels.length - 1)) * 100}%`, '--severity-color': severity.color }} />
      <output aria-live="polite">{severity.name}</output>
      <div className="haze-control-actions">
        <span className="haze-progress" aria-live="polite">{cleared}% cleared</span>
        <button className="clear-button" type="button" onClick={revealAll}>Clear all <span aria-hidden="true">↗</span></button>
        <button className="reset-button" type="button" onClick={resetFog} aria-label="Reset haze">↺</button>
      </div>
    </div>
    </div>
  )
}

function MalaysiaAirMap() {
  const mapViewportRef = useRef(null)
  const mapPointerRef = useRef(null)
  const [selectedIndex, setSelectedIndex] = useState(2)
  const [readings, setReadings] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [mapOffset, setMapOffset] = useState(0)
  const [isMapDragging, setIsMapDragging] = useState(false)
  const selectedCity = malaysiaCities[selectedIndex]
  const selectedReading = readings[selectedIndex]

  const moveMap = (offset) => {
    const viewport = mapViewportRef.current
    if (!viewport) return
    const content = viewport.querySelector('.map-pan-content')
    if (!content) return
    const minOffset = Math.min(0, viewport.clientWidth - content.scrollWidth)
    setMapOffset(Math.max(minOffset, Math.min(0, offset)))
  }

  const startMapDrag = (event) => {
    if (event.button !== 0 || event.target.closest('button')) return
    const viewport = mapViewportRef.current
    const content = viewport?.querySelector('.map-pan-content')
    if (!viewport || !content || content.scrollWidth <= viewport.clientWidth) return
    mapPointerRef.current = { pointerId: event.pointerId, startX: event.clientX, startOffset: mapOffset }
    viewport.setPointerCapture(event.pointerId)
    setIsMapDragging(true)
  }

  const dragMap = (event) => {
    const pointer = mapPointerRef.current
    if (!pointer || pointer.pointerId !== event.pointerId) return
    moveMap(pointer.startOffset + event.clientX - pointer.startX)
  }

  const stopMapDrag = (event) => {
    if (mapPointerRef.current?.pointerId !== event.pointerId) return
    mapPointerRef.current = null
    setIsMapDragging(false)
  }

  const handleMapKeyDown = (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    moveMap(mapOffset + (event.key === 'ArrowLeft' ? 100 : -100))
  }

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    const refresh = async () => {
      setLoading(true)
      try {
        const nextReadings = await fetchMalaysiaReadings(controller.signal)
        if (active) {
          setReadings(nextReadings)
          setError('')
        }
      } catch (requestError) {
        if (active && requestError.name !== 'AbortError') {
          setError(requestError.message || 'Could not load the latest air quality estimates.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    refresh()
    const interval = window.setInterval(refresh, 15 * 60 * 1000)
    return () => {
      active = false
      controller.abort()
      window.clearInterval(interval)
    }
  }, [refreshKey])

  const updatedAt = readings[0]?.time
    ? new Date(`${readings[0].time}+08:00`).toLocaleString('en-MY', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kuala_Lumpur',
    })
    : null

  return (
    <section className="air-map-section" id="air-quality">
      <div className="section-wrap air-map-inner">
        <div className="section-kicker"><span>LIVE CHECK</span><span className="kicker-rule" /> MALAYSIA AIR QUALITY</div>
        <div className="air-map-heading">
          <div>
            <h2 className="major-headline">How clear is the air<br />where <em>you are?</em></h2>
            <p>Explore current fine-particle estimates across Malaysia. Choose a marker to see its latest reading.</p>
          </div>
          <a className="iqair-link" href="https://www.iqair.com/air-quality/malaysia/kuala-lumpur/kuala-lumpur" target="_blank" rel="noreferrer">
            Open IQAir Kuala Lumpur <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="air-map-card">
          <div
            className={`malaysia-map${isMapDragging ? ' is-dragging' : ''}`}
            ref={mapViewportRef}
            role="group"
            aria-label="Draggable map of Malaysian state boundaries and air-quality locations. Use left and right arrow keys to pan."
            tabIndex={0}
            onPointerDown={startMapDrag}
            onPointerMove={dragMap}
            onPointerUp={stopMapDrag}
            onPointerCancel={stopMapDrag}
            onLostPointerCapture={stopMapDrag}
            onKeyDown={handleMapKeyDown}
          >
            <div className="map-pan-content" style={{ transform: `translateX(${mapOffset}px)` }}>
              <svg className="malaysia-map-shapes" viewBox={`0 0 ${malaysiaStates.projection.width} ${malaysiaStates.projection.height}`} preserveAspectRatio="none" aria-hidden="true">
                {malaysiaStates.states.map((state) => (
                  <path className="map-state" d={state.path} fillRule="evenodd" key={state.name}>
                    <title>{state.name}</title>
                  </path>
                ))}
              </svg>
              {malaysiaCities.map((city, index) => {
                const reading = readings[index]
                const level = reading?.level || 'loading'
                const readingLabel = reading ? `${reading.level}, PM2.5 ${reading.pm25.toFixed(1)} micrograms per cubic metre` : 'Air quality loading'
                return (
                  <button
                    className={`map-marker map-location-${index} label-${city.labelSide} air-level-${level.toLowerCase()}${selectedIndex === index ? ' is-selected' : ''}`}
                    key={city.name}
                    type="button"
                    style={getMapPosition(city)}
                    aria-label={`${city.name}, ${city.region}: ${readingLabel}`}
                    aria-pressed={selectedIndex === index}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <span className="map-marker-dot" />
                    <span className="map-marker-name">{city.name}</span>
                  </button>
                )
              })}
            </div>
            <div className="map-legend" aria-label="Air quality legend">
              <span><i className="air-level-clear" />Clear</span>
              <span><i className="air-level-light" />Light</span>
              <span><i className="air-level-moderate" />Moderate</span>
              <span><i className="air-level-dense" />Dense</span>
            </div>
            <span className="map-drag-hint" aria-hidden="true">DRAG TO EXPLORE <span>↔</span></span>
          </div>

          <aside className="air-reading" aria-live="polite">
            <div className="reading-location"><span className="reading-kicker">SELECTED LOCATION</span><span className="reading-pin">⌖</span></div>
            <h3>{selectedCity.name}</h3>
            <p className="reading-region">{selectedCity.region}, Malaysia</p>
            {selectedReading ? (
              <>
                <div className={`reading-status air-level-${selectedReading.level.toLowerCase()}`}>
                  <span className="reading-status-dot" />{selectedReading.level} air
                </div>
                <div className="reading-value">
                  <strong>{selectedReading.pm25.toFixed(1)}</strong>
                  <span>µg/m³<br />PM2.5</span>
                </div>
                <p className="reading-secondary">PM10: {selectedReading.pm10.toFixed(1)} µg/m³</p>
              </>
            ) : (
              <div className="reading-pending" role={error ? 'alert' : 'status'}>
                {error ? 'Reading unavailable' : 'Loading current estimate…'}
              </div>
            )}
            {error && <p className="reading-error">{error}{readings.length > 0 ? ' Showing the last available reading.' : ''}</p>}
            <div className="reading-footer">
              <button className="refresh-button" type="button" onClick={() => setRefreshKey((key) => key + 1)} disabled={loading}>
                {loading ? 'Updating…' : 'Refresh readings'} <span aria-hidden="true">↻</span>
              </button>
              <span>{updatedAt ? `Updated ${updatedAt} MYT` : 'Waiting for first update'}</span>
            </div>
          </aside>
        </div>

        <p className="air-map-note">
          Open-Meteo provides modelled hourly PM2.5 and PM10 estimates; this page checks for updated values every 15 minutes. The map covers seven selected cities, not every town or neighbourhood, so local conditions may differ. State boundaries: <a href="https://www.geoboundaries.org/" target="_blank" rel="noreferrer">geoBoundaries</a>, from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap/Wambacher</a> (2017, ODbL 1.0).
        </p>
        <div className="air-quality-guide">
          <article>
            <span className="air-quality-guide-label">HOW TO READ THIS MAP</span>
            <h3>PM2.5 estimates are not the official API</h3>
            <p>The numbers show estimated particle concentrations in µg/m³. Malaysia’s Air Pollutant Index (API) is a separate index, so these values and the map’s colour labels are not interchangeable with official API categories or alerts.</p>
          </article>
          <article>
            <span className="air-quality-guide-label">FOR OFFICIAL UPDATES</span>
            <h3>Check conditions near you</h3>
            <p>Use the Department of Environment’s <a href="https://eqms.doe.gov.my/" target="_blank" rel="noreferrer">MyEQMS portal</a> for official Malaysian API readings and local updates. Lower estimated PM values do not guarantee risk-free air.</p>
          </article>
        </div>
      </div>
    </section>
  )
}

function MaskGuide() {
  const maskTypes = [
    {
      name: 'N95',
      region: 'TOP PICK',
      detail: 'A genuine NIOSH-approved N95 is a strong first choice if it seals snugly on your face.',
    },
    {
      name: 'KN95',
      region: 'CHINA STANDARD',
      detail: 'Can filter fine particles when genuine and well-fitting; many styles use ear loops, so check for gaps.',
    },
    {
      name: 'FFP2',
      region: 'EUROPEAN STANDARD',
      detail: 'A suitable alternative if it is certified, fits closely, and stays sealed while you move.',
    },
    {
      name: 'KF94',
      region: 'SOUTH KOREAN STANDARD',
      detail: 'Another option for fine particles; choose a trusted product that seals well on your face.',
    },
  ]
  return (
    <section className="mask-guide" aria-labelledby="mask-guide-title">
      <div className="mask-guide-heading">
        <span className="action-label">CHOOSING A RESPIRATOR</span>
        <h3 id="mask-guide-title">For haze, choose a well-fitting N95</h3>
        <p>A genuine, NIOSH-approved N95 is a strong first choice for reducing exposure to fine particles—provided it seals closely to your face. No respirator works well if air leaks around the edges.</p>
      </div>
      <div className="mask-type-grid">
        {maskTypes.map((mask) => (
          <article className="mask-type-card" key={mask.name}>
            <div className="mask-type-copy">
              <span>{mask.region}</span>
              <h4>{mask.name}</h4>
              <p>{mask.detail}</p>
            </div>
          </article>
        ))}
      </div>
      <aside className="mask-fit-note">
        <strong>Fit beats the label.</strong>
        <span>N95, KN95, FFP2, and KF94 refer to different standards. Pick a genuine, certified respirator that seals over your nose and chin without gaps; facial hair under the seal can reduce protection. Cloth and loose-fitting surgical masks do not seal well enough for dependable fine-particle protection. Verify N95 models with the <a href="https://www.cdc.gov/niosh/ppe/niosh-approved-respirators/index.html" target="_blank" rel="noreferrer">NIOSH Certified Equipment List</a>.</span>
      </aside>
      <p className="mask-guide-disclaimer">Respirators reduce particles, not all gases or vapours, and do not make smoky air safe. When haze is severe, prioritize cleaner indoor air and follow local health advice.</p>
    </section>
  )
}

function App() {
  const [darkMode, setDarkMode] = useState(false)
  const siteRef = useRef(null)

  useEffect(() => {
    const updateScrollHaze = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollable > 0 ? Math.max(0, 1 - window.scrollY / (scrollable * 0.74)) : 0
      siteRef.current?.style.setProperty('--scroll-haze-opacity', (progress * 0.2).toFixed(3))
    }
    updateScrollHaze()
    window.addEventListener('scroll', updateScrollHaze, { passive: true })
    window.addEventListener('resize', updateScrollHaze)
    return () => {
      window.removeEventListener('scroll', updateScrollHaze)
      window.removeEventListener('resize', updateScrollHaze)
    }
  }, [])

  useEffect(() => {
    const site = siteRef.current
    if (!site || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const animatedElements = site.querySelectorAll(
      '.hero-copy, .reveal-experience, .definition-section, .formation-inner, .regional-watch, .air-map-inner, .protect-heading, .protection-card, .mask-guide, .impact-section',
    )
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('motion-visible')
        } else {
          entry.target.classList.remove('motion-visible')
        }
      })
    }, { threshold: 0.05 })

    animatedElements.forEach((element) => {
      element.classList.add('motion-ready')
      observer.observe(element)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="site-shell" data-theme={darkMode ? 'dark' : 'light'} style={{ '--canopy-backdrop': `url(${tamanNegaraCanopy})`, '--misty-forest-backdrop': `url(${mistyForest})`, '--marble-texture': `url(${marbleTexture})` }} ref={siteRef}>
            <header className="topbar">
              <a className="wordmark" href="#top" aria-label="Clear Air, home"><AirMark /> clear air<span className="wordmark-period">.</span></a>
              <nav aria-label="Main navigation"><a href="#understand">What is haze?</a><a href="#formation">How it happens</a><a href="#protect">What to do</a><a href="#impact">Health effects</a></nav>
              <div className="header-actions">
                <a className="top-cta" href="#understand">Start with the basics <span aria-hidden="true">↘</span></a>
                <button className="theme-toggle" type="button" aria-pressed={darkMode} onClick={() => setDarkMode(!darkMode)}><span aria-hidden="true">{darkMode ? '☀' : '☾'}</span>{darkMode ? 'Light' : 'Dark'} mode</button>
              </div>
            </header>

            <main id="top">
              <section className="hero-section">
                <div className="hero-copy">
                  <p className="eyebrow"><span /> UNDERSTANDING MALAYSIA’S HAZE</p>
                  <h1>What is<br /><em>haze?</em></h1>
                  <p className="hero-description">Learn what causes haze, how it can reach Malaysia, and what you can do to protect your health.</p>
                  <a className="text-link" href="#understand">Explore the haze guide <span aria-hidden="true">↓</span></a>
                  <div className="hero-note"><span className="note-line" /> Clear information helps us make safer choices.</div>
                </div>
                <FogReveal />
                <div className="hero-index"><span>01</span> / 04 <span className="index-rule" /></div>
                <a className="hero-photo-credit" href="https://commons.wikimedia.org/wiki/File:Taman_Negara,_Malaysia,_Tall_trees_in_canopy.jpg" target="_blank" rel="noreferrer">Taman Negara canopy · Vyacheslav Argenberg · CC BY 4.0</a>
              </section>

              <div className="motion-ticker" role="img" aria-label="Check the air. Protect your people. Breathing room for all. Stay safe.">
                <div className="motion-ticker-track" aria-hidden="true">
                  {Array.from({ length: 8 }, (_, groupIndex) => (
                    <span className="motion-ticker-group" key={groupIndex}>
                      {tickerPhrases.map((phrase) => (
                        <span className="ticker-phrase" key={phrase}>{phrase}<i>✳</i></span>
                      ))}
                    </span>
                  ))}
                </div>
              </div>

              <section className="definition-section section-wrap" id="understand">
                <div className="section-kicker"><span>01</span><span className="kicker-rule" /> THE BASICS</div>
                <div className="definition-grid">
                  <h2 className="major-headline">So, what exactly<br />is <em>haze?</em></h2>
                  <div className="definition-copy">
                    <p>Haze is a layer of tiny particles and droplets in the air. They scatter light, making distant views look faded or tinted.</p>
                    <p>Particles can come from fires, dust, traffic, and industry. Their sources and levels vary by place and over time.</p>
                    <div className="fact-line"><span className="fact-spark">✳</span><span><strong>Remember:</strong> how hazy the sky looks does not tell you the full air quality.</span></div>
                  </div>
                </div>
                <div className="definition-stats"><div className="stat-item"><span className="stat-mark">01</span><strong>Fine particles</strong><span>Small enough to stay airborne</span></div><div className="stat-item"><span className="stat-mark">02</span><strong>Scattered light</strong><span>Why distant views look washed out</span></div><div className="stat-item"><span className="stat-mark">03</span><strong>Different sources</strong><span>Natural and human-made</span></div></div>
                <div className="haze-visual">
                  <div className="haze-visual-copy">
                    <span className="visual-kicker">HAZE FROM ABOVE</span>
                    <h3>Smoke can travel across borders</h3>
                    <p>This NASA satellite image shows fires and smoke over Sumatra in February 2005, with haze reaching north toward mainland Malaysia. It is a historical example, not a current conditions report.</p>
                  </div>
                  <figure className="haze-visual-image">
                    <img src={sumatraHaze} alt="NASA satellite image of fires marked in red and a broad smoke plume over Sumatra, with haze extending north toward Malaysia." loading="lazy" />
                    <figcaption>NASA image by Jesse Allen, using MODIS data · Public domain · <a href="https://commons.wikimedia.org/wiki/File:Fires_and_Smoke_in_Sumatra_(14651).jpg" target="_blank" rel="noreferrer">Image source <span aria-hidden="true">↗</span></a></figcaption>
                  </figure>
                </div>
              </section>

              <section className="formation-section" id="formation">
                <div className="section-wrap formation-inner">
                  <div className="section-kicker"><span>02</span><span className="kicker-rule" /> THE BUILD-UP</div>
                  <div className="formation-heading"><h2 className="major-headline">How clear skies<br />turn <em>hazy.</em></h2><p>Haze forms when smoke and other particles build up faster than weather can disperse them.</p></div>
                  <div className="process-grid">{steps.map((step) => <article className={`process-step ${step.tone}`} key={step.number}><div className="step-top"><span>{step.number} / 03</span><span className="step-icon" aria-hidden="true">{step.icon}</span></div><h3>{step.title}</h3><p>{step.text}</p><div className="step-line"><span /></div></article>)}</div>
                  <div className="process-note"><span>IN SHORT</span><span>Haze levels vary by location and can change as winds and rainfall shift.</span></div>
                  <aside className="regional-watch">
                    <div className="watch-stamp"><span>REGIONAL</span><strong>HAZE<br />WATCH</strong><span>OCT 2026</span></div>
                    <div className="watch-copy">
                      <span className="watch-source">ASEAN SPECIALISED METEOROLOGICAL CENTRE · OCTOBER 2026 OUTLOOK</span>
                      <h3>October outlook flags haze risk in southern ASEAN.</h3>
                      <p>The Centre’s October outlook notes continued smoke-haze risk in southern ASEAN. Depending on wind and rain, smoke from fires in Indonesia can drift towards Malaysia. Rain may help clear the air.</p>
                      <a href="https://asmc.asean.org/home/" target="_blank" rel="noreferrer">Read the ASEAN outlook <span aria-hidden="true">↗</span></a>
                    </div>
                  </aside>
                </div>
              </section>

              <MalaysiaAirMap />

              <section className="protect-section" id="protect"><div className="section-wrap protect-inner">
                <div className="protect-heading"><div className="section-kicker light-kicker"><span>03</span><span className="kicker-rule" /> WHAT TO DO</div><h2 className="major-headline">Find cleaner air.<br /><em>Look after each other.</em></h2><p>Check local air quality. When it is poor, reduce time outdoors and choose cleaner indoor air.</p><a className="aqi-link" href="https://eqms.doe.gov.my/" target="_blank" rel="noreferrer">Check official air quality <span aria-hidden="true">↗</span></a></div>
                <div className="protection-grid">{protectionSteps.map((step) => <article className="protection-card" key={step.number}>
                  <div className={`action-art ${step.art}`} aria-hidden="true">
                    {step.art === 'windows' && <svg viewBox="0 0 64 64"><path d="M9 29 32 11l23 18v25H9z" /><path d="M22 32h20v22H22zM22 43h20M32 32v22" /><path d="M47 20v-7h6v12" /></svg>}
                    {step.art === 'mask' && <svg viewBox="0 0 64 64"><path d="M15 28c0-9 7-16 17-16s17 7 17 16v17c0 5-4 9-9 9H24c-5 0-9-4-9-9z" /><path d="m15 31-8-3v18l8-4M49 31l8-3v18l-8-4M22 32h20M22 39h20M22 46h20" /></svg>}
                    {step.art === 'care' && <svg viewBox="0 0 64 64"><path d="M32 54S10 41 10 25a12 12 0 0 1 22-6 12 12 0 0 1 22 6c0 16-22 29-22 29Z" /><path d="M22 33h7l4-8 5 15 4-7h5" /></svg>}
                  </div>
                  <span className="action-label">{step.label}</span><span className="action-number">{step.number}</span>
                  <h3>{step.title}</h3><p>{step.text}</p>
                </article>)}</div>
                <section className="haze-day-checklist" aria-labelledby="haze-checklist-title">
                  <div>
                    <span className="action-label">A QUICK PLAN</span>
                    <h3 id="haze-checklist-title">Your haze-day checklist</h3>
                  </div>
                  <ol>
                    <li><strong>Check local API.</strong><span>Look up official readings before outdoor plans.</span></li>
                    <li><strong>Cut outdoor time.</strong><span>Avoid long or strenuous activity in poor air.</span></li>
                    <li><strong>Keep medicines handy.</strong><span>Follow your clinician’s advice.</span></li>
                    <li><strong>Check on others.</strong><span>Especially those more affected by haze.</span></li>
                  </ol>
                </section>
                <MaskGuide />
                <aside className="prevention-note"><span>HELP PREVENT HAZE</span><p>Never burn rubbish or start open fires. Report open burning; choose public transport or carpool when practical.</p></aside>
                <p className="guidance-note">Respirators can reduce particles, but cleaner indoor air is the best protection when haze is severe.</p>
              </div></section>

              <section className="impact-section section-wrap" id="impact">
                <div className="section-kicker"><span>04</span><span className="kicker-rule" /> WHY IT MATTERS</div>
                <div className="impact-grid">
                  <div><h2 className="major-headline">Haze is more<br />than a <em>blurred view.</em></h2><p className="impact-intro">Tiny particles in haze can harm the lungs and heart. The risk depends on air quality, exposure time, and a person’s health.</p></div>
                  <div className="impact-list">
                    <div className="impact-row"><span className="impact-symbol" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></svg></span><div><h3>It irritates eyes and airways</h3><p>Haze can cause sore eyes, coughing, wheezing, and shortness of breath.</p></div><span className="row-arrow">↗</span></div>
                    <div className="impact-row"><span className="impact-symbol" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3v8m0-2-2-2m2 2 2-2M10 10c-1.5 1.5-2.4 2-3.4 2.5C5.3 13.2 4 14.8 4 17c0 2 1.1 4 3.1 4 2.1 0 3.4-1.7 3.4-4.2V10Zm4 0c1.5 1.5 2.4 2 3.4 2.5 1.3.7 2.6 2.3 2.6 4.5 0 2-1.1 4-3.1 4-2.1 0-3.4-1.7-3.4-4.2V10Z" /></svg></span><div><h3>It can worsen existing conditions</h3><p>Haze may trigger asthma or COPD and strain the heart and lungs.</p></div><span className="row-arrow">↗</span></div>
                    <div className="impact-row"><span className="impact-symbol" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="4.5" r="2.5" /><path d="M8.5 21v-4.5l-2-4.2A2 2 0 0 1 8.3 9.5h7.4a2 2 0 0 1 1.8 2.8l-2 4.2V21m-7-8 3.5 2 3.5-2m-3.5 2V21" /></svg></span><div><h3>Long-term exposure raises health risks</h3><p>Fine-particle pollution is linked to heart disease, stroke, chronic lung disease, and lung cancer.</p></div><span className="row-arrow">↗</span></div>
                  </div>
                </div>
                <p className="health-note"><span>!</span> <strong>When to get help:</strong> Seek urgent medical care for severe breathing difficulty, chest pain, fainting, or symptoms that worsen quickly. This guide cannot assess emergencies. <a href="https://www.who.int/health-topics/air-pollution" target="_blank" rel="noreferrer">WHO: air pollution and health ↗</a></p>
              </section>
            </main>

            <footer className="site-footer"><a className="wordmark" href="#top"><AirMark /> clear air<span className="wordmark-period">.</span></a><span>Look closer. Breathe wiser. · <a className="texture-credit" href="https://commons.wikimedia.org/wiki/File:Marble_Texture.png" target="_blank" rel="noreferrer">Marble texture: ORIGAMEDIGITAL / CC0</a> · <a className="texture-credit" href="https://commons.wikimedia.org/wiki/File:Autumn_in_a_misty_forest_(Unsplash).jpg" target="_blank" rel="noreferrer">Forest photo: Alessio Lin / CC0</a></span><a href="#top">Back to the top ↑</a></footer>
    </div>
  )
}

export default App
