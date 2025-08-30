import React, { useState } from 'react'
import { generatePassword } from '../lib/api'

export default function Generate(){
  const [len, setLen] = useState(16)
  const [symbols, setSymbols] = useState(true)
  const [numbers, setNumbers] = useState(true)
  const [out, setOut] = useState('')
  const onGen = async () => {
    setOut('...')
    try {
      const data = await generatePassword({ length: len, symbols: symbols ? 1 : 0, numbers: numbers ? 1 : 0 })
      setOut(data.password || data.generated_password || JSON.stringify(data))
    } catch (e) {
      setOut('Error: ' + e.message)
    }
  }
  return (
    <aside className="card" id="generate">
      <h2>Generate</h2>
      <div className="form-grid">
        <label>Length<input type="number" min="8" max="64" value={len} onChange={e=>setLen(e.target.value)} /></label>
        <label className="check"><input type="checkbox" checked={symbols} onChange={e=>setSymbols(e.target.checked)} /> Symbols</label>
        <label className="check"><input type="checkbox" checked={numbers} onChange={e=>setNumbers(e.target.checked)} /> Numbers</label>
        <button className="btn success" type="button" onClick={onGen}>Generate</button>
        <code className="inline">{out}</code>
      </div>
    </aside>
  )
}
