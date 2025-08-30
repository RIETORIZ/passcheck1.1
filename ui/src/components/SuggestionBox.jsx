import React from 'react'
export default function SuggestionBox({ suggestion, fixes, onCopy }){
  return (
    <div className="card accent" id="suggestBox">
      <div className="row between center">
        <h3>Try this password, for example</h3>
        <button className="btn" onClick={onCopy}>Copy</button>
      </div>
      <code id="fixedPwd" className="fixed">{suggestion || ''}</code>
      <p className="muted small" id="fixNotes">
        {fixes?.length ? 'Applied: ' + fixes.join(', ') : (suggestion ? 'No changes needed.' : '')}
      </p>
    </div>
  )
}
