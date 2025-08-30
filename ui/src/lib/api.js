const RAW = import.meta.env.VITE_API_BASE || '';
const API_BASE = RAW.replace(/\/+$/, ''); // strip trailing slashes

async function jsonFetch(url, opts = {}){
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...(opts.headers||{}) }, ...opts })
  if(!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const analyzePassword = (payload) =>
  jsonFetch(`${API_BASE}/analyze_password`, { method: 'POST', body: JSON.stringify(payload) });

export const generatePassword = (params) => {
  const usp = new URLSearchParams(params);
  return jsonFetch(`${API_BASE}/generate_password?` + usp.toString());
};

export const crackStreamURL = (pwd, timeLimit, usePII, info) => {
  const q = new URLSearchParams({ time_limit: String(timeLimit), use_personal_info: usePII ? 'true' : 'false' });
  if(usePII && info){
    if(info.full_name) q.set('full_name', info.full_name);
    if(info.dob) q.set('dob', info.dob);
    if(info.location) q.set('location', info.location);
    if(info.phone) q.set('phone', info.phone);
    if(info.company) q.set('company', info.company);
    if(info.address) q.set('address', info.address);
    if(info.email) q.set('email', info.email);
  }
  return `${API_BASE}/crack_password_stream/${encodeURIComponent(pwd)}?${q.toString()}`;
};
