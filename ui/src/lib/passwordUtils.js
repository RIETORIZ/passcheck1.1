export function localAnalyze(pwd, email){
  const issues=[], notes=[]
  const minLen=12
  if(!pwd || pwd.length<minLen) issues.push(`Length < ${minLen}`)
  if(!/[a-z]/.test(pwd)) issues.push('No lowercase')
  if(!/[A-Z]/.test(pwd)) issues.push('No uppercase')
  if(!/[0-9]/.test(pwd)) issues.push('No number')
  if(!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(pwd)) issues.push('No symbol')
  if(email){
    const user=(email.split('@')[0]||'').toLowerCase()
    if(user && user.length>=3 && (pwd||'').toLowerCase().includes(user)){
      issues.push('Contains email username'); notes.push('Avoid using parts of personal info')
    }
  }
  if(/0123|1234|2345|3456|5678|6789/.test(pwd)) issues.push('Sequential digits')
  if(/abcd|bcde|cdef|qwerty|asdf/i.test(pwd)) issues.push('Keyboard/alpha sequence')
  if(/(.)\1{2,}/.test(pwd)) issues.push('Repeated characters')
  return { issues, notes }
}
