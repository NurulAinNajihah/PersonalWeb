import { useEffect, useRef, useState } from 'react'
import malaysiaScene from './assets/klcc-sunrise.jpg'
import './App.css'

const hazeLevels = [
  { name: 'Clear', blur: 0, veil: 0.08 },
  { name: 'Light', blur: 5, veil: 0.25 },
  { name: 'Moderate', blur: 11, veil: 0.46 },
  { name: 'Severe', blur: 20, veil: 0.68 },
]

const steps = [
  { number: '01', title: 'Particles enter the air', text: 'Tiny particles from burning forests, vehicles, factories, and other sources are released into the atmosphere.', icon: '↗', tone: 'leaf' },
  { number: '02', title: 'Weather holds them close', text: 'Still air, heat, and certain wind patterns can keep pollution from dispersing, letting it gather over a region.', icon: '≈', tone: 'sun' },
  { number: '03', title: 'A grey veil takes shape', text: 'As particles build up, they scatter light and reduce visibility. Hazy skies are not a substitute for an air quality reading.', icon: '◌', tone: 'sky' },
]

const protectionSteps = [
  {
    number: '01',
    label: 'AT HOME',
    title: 'Keep smoky air outside',
    text: 'When air quality is poor, close doors and windows. Set air-conditioning to recirculate and use a correctly sized HEPA air cleaner if you have one.',
    art: 'windows',
  },
  {
    number: '02',
    label: 'IF YOU GO OUT',
    title: 'Choose a close-fitting KN95',
    text: 'A genuine KN95, N95 or equivalent particulate respirator may reduce fine-particle exposure when it seals snugly over your nose and mouth. Cloth and surgical masks do not protect as reliably. Limit time outdoors too.',
    art: 'mask',
  },
  {
    number: '03',
    label: 'CHECK IN',
    title: 'Protect people at higher risk',
    text: 'Children, older adults, pregnant people, and anyone with heart or lung conditions should take extra care. Follow their clinician’s advice and seek medical help for severe breathing trouble.',
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

  const scale = Math.max(bounds.width / image.naturalWidth, bounds.height / image.naturalHeight)
  const width = image.naturalWidth * scale
  const height = image.naturalHeight * scale
  const bleed = 24
  context.save()
  context.filter = `blur(${severity.blur}px) saturate(0.65)`
  context.drawImage(image, (bounds.width - width) / 2 - bleed, (bounds.height - height) / 2 - bleed, width + bleed * 2, height + bleed * 2)
  context.restore()
  context.fillStyle = `rgba(218, 225, 218, ${severity.veil})`
  context.fillRect(0, 0, bounds.width, bounds.height)
}

function FogReveal() {
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const lastPoint = useRef(null)
  const distance = useRef(0)
  const [cleared, setCleared] = useState(0)
  const [severityIndex, setSeverityIndex] = useState(2)
  const severity = hazeLevels[severityIndex]
  const severityRef = useRef(severity)

  useEffect(() => {
    const canvas = canvasRef.current
    const image = new Image()
    imageRef.current = image
    image.onload = () => paintHaze(canvas, image, severityRef.current)
    image.src = malaysiaScene
    const observer = new ResizeObserver(() => paintHaze(canvas, image, severityRef.current))
    observer.observe(canvas)
    return () => {
      observer.disconnect()
      image.onload = null
    }
  }, [])

  useEffect(() => {
    severityRef.current = severity
    paintHaze(canvasRef.current, imageRef.current, severity)
  }, [severity])

  const getPoint = (event) => {
    const bounds = canvasRef.current.getBoundingClientRect()
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
  }

  const startClearing = (event) => {
    event.preventDefault()
    canvasRef.current.setPointerCapture(event.pointerId)
    lastPoint.current = getPoint(event)
  }

  const clearFog = (event) => {
    if (!lastPoint.current) return
    const point = getPoint(event)
    const context = canvasRef.current.getContext('2d')
    context.globalCompositeOperation = 'destination-out'
    context.lineWidth = 76
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.beginPath()
    context.moveTo(lastPoint.current.x, lastPoint.current.y)
    context.lineTo(point.x, point.y)
    context.stroke()
    distance.current += Math.hypot(point.x - lastPoint.current.x, point.y - lastPoint.current.y)
    lastPoint.current = point
    setCleared(Math.min(100, Math.floor(distance.current / 15)))
  }

  const stopClearing = () => { lastPoint.current = null }

  const resetFog = () => {
    const canvas = canvasRef.current
    paintHaze(canvas, imageRef.current, severityRef.current)
    distance.current = 0
    setCleared(0)
  }

  const changeSeverity = (event) => {
    const nextSeverity = Number(event.target.value)
    setSeverityIndex(nextSeverity)
    distance.current = 0
    setCleared(0)
  }

  const revealAll = () => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    context.setTransform(1, 0, 0, 1, 0, 0)
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0)
    distance.current = 1500
    setCleared(100)
  }

  return (
    <div className="reveal-experience">
    <div className="reveal-scene" aria-label="Interactive haze reveal">
      <img className="scene-photo" src={malaysiaScene} alt="Petronas Twin Towers and Kuala Lumpur Tower at sunrise in Kuala Lumpur, Malaysia." />
      <div className="scene-reveal-copy">
        <span>WHAT'S IN THE AIR?</span>
        <strong>Look beyond<br />the grey.</strong>
        <small>Fine particles can travel far beyond what we can see.</small>
      </div>
      <div className="scene-caption"><span className="caption-dot" /> KLCC · Kuala Lumpur, Malaysia</div>
      <div className="scene-bottom-label"><span>HAZE LEVEL · {severity.name.toUpperCase()}</span><span>{cleared > 24 ? 'CLEARING' : severity.name === 'Clear' ? 'CLEAR' : 'OBSCURED'}</span></div>
      <canvas ref={canvasRef} className="fog-canvas" aria-label="Drag across the image to clear the haze" onPointerDown={startClearing} onPointerMove={clearFog} onPointerUp={stopClearing} onPointerCancel={stopClearing} />
      {cleared < 12 && <div className="wipe-prompt" aria-hidden="true"><span className="wipe-icon">↗</span><span>Drag to clear the air</span></div>}
      <div className="reveal-controls">
        <div className="reveal-progress" aria-live="polite"><span className="progress-track"><span style={{ width: `${cleared}%` }} /></span><span>{cleared}% cleared</span></div>
        <button className="clear-button" type="button" onClick={revealAll}>Clear all <span aria-hidden="true">↗</span></button>
        <button className="reset-button" type="button" onClick={resetFog} aria-label="Reset haze">↺</button>
      </div>
      <a className="photo-credit" href="https://commons.wikimedia.org/wiki/File:58_Kuala_Lumpur_sunrise_city_skyline_with_Petronas_Towers_and_KL_Tower.jpg" target="_blank" rel="noreferrer">Photo by Marek Slusarczyk · CC BY 3.0</a>
    </div>
    <div className="haze-level-control">
      <div className="haze-level-copy"><strong>Change the haze</strong><span>Drag to compare visibility</span></div>
      <input aria-label="Haze severity" aria-valuetext={severity.name} type="range" min="0" max={hazeLevels.length - 1} step="1" value={severityIndex} onChange={changeSeverity} style={{ '--range-progress': `${(severityIndex / (hazeLevels.length - 1)) * 100}%` }} />
      <output aria-live="polite">{severity.name}</output>
    </div>
    </div>
  )
}

