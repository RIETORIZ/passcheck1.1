import React, { useState } from 'react'
import Waves from './components/Waves'
import PersonalInfo from './components/PersonalInfo'
import PassCheck from './components/PassCheck'
import Generate from './components/Generate'
import Crack from './components/Crack'

export default function App(){
  const [info, setInfo] = useState({ full_name:'', email:'', phone:'', company:'', location:'', address:'', dob:'' })
  return (
    <div style={{ position:'relative', minHeight:'100vh' }}>
      <Waves lineColor="#fff" backgroundColor="rgba(255,255,255,0.04)" waveSpeedX={0.02} waveSpeedY={0.01} waveAmpX={40} waveAmpY={20} friction={0.9} tension={0.01} maxCursorMove={120} xGap={12} yGap={36} className="waves-bg" />
      <header className="topbar"><div className="container"><div className="brand">PassCheck</div></div></header>
      <main className="container grid" style={{ position:'relative', zIndex:1 }}>
        <PersonalInfo info={info} setInfo={setInfo} />
        <PassCheck info={info} />
        <Generate />
        <Crack info={info} />
      </main>
      <footer className="footer" style={{ position:'relative', zIndex:1 }}>
        <div className="container row between center">
          <div className="muted small">© 2025 PassCheck</div>
          <div className="muted small">API: <code>/analyze_password</code> · <code>/generate_password</code> · <code>/crack_password_stream/&lt;pwd&gt;</code></div>
        </div>
      </footer>
    </div>
  )
}
