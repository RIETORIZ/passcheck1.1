import React from 'react'
export default function PersonalInfo({ info, setInfo }){
  const onChange = e => setInfo({ ...info, [e.target.name]: e.target.value })
  return (
    <section className="card span-2">
      <details>
        <summary style={{ cursor:'pointer', fontWeight:600 }}>Personal Info (optional)</summary>
        <div className="form-grid" style={{ marginTop:'1rem' }}>
          <label>Full Name<input name="full_name" value={info.full_name} onChange={onChange} /></label>
          <label>Email<input name="email" value={info.email} onChange={onChange} /></label>
          <label>Phone<input name="phone" value={info.phone} onChange={onChange} /></label>
          <label>Company<input name="company" value={info.company} onChange={onChange} /></label>
          <label>Location<input name="location" value={info.location} onChange={onChange} /></label>
          <label>Address<input name="address" value={info.address} onChange={onChange} /></label>
          <label>Birthday<input type="date" name="dob" value={info.dob} onChange={onChange} /></label>
        </div>
      </details>
    </section>
  )
}