function MaskExplorer() {
  const [maskView, setMaskView] = useState('worn')

  return (
    <div className="mask-explorer">
      <div className={`mask-illustration ${maskView}`} aria-hidden="true">
        <svg viewBox="0 0 360 260">
          {maskView === 'worn' ? (
            <>
              <path className="face-shape" d="M106 114c0-64 33-91 74-91s74 27 74 91c0 77-37 119-74 119s-74-42-74-119Z" />
              <path className="face-detail" d="M135 104c10-7 21-7 30 0m30 0c10-7 21-7 30 0m-39 13-6 27 10 5m-29 11c10 8 22 12 34 12s24-4 34-12" />
              <path className="mask-strap" d="M129 130c-42-13-52 1-51 15m153-15c42-13 52 1 51 15" />
              <path className="mask-shape" d="m135 128 44-9 45 9-5 47-40 20-40-20z" />
              <path className="mask-fold" d="m143 139 70-2m-67 15 64-1m-58 14 52-1" />
            </>
          ) : (
            <>
              <path className="mask-strap" d="M112 92C40 54 47 205 112 177m136-85c72-38 65 113 0 85" />
              <path className="mask-shape" d="m112 92 67-25 69 25-8 85-61 30-61-30z" />
              <path className="mask-fold" d="m123 111 116-1m-113 20 110-1m-108 20 105-1m-94 19 84-1" />
              <path className="mask-detail" d="m112 92 67 19 69-19m-69-25v44m-67 66 67 11 61-11m-61-66v96" />
            </>
          )}
        </svg>
      </div>
      <div className="mask-explorer-copy">
        <span className="action-label">A CLOSER LOOK</span>
        <h3>See how a KN95 sits.</h3>
        <p>Switch the view to see the respirator on its own or how it covers the nose and mouth. A good seal at the edges matters.</p>
        <div className="mask-view-switch" role="group" aria-label="KN95 mask view">
          <button type="button" aria-pressed={maskView === 'alone'} onClick={() => setMaskView('alone')}>Mask alone</button>
          <button type="button" aria-pressed={maskView === 'worn'} onClick={() => setMaskView('worn')}>Worn on a person</button>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [darkMode, setDarkMode] = useState(false)

  return (
    <div className="site-shell" data-theme={darkMode ? 'dark' : 'light'}>
            <header className="topbar">
              <a className="wordmark" href="#top" aria-label="Clear Air, home"><span className="brand-mark">◉</span> clear air<span className="wordmark-period">.</span></a>
              <nav aria-label="Main navigation"><a href="#understand">Understand</a><a href="#formation">How it forms</a><a href="#protect">Protect yourself</a></nav>
              <div className="header-actions"><a className="top-cta" href="#understand">Explore the air <span aria-hidden="true">↘</span></a><button className="theme-toggle" type="button" aria-pressed={darkMode} onClick={() => setDarkMode(!darkMode)}><span aria-hidden="true">{darkMode ? '☀' : '☾'}</span>{darkMode ? 'Light' : 'Dark'} mode</button></div>
            </header>

            <main id="top">
              <section className="hero-section">
                <div className="hero-copy">
                  <p className="eyebrow"><span /> AN INVITATION TO SEE CLEARER</p>
                  <h1>Some things<br />are <em>hard to see.</em></h1>
                  <p className="hero-description">Haze changes the air around us, often before we notice. Clear away the blur and discover what is really in it.</p>
                  <a className="text-link" href="#understand">Get to know haze <span aria-hidden="true">↓</span></a>
                  <div className="hero-note"><span className="note-line" /> A clearer picture starts with awareness.</div>
                </div>
                <FogReveal />
                <div className="hero-index"><span>01</span> / 04 <span className="index-rule" /></div>
              </section>

              <section className="definition-section section-wrap" id="understand">
                <div className="section-kicker"><span>01</span><span className="kicker-rule" /> THE BASICS</div>
                <div className="definition-grid">
                  <h2>So, what exactly<br />is <em>haze?</em></h2>
                  <div className="definition-copy">
                    <p>Haze is a visible veil in the air caused by tiny particles and droplets suspended in the atmosphere. They scatter light, softening distant views and sometimes tinting the sky.</p>
                    <p>Those particles can come from natural sources, like wildfires and dust, or human activity, like traffic and industry. Haze is not one single thing, and what is in it can vary from place to place.</p>
                    <div className="fact-line"><span className="fact-spark">✳</span><span><strong>Look closer:</strong> hazy skies are a clue about the air, not a complete air quality reading.</span></div>
                  </div>
                </div>
                <div className="definition-stats"><div className="stat-item"><span className="stat-mark">01</span><strong>Fine particles</strong><span>Small enough to stay airborne</span></div><div className="stat-item"><span className="stat-mark">02</span><strong>Scattered light</strong><span>Why distant views look washed out</span></div><div className="stat-item"><span className="stat-mark">03</span><strong>Different sources</strong><span>Natural and human-made</span></div></div>
              </section>

              <section className="formation-section" id="formation">
                <div className="section-wrap formation-inner">
                  <div className="section-kicker"><span>02</span><span className="kicker-rule" /> THE BUILD-UP</div>
                  <div className="formation-heading"><h2>How a clear sky<br />turns <em>hazy.</em></h2><p>It is a chain reaction between particles, weather, and time. Here is the view from the ground up.</p></div>
                  <div className="process-grid">{steps.map((step) => <article className={`process-step ${step.tone}`} key={step.number}><div className="step-top"><span>{step.number} / 03</span><span className="step-icon" aria-hidden="true">{step.icon}</span></div><h3>{step.title}</h3><p>{step.text}</p><div className="step-line"><span /></div></article>)}</div>
                  <div className="process-note"><span>THE TAKEAWAY</span><span>Haze builds when particles accumulate faster than the atmosphere can disperse them. Conditions and causes differ by region.</span></div>
                </div>
              </section>

              <section className="impact-section section-wrap">
                <div className="section-kicker"><span>03</span><span className="kicker-rule" /> WHAT IT MEANS</div>
                <div className="impact-grid">
                  <div><h2>More than<br />a <em>blurred view.</em></h2><p className="impact-intro">Haze can affect how far we see and how our bodies feel. The level of risk depends on the particles involved, their concentration, and how long we breathe them in.</p></div>
                  <div className="impact-list">
                    <div className="impact-row"><span className="impact-symbol">◉</span><div><h3>Visibility can drop</h3><p>Particles scatter light, making roads and distant landmarks harder to see.</p></div><span className="row-arrow">↗</span></div>
                    <div className="impact-row"><span className="impact-symbol">⌁</span><div><h3>Breathing can feel harder</h3><p>Polluted air may irritate eyes and airways, especially for sensitive groups.</p></div><span className="row-arrow">↗</span></div>
                    <div className="impact-row"><span className="impact-symbol">✳</span><div><h3>Conditions can change fast</h3><p>Wind and weather can shift haze levels across hours and neighborhoods.</p></div><span className="row-arrow">↗</span></div>
                  </div>
                </div>
                <p className="health-note"><span>!</span> People with asthma, heart or lung conditions, older adults, and children may be more sensitive to air pollution. Follow local health advice.</p>
              </section>

              <section className="protect-section" id="protect"><div className="section-wrap protect-inner">
                <div className="protect-heading"><div className="section-kicker light-kicker"><span>04</span><span className="kicker-rule" /> A CLEARER DAY</div><h2>Know the air.<br /><em>Look after each other.</em></h2><p>Check Malaysia’s air quality readings and take practical steps to lower exposure when haze settles in.</p><a className="aqi-link" href="https://eqms.doe.gov.my/" target="_blank" rel="noreferrer">Check Malaysia’s air quality <span aria-hidden="true">↗</span></a></div>
                <div className="protection-grid">{protectionSteps.map((step) => <article className="protection-card" key={step.number}>
                  <div className={`action-art ${step.art}`} aria-hidden="true">
                    {step.art === 'windows' && <svg viewBox="0 0 64 64"><path d="M9 29 32 11l23 18v25H9z" /><path d="M22 32h20v22H22zM22 43h20M32 32v22" /><path d="M47 20v-7h6v12" /></svg>}
                    {step.art === 'mask' && <svg viewBox="0 0 64 64"><path d="M15 28c0-9 7-16 17-16s17 7 17 16v17c0 5-4 9-9 9H24c-5 0-9-4-9-9z" /><path d="m15 31-8-3v18l8-4M49 31l8-3v18l-8-4M22 32h20M22 39h20M22 46h20" /></svg>}
                    {step.art === 'care' && <svg viewBox="0 0 64 64"><path d="M32 54S10 41 10 25a12 12 0 0 1 22-6 12 12 0 0 1 22 6c0 16-22 29-22 29Z" /><path d="M22 33h7l4-8 5 15 4-7h5" /></svg>}
                  </div>
                  <span className="action-label">{step.label}</span><span className="action-number">{step.number}</span>
                  <h3>{step.title}</h3><p>{step.text}</p>
                </article>)}</div>
                <MaskExplorer />
                <aside className="prevention-note"><span>HELP PREVENT THE NEXT HAZE</span><p>Never burn rubbish or start an open fire. Report open burning to local authorities, and walk, carpool or use public transport when practical to cut local emissions. Regional haze needs wider action too.</p></aside>
                <p className="guidance-note">A respirator must fit snugly to help filter fine particles; it is not suitable for everyone. Keep children indoors when air quality is poor, and seek urgent care for severe breathing difficulty. Follow current Malaysian health advice.</p>
              </div></section>
            </main>

            <footer className="site-footer"><a className="wordmark" href="#top"><span className="brand-mark">◉</span> clear air<span className="wordmark-period">.</span></a><span>Look closer. Breathe wiser.</span><a href="#top">Back to the top ↑</a></footer>
    </div>
  )
}

export default App
