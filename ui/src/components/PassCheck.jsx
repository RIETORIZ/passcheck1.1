import React, { useState } from 'react'
import { analyzePassword } from '../lib/api'
import { localAnalyze } from '../lib/passwordUtils'
import SuggestionBox from './SuggestionBox'

function classifyItem(text) {
  if (!text || typeof text !== 'string') return { type: 'warn', text }
  if (text.startsWith('Weakness:')) return { type: 'bad', text: text.replace(/^Weakness:\s*/, '') }
  if (text.startsWith('Strength:')) return { type: 'good', text: text.replace(/^Strength:\s*/, '') }
  return { type: 'warn', text }
}

function scoreLabel(n) {
  if (n >= 85) return { label: 'Strong', cls: 'good' }
  if (n >= 70) return { label: 'Good', cls: 'good' }
  if (n >= 40) return { label: 'Fair', cls: 'warn' }
  return { label: 'Weak', cls: 'bad' }
}

function similarityState(n) {
  if (n >= 85) return { label: 'High (bad)', cls: 'bad' }   // 100% = bad
  if (n >= 50) return { label: 'Medium', cls: 'warn' }
  return { label: 'Low (good)', cls: 'good' }               // 0% = good
}

export default function PassCheck({ info }){
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [items, setItems] = useState([])
  const [advice, setAdvice] = useState([])
  const [serverSuggestion, setServerSuggestion] = useState('')
  const [serverSuggestionChanges, setServerSuggestionChanges] = useState([])
  const [score, setScore] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [sim, setSim] = useState(null)
  const [error, setError] = useState('')

  const onAnalyze = async (e) => {
    e.preventDefault()
    setError('')
    const local = localAnalyze(password, email || info?.email)
    const localWarns = [
      ...local.issues.map(t => ({ type: 'warn', text: t })),
      ...local.notes.map(t => ({ type: 'warn', text: t })),
    ]
    try {
      const payload = {
        password,
        name: (info?.full_name || '').trim(),
        dob: (info?.dob || '').trim(),
        location: (info?.location || '').trim(),
        phone: (info?.phone || '').trim(),
        email: (email || info?.email || '').trim(),
        company: (info?.company || '').trim(),
        address: (info?.address || '').trim(),
      }
      const data = await analyzePassword(payload)
      const serverItems = Array.isArray(data?.feedback) ? data.feedback.map(classifyItem) : []
      setItems([...serverItems, ...localWarns])
      setScore(typeof data?.final_score === 'number' ? data.final_score : null)
      setMetrics({
        length: data?.strength?.length ?? password.length,
        entropy_bits: data?.strength?.entropy_bits ?? null,
        classes: data?.strength?.classes ?? null,
      })
      setSim(typeof data?.similarity_percentage === 'number' ? data.similarity_percentage : null)
      setAdvice(Array.isArray(data?.advice) ? data.advice : [])
      setServerSuggestion(data?.suggestion?.password || '')
      setServerSuggestionChanges(Array.isArray(data?.suggestion?.changes) ? data.suggestion.changes : [])
    } catch (err) {
      setError('Request failed: ' + err.message)
      setItems(localWarns)
    }
  }

  const onClear = () => {
    setPassword(''); setEmail(''); setItems([]); setAdvice([])
    setServerSuggestion(''); setServerSuggestionChanges([])
    setScore(null); setMetrics(null); setSim(null); setError('')
  }

  const sentPayload = {
    password: password ? `•••• (${password.length} chars)` : '',
    email: (email || info?.email || '') || '',
    full_name: info?.full_name || '',
    dob: info?.dob || '',
    location: info?.location || '',
    phone: info?.phone || '',
    company: info?.company || '',
    address: info?.address || '',
  }

  const s = scoreLabel(Number(score ?? 0))
  const sm = sim != null ? similarityState(Number(sim)) : null

  return (
    <section className="card span-2" id="check">
      <h2>Pass Check</h2>
      <p className="muted">Analyze a password and get concrete fixes.</p>

      <form className="form-grid" onSubmit={onAnalyze}>
        <label>Password
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter a password" required/>
        </label>
        <label>Email (optional)
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com"/>
        </label>
        <div className="row">
          <button className="btn primary" type="submit">Analyze</button>
          <button className="btn" type="button" onClick={onClear}>Clear</button>
        </div>
      </form>

      {error ? <div className="card subtle" style={{borderColor:'rgba(255,92,124,.35)'}}><strong>Request Error:</strong> {error}</div> : null}

      <div className="card" id="analysis">
        <div className="row between center">
          <h3>PassCheck Analysis</h3>
          <div className="row" style={{gap:8}}>
            {sm ? <div className={`badge ${sm.cls}`} title="Similarity to common passwords (0% good → 100% bad)"><strong>Similarity</strong>: {sim}%</div> : null}
            {score != null ? <div className={`badge ${s.cls}`} title="Overall score (0% bad → 100% good)"><strong>Score</strong>: {score}/100</div> : null}
          </div>
        </div>

        <ul className="list">
          {items.length === 0 ? <li className="muted">No findings yet.</li> : null}
          {items.map((it, i) => (
            <li key={i} className="item">
              <span className={`icon ${it.type}`}>{it.type==='good'?'✓':it.type==='bad'?'✗':'!'}</span>
              <span>{it.text}</span>
            </li>
          ))}
        </ul>

        {advice?.length ? (
          <>
            <h4 style={{marginTop:16}}>Recommendations</h4>
            <ul className="list">
              {advice.map((a,i)=>(
                <li key={'ad'+i} className="item">
                  <span className="icon warn">!</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>

      <div className="card subtle">
        <h3>Score Details</h3>
        <div className="split">
          <div>
            <p className="muted small">Percentage scales</p>
            <ul className="list">
              <li className="item"><span className="icon bad">✗</span><span><strong>Overall Score</strong>: 0% = bad, 100% = good.</span></li>
              <li className="item"><span className="icon bad">✗</span><span><strong>Similarity</strong>: 0% = good, 100% = bad (means it matches the common-password dataset).</span></li>
            </ul>
            <p className="muted small" style={{marginTop:8}}>Score meaning</p>
            <ul className="list">
              <li className="item"><span className="icon bad">✗</span><span><strong>Weak</strong>: 0–39 — high risk.</span></li>
              <li className="item"><span className="icon warn">!</span><span><strong>Fair</strong>: 40–69 — needs improvement.</span></li>
              <li className="item"><span className="icon good">✓</span><span><strong>Good</strong>: 70–84 — acceptable.</span></li>
              <li className="item"><span className="icon good">✓</span><span><strong>Strong</strong>: 85–100 — recommended.</span></li>
            </ul>
          </div>
          <div>
            <p className="muted small">Metrics</p>
            <ul className="list">
              {metrics?.length != null && <li className="item"><span className="icon good">✓</span><span>Length: {metrics.length}</span></li>}
              {metrics?.entropy_bits != null && <li className="item"><span className="icon warn">!</span><span>Entropy (bits): {metrics.entropy_bits}</span></li>}
              {metrics?.classes && (
                <>
                  <li className="item"><span className={`icon ${metrics.classes.upper?'good':'bad'}`}>{metrics.classes.upper?'✓':'✗'}</span><span>Uppercase</span></li>
                  <li className="item"><span className={`icon ${metrics.classes.lower?'good':'bad'}`}>{metrics.classes.lower?'✓':'✗'}</span><span>Lowercase</span></li>
                  <li className="item"><span className={`icon ${metrics.classes.digit?'good':'bad'}`}>{metrics.classes.digit?'✓':'✗'}</span><span>Numbers</span></li>
                  <li className="item"><span className={`icon ${metrics.classes.symbol?'good':'bad'}`}>{metrics.classes.symbol?'✓':'✗'}</span><span>Symbols</span></li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      <details className="card">
        <summary style={{cursor:'pointer', fontWeight:600}}>Data sent to API</summary>
        <pre className="pre" style={{marginTop:10}}>{JSON.stringify(sentPayload, null, 2)}</pre>
      </details>

      <div className="card subtle" id="reviewCard">
        <h3>Review Summary</h3>
        <p className="muted small">Key issues summarized above. Use the suggested password or adjust manually.</p>
      </div>

      <SuggestionBox suggestion={serverSuggestion} fixes={serverSuggestionChanges} onCopy={()=>navigator.clipboard.writeText(serverSuggestion || '')} />
    </section>
  )
}
