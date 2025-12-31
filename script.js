document.addEventListener('DOMContentLoaded', ()=>{
  const countdownEl = document.getElementById('countdown')
  const cake = document.querySelector('.cake')
  const nextBtn = document.getElementById('nextBtn')
  const replayBtn = document.getElementById('replayBtn')
  const downloadBtn = document.getElementById('downloadBtn')

  const numbers = [5,4,3,2,1]

  function runCountdown(){
    if(!countdownEl) return
    let i = 0
    countdownEl.textContent = numbers[i]
    const t = setInterval(()=>{
      i++
      if(i < numbers.length){
        countdownEl.classList.remove('pop')
        void countdownEl.offsetWidth
        countdownEl.textContent = numbers[i]
        countdownEl.classList.add('pop')
      } else {
        clearInterval(t)
        if(cake) cake.classList.add('cut')
        // after cake cut, navigate to celebration page
        setTimeout(()=>{
          window.location.href = 'celebrate.html'
        },800)
      }
    },1000)
  }

  function launchConfetti(count = 70, duration = 8000){
    const confetti = document.getElementById('confetti')
    if(!confetti) return
    confetti.innerHTML = ''
    for(let i=0;i<count;i++){
      const el = document.createElement('div')
      el.className = 'conf'
      el.style.position = 'absolute'
      // spread horizontally a bit more
      el.style.left = (10 + Math.random()*80)+'%'
      el.style.top = (Math.random()*30 - 20)+'%'
      const w = 6 + Math.random()*14
      el.style.width = w+'px'
      el.style.height = w*0.6+'px'
      el.style.background = randomColor()
      el.style.opacity = 0.98
      el.style.borderRadius = '2px'
      el.style.transform = 'rotate('+Math.random()*360+'deg)'
      el.style.animation = `fall ${3+Math.random()*4}s cubic-bezier(.2,.6,.2,1) ${Math.random()*0.6}s forwards`
      confetti.appendChild(el)
    }
    setTimeout(()=>confetti.innerHTML='',duration)
  }

  function randomColor(){
    const pal = ['#ff7fbf','#ffd1e6','#ffb86b','#b8fff0','#ffd6e8','#f7ff9e','#f7ff9e','#c7e9ff','#ffd1a8']
    return pal[Math.floor(Math.random()*pal.length)]
  }

  // Fireworks canvas implementation
  let _fw = null
  function enhancedCelebration(){
    // animate title
    const title = document.getElementById('celebrateTitle')
    if(title){
      title.classList.add('animate','glow')
    }
    // adapt intensity for small screens
    const isMobile = (window.innerWidth || document.documentElement.clientWidth) < 520 || /Mobi|Android/i.test(navigator.userAgent)
    // play chime
    playChime()
    // start fireworks with lighter settings on mobile
    startFireworks(isMobile)
    // sparkle effect (less frequent on mobile)
    startSparkles(isMobile)
    // butterflies (fewer on mobile)
    startButterflies(isMobile)
    // confetti: fewer pieces on mobile
    const confCount = isMobile ? 40 : 120
    const confDur = isMobile ? 7000 : 11000
    launchConfetti(confCount, confDur)
  }

  function playChime(){
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const now = ctx.currentTime
      const notes = [880, 1320, 1760] // A5, E6-ish arpeggio
      notes.forEach((freq, i)=>{
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'sine'
        o.frequency.value = freq
        g.gain.value = 0
        o.connect(g); g.connect(ctx.destination)
        o.start(now + i*0.12)
        g.gain.linearRampToValueAtTime(0.12, now + i*0.12 + 0.02)
        g.gain.linearRampToValueAtTime(0.0, now + i*0.12 + 0.38)
        o.stop(now + i*0.12 + 0.5)
      })
    }catch(e){console.warn('Audio failed', e)}
  }

  function startFireworks(){
    // startFireworks optionally accepts a mobile flag (backwards-compatible)
    const isMobile = arguments[0] === true
    const canvas = document.getElementById('fireworksCanvas')
    if(!canvas) return
    const ctx = canvas.getContext('2d')
    let w = canvas.width = window.innerWidth
    let h = canvas.height = window.innerHeight
    const rockets = []
    const particles = []
    let raf

    function resize(){ w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)

    function rand(min,max){return Math.random()*(max-min)+min}

    function launchRocket(){
      rockets.push({
        x: rand(80,w-80),
        y: h + 20,
        vx: rand(-1,1),
        vy: rand(isMobile ? -7 : -10, isMobile ? -9 : -13),
        life: 0
      })
    }

    function explode(x,y){
      const count = (isMobile ? 14 : 30) + Math.floor(Math.random()*(isMobile ? 16 : 30))
      for(let i=0;i<count;i++){
        const speed = Math.random()*6 + 2
        const angle = Math.random()*Math.PI*2
        particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:0,ttl:60+Math.random()*40,color:randomColor()})
      }
    }

    function step(){
      ctx.clearRect(0,0,w,h)
      // rockets
      for(let i=rockets.length-1;i>=0;i--){
        const r = rockets[i]
        r.x += r.vx
        r.y += r.vy
        r.vy += 0.18
        r.life++
        ctx.fillStyle = '#fff'
        ctx.beginPath(); ctx.arc(r.x,r.y,2,0,Math.PI*2); ctx.fill()
        if(r.vy > -1){ // explode
          explode(r.x,r.y)
          rockets.splice(i,1)
        }
      }
      // particles
      for(let i=particles.length-1;i>=0;i--){
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.12
        p.vx *= 0.996
        p.vy *= 0.996
        p.life++
        const t = p.life / p.ttl
        const alpha = Math.max(1 - t, 0)
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        ctx.beginPath(); ctx.arc(p.x,p.y,2+ (1-t)*3,0,Math.PI*2); ctx.fill()
        ctx.globalAlpha = 1
        if(p.life > p.ttl) particles.splice(i,1)
      }
      // occasionally launch new rocket (less often on mobile)
      const launchProb = isMobile ? 0.03 : 0.08
      if(Math.random() < launchProb) launchRocket()
      raf = requestAnimationFrame(step)
    }

    // start
    step()
    _fw = { stop: ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize', resize); ctx.clearRect(0,0,w,h) } }
  }

  function stopFireworks(){ if(_fw && _fw.stop) _fw.stop(); _fw = null }

  let _sp = null
  function startSparkles(){
    // startSparkles optionally accepts isMobile flag
    const isMobile = arguments[0] === true
    const canvas = document.createElement('canvas')
    canvas.style.position = 'fixed'
    canvas.style.left = '0'
    canvas.style.top = '0'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = '24'
    document.body.appendChild(canvas)
    
    const ctx = canvas.getContext('2d')
    let w = canvas.width = window.innerWidth
    let h = canvas.height = window.innerHeight
    const sparkles = []
    let raf

    function resize(){ w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)

    function createSparkle(){
      sparkles.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.6,
        size: (isMobile ? (Math.random() * 1.4 + 0.6) : (Math.random() * 2 + 1)),
        life: 0,
        ttl: (isMobile ? 30 + Math.random() * 40 : 40 + Math.random() * 60),
        vx: (Math.random() - 0.5) * (isMobile ? 0.6 : 0.8),
        vy: Math.random() * (isMobile ? 0.9 : 1.2) + 0.2
      })
    }

    function step(){
      ctx.clearRect(0, 0, w, h)
      
      for(let i = sparkles.length - 1; i >= 0; i--){
        const s = sparkles[i]
        s.x += s.vx
        s.y += s.vy
        s.life++
        
        const t = s.life / s.ttl
        const alpha = Math.sin(t * Math.PI) * 0.9
        
        ctx.fillStyle = `rgba(255,200,220,${alpha})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
        ctx.fill()
        
        if(s.life > s.ttl) sparkles.splice(i, 1)
      }
      
      // create less frequent sparkles on mobile
      const prob = isMobile ? 0.18 : 0.4
      if(Math.random() < prob) createSparkle()
      raf = requestAnimationFrame(step)
    }

    step()
    _sp = { 
      stop: ()=>{ 
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', resize)
        canvas.remove()
      } 
    }
  }

  function stopSparkles(){ if(_sp && _sp.stop) _sp.stop(); _sp = null }

  let _bf = null
  function startButterflies(){
    const canvas = document.createElement('canvas')
    canvas.style.position = 'fixed'
    canvas.style.left = '0'
    canvas.style.top = '0'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = '26'
    document.body.appendChild(canvas)
    
    const ctx = canvas.getContext('2d')
    let w = canvas.width = window.innerWidth
    let h = canvas.height = window.innerHeight
    const butterflies = []
    let raf

    function resize(){ w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)

    function drawButterfly(x, y, size, angle){
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle)
      ctx.fillStyle = '#ffb3d9'
      // left wings
      ctx.beginPath()
      ctx.ellipse(-size, 0, size*1.2, size*0.8, -Math.PI*0.2, 0, Math.PI*2)
      ctx.fill()
      // right wings
      ctx.beginPath()
      ctx.ellipse(size, 0, size*1.2, size*0.8, Math.PI*0.2, 0, Math.PI*2)
      ctx.fill()
      // body
      ctx.fillStyle = '#ff7fbf'
      ctx.beginPath()
      ctx.ellipse(0, 0, size*0.3, size*1.5, 0, 0, Math.PI*2)
      ctx.fill()
      ctx.restore()
    }

    function createButterfly(){
      butterflies.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.7,
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 0.8 + 0.3,
        size: 8 + Math.random() * 6,
        angle: 0,
        life: 0,
        ttl: 200 + Math.random() * 200,
        wingFlap: 0
      })
    }

    function step(){
      ctx.clearRect(0, 0, w, h)
      
      for(let i = butterflies.length - 1; i >= 0; i--){
        const b = butterflies[i]
        b.x += b.vx
        b.y += b.vy
        b.life++
        b.wingFlap += 0.15
        b.angle = Math.sin(b.wingFlap) * 0.3
        
        const t = b.life / b.ttl
        const alpha = Math.sin(t * Math.PI) * 0.85
        ctx.globalAlpha = alpha
        
        drawButterfly(b.x, b.y, b.size, b.angle)
        
        ctx.globalAlpha = 1
        if(b.life > b.ttl) butterflies.splice(i, 1)
      }
      
      // occasionally add new butterfly
      if(butterflies.length < 3 && Math.random() < 0.15) createButterfly()
      raf = requestAnimationFrame(step)
    }

    step()
    _bf = { 
      stop: ()=>{ 
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', resize)
        canvas.remove()
      } 
    }
  }

  function stopButterflies(){ if(_bf && _bf.stop) _bf.stop(); _bf = null }

  function startNoteSparkles(){
    const container = document.getElementById('noteSparkles')
    if(!container) return
    
    // Create more vibrant sparkles with varied colors
    for(let i = 0; i < 20; i++){
      const spark = document.createElement('div')
      spark.style.position = 'absolute'
      const size = 2 + Math.random() * 5
      spark.style.width = size + 'px'
      spark.style.height = size + 'px'
      spark.style.borderRadius = '50%'
      
      // varied sparkle colors: pink, gold, light blue, white
      const colors = [
        `rgba(255,150,200,${0.5 + Math.random()*0.5})`,
        `rgba(255,200,100,${0.5 + Math.random()*0.5})`,
        `rgba(200,230,255,${0.5 + Math.random()*0.5})`,
        `rgba(255,255,200,${0.5 + Math.random()*0.5})`
      ]
      spark.style.background = colors[Math.floor(Math.random() * colors.length)]
      spark.style.boxShadow = `0 0 ${8 + Math.random()*6}px ${spark.style.background.split(',')[0] + ',0.6)'}`
      
      spark.style.left = Math.random() * 100 + '%'
      spark.style.top = Math.random() * 100 + '%'
      spark.style.pointerEvents = 'none'
      spark.style.animation = `sparkleFloat ${3 + Math.random()*5}s ease-in-out infinite`
      spark.style.animationDelay = (Math.random() * 3) + 's'
      container.appendChild(spark)
    }
    
    // add keyframes for sparkle animation
    if(!document.getElementById('_noteSparkleStyles')){
      const s = document.createElement('style')
      s.id = '_noteSparkleStyles'
      s.textContent = `
        @keyframes sparkleFloat{
          0%{transform:translateY(0) scale(0.8);opacity:0.2}
          50%{opacity:0.9}
          100%{transform:translateY(-30px) scale(1.2);opacity:0.1}
        }
      `
      document.head.appendChild(s)
    }
  }

  function startFestiveDecor(){
    const container = document.getElementById('festiveDecor')
    if(!container) return
    
    const phrases = ['Happy New Year 2026', '✨', '🎉', 'Celebrate', 'Joy', 'Magic', 'Wishes', '💫', '🎊']
    
    // place decorative text around the background
    for(let i = 0; i < 8; i++){
      const text = document.createElement('div')
      text.className = 'festive-text'
      text.textContent = phrases[Math.floor(Math.random() * phrases.length)]
      text.style.left = Math.random() * 100 + '%'
      text.style.top = Math.random() * 100 + '%'
      text.style.color = ['#ff1493', '#ff6b35', '#00bcd4', '#d946ef'][Math.floor(Math.random() * 4)]
      text.style.animation = `festiveFloat ${6 + Math.random()*6}s ease-in-out infinite`
      text.style.animationDelay = (Math.random() * 3) + 's'
      text.style.transform = `rotate(${Math.random()*10-5}deg)`
      text.style.textShadow = `0 2px 8px rgba(0,0,0,0.15)`
      container.appendChild(text)
    }
    
    // add festive float animation
    if(!document.getElementById('_festiveStyles')){
      const s = document.createElement('style')
      s.id = '_festiveStyles'
      s.textContent = `
        @keyframes festiveFloat{
          0%{transform:translateY(0) scale(1) rotate(-5deg);opacity:0.25}
          50%{opacity:0.35}
          100%{transform:translateY(-40px) scale(1.1) rotate(5deg);opacity:0.25}
        }
      `
      document.head.appendChild(s)
    }
  }

  // page-specific wiring
  if(countdownEl){
    setTimeout(runCountdown,700)
  }

  if(nextBtn){
    nextBtn.addEventListener('click', ()=>{
      window.location.href = 'note.html'
    })
    // enhanced celebration on celebration page
    enhancedCelebration()
  }

  if(replayBtn){
    replayBtn.addEventListener('click', ()=>{
      window.location.href = 'index.html'
    })
  }

  // Check if we're on note page and run decorations
  if(document.getElementById('noteSparkles')){
    startNoteSparkles()
    startFestiveDecor()
  }
    // About Me modal wiring
    const aboutBtn = document.getElementById('aboutMeBtn')
    const aboutModal = document.getElementById('aboutModal')
    const aboutClose = document.getElementById('aboutClose')
    const aboutOverlay = document.getElementById('aboutOverlay')
    function showAbout(){
      if(!aboutModal) return
      aboutModal.classList.remove('hidden')
      aboutModal.setAttribute('aria-hidden','false')
    }
    function hideAbout(){
      if(!aboutModal) return
      aboutModal.classList.add('hidden')
      aboutModal.setAttribute('aria-hidden','true')
    }
    if(aboutBtn) aboutBtn.addEventListener('click', showAbout)
    if(aboutClose) aboutClose.addEventListener('click', hideAbout)
    if(aboutOverlay) aboutOverlay.addEventListener('click', hideAbout)
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') hideAbout() })

  // downloadBtn removed — no action needed

  // small pop animation class for numbers is provided in CSS now
})
