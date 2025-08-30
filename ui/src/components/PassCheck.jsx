import React, { useState } from 'react'
import { analyzePassword } from '../lib/api'
import { localAnalyze } from '../lib/passwordUtils'
import SuggestionBox from './SuggestionBox'

export default function PassCheck({ info }){
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [issues, setIssues] = useState([])
  const [notes, setNotes] = useState([])
  const [serverOut, setServerOut] = useState('')
  const [serverSuggestion, setServerSuggestion] = useState('')
  const [serverSuggestionChanges, setServerSuggestionChanges] = useState([])
  const [advice, setAdvice] = useState([])

  const onAnalyze = async (e) => {
    e.preventDefault()
    const { issues, notes } = localAnalyze(password, email || info?.email)
    setIssues(issues); setNotes(notes)
    setServerOut('Waiting...')
    try {
      const payload = {
        password,
        name: (info?.full_name || '').trim(),
        dob: (info?.dob || '').trim(),
        location: (info?.location || '').trim(),
        phone: (info?.phone || '').trim(),
        email: (email || info?.email || '').trim(),
        company: (info?.company || '').trim(),
        address: (info?.address || '').trim()
      }
      const data = await analyzePassword(payload)
      setServerOut(JSON.stringify(data, null, 2))
      setServerSuggestion(data?.suggestion?.password || '')
      setServerSuggestionChanges(data?.suggestion?.changes || [])
      setAdvice(Array.isArray(data?.advice) ? data.advice : [])
    } catch (err) {
      setServerOut('Error: ' + err.message)
    }
  }

  const onClear = () => {
    setPassword(''); setEmail(''); setIssues([]); setNotes([]); setServerOut(''); setServerSuggestion(''); setServerSuggestionChanges([]); setAdvice([])
  }

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
      <div className="split">
        <div>
          <h3>Issues (Local)</h3>
          <ul className="issues">
            {issues.length === 0 ? <li className="muted">No local issues yet.</li> : issues.map((i,idx)=><li key={idx}>{i}</li>)}
            {notes.map((n,idx)=><li key={'n'+idx}>{n}</li>)}
          </ul>
        </div>
        <div>
          <h3>Server Analysis</h3>
          <pre className="pre">{serverOut}</pre>
        </div>
      </div>
      <div className="card subtle" id="reviewCard">
        <h3>Review Summary</h3>
        <ul>
          {issues.map((i,idx)=><li key={'r'+idx}>{i}</li>)}
          {issues.length===0 && <li>No local issues detected.</li>}
        </ul>
      </div>
      <SuggestionBox suggestion={serverSuggestion} fixes={serverSuggestionChanges} onCopy={()=>navigator.clipboard.writeText(serverSuggestion || '')} />
      {advice?.length ? (
        <div className="card">
          <h3>Advice</h3>
          <ul>{advice.map((a, i)=><li key={i}>{a}</li>)}</ul>
        </div>
      ) : null}
    </section>
  )
}
