import React, { useRef, useState } from 'react'
import { crackStreamURL } from '../lib/api'

export default function Crack({ info }){
  const [pwd, setPwd] = useState('P@ssw0rd!23')
  const [timeLimit, setTimeLimit] = useState(30)
  const [usePII, setUsePII] = useState(false)
  const logRef = useRef(null)
  const srcRef = useRef(null)
  const onStart = (e) => {
    e.preventDefault()
    if (srcRef.current) srcRef.current.close()
    const url = crackStreamURL(pwd, timeLimit, usePII, info)
    const ev = new EventSource(url)
    srcRef.current = ev
    if (logRef.current) logRef.current.textContent = ''
    ev.onmessage = (evnt) => {
      if (logRef.current) {
        logRef.current.textContent += evnt.data + '\n'
        logRef.current.scrollTop = logRef.current.scrollHeight
      }
    }
    ev.onerror = () => { if (srcRef.current) srcRef.current.close() }
  }
  const onStop = () => { if (srcRef.current) srcRef.current.close() }
  return (
    <section className="card span-2" id="crack">
      <h2>Crack (Simulation)</h2>
      <form className="form-grid" onSubmit={onStart}>
        <label>Password to simulate<input type="text" value={pwd} onChange={e=>setPwd(e.target.value)} required /></label>
        <label>Time limit (sec)<input type="number" min="5" max="300" value={timeLimit} onChange={e=>setTimeLimit(e.target.value)} /></label>
        <label className="check"><input type="checkbox" checked={usePII} onChange={e=>setUsePII(e.target.checked)} /> Use personal info</label>
        <div className="row">
          <button className="btn danger" type="submit">Start</button>
          <button className="btn" type="button" onClick={onStop}>Stop</button>
        </div>
      </form>
      <pre ref={logRef} className="console"></pre>
    </section>
  )
}
