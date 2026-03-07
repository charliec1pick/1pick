import { useState } from 'react'
import { supabase } from '../supabase'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [tosConfirmed, setTosConfirmed] = useState(false)

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleSignup() {
    setLoading(true)
    setError('')
    if (!username.trim()) { setError('Username is required'); setLoading(false); return }
    if (!ageConfirmed) { setError('You must be 18 or older to use 1Pick'); setLoading(false); return }
    if (!tosConfirmed) { setError('You must agree to the Terms of Service'); setLoading(false); return }

    const { data: existing } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.trim())

    if (existing && existing.length > 0) { setError('Username already taken'); setLoading(false); return }

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }

    setTimeout(async () => {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username: username.trim()
      })
      setLoading(false)
    }, 1000)
  }

  return (
    <div style={styles.screen}>
      <div style={styles.box}>
        <div style={styles.logo}><em style={{color:'#C9A84C'}}>1</em>Pick</div>
        <div style={styles.tagline}>Beat the field. Every week.</div>

        <div style={styles.valuePropGrid}>
          {[['🎯','6 Picks / Week'],['💰','Friend Pools'],['🏆','Season Standings'],['🔒','Odds Lock Live']].map(([icon,label])=>(
            <div key={label} style={styles.vp}><div style={{fontSize:'1.3rem'}}>{icon}</div><div style={styles.vpLabel}>{label}</div></div>
          ))}
        </div>

        <div style={styles.title}>{mode === 'login' ? 'Sign In' : 'Create Account'}</div>

        {mode === 'signup' && (
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input style={styles.input} type="text" placeholder="SharpMike" value={username} onChange={e=>setUsername(e.target.value)} />
          </div>
        )}
        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&(mode==='login'?handleLogin():handleSignup())} />
        </div>

        {mode === 'signup' && (
          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxRow}>
              <input type="checkbox" checked={ageConfirmed} onChange={e=>setAgeConfirmed(e.target.checked)} style={styles.checkbox} />
              <span style={styles.checkboxLabel}>I confirm I am <strong style={{color:'#fff'}}>18 years of age or older</strong></span>
            </label>
            <label style={styles.checkboxRow}>
              <input type="checkbox" checked={tosConfirmed} onChange={e=>setTosConfirmed(e.target.checked)} style={styles.checkbox} />
              <span style={styles.checkboxLabel}>I agree to the <span style={styles.link}>Terms of Service</span> and <span style={styles.link}>Privacy Policy</span></span>
            </label>
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}

        <button style={{...styles.btn, opacity: mode==='signup' && (!ageConfirmed || !tosConfirmed) ? 0.5 : 1}}
          onClick={mode==='login'?handleLogin:handleSignup} disabled={loading}>
          {loading ? 'Loading...' : mode==='login' ? 'Sign In →' : 'Create Account →'}
        </button>

        <div style={styles.switch}>
          {mode==='login' ? <>No account? <span style={styles.link} onClick={()=>setMode('signup')}>Create one free</span></>
          : <>Already have one? <span style={styles.link} onClick={()=>setMode('login')}>Sign in</span></>}
        </div>
      </div>
    </div>
  )
}

const styles = {
  screen:{minHeight:'100vh',background:'#1a1a1a',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px',fontFamily:"'Barlow', sans-serif"},
  box:{background:'#1e1e1e',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'20px',padding:'40px 36px',width:'100%',maxWidth:'420px'},
  logo:{fontFamily:"'Playfair Display', serif",fontWeight:900,fontSize:'2.2rem',color:'#fff',textAlign:'center',marginBottom:'4px'},
  tagline:{fontFamily:"'Barlow Condensed', sans-serif",fontSize:'0.65rem',textTransform:'uppercase',letterSpacing:'3px',color:'rgba(255,255,255,0.3)',textAlign:'center',marginBottom:'28px'},
  valuePropGrid:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'28px'},
  vp:{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'10px',padding:'12px',textAlign:'center'},
  vpLabel:{fontSize:'0.7rem',fontFamily:"'Barlow Condensed', sans-serif",color:'rgba(255,255,255,0.45)',textTransform:'uppercase',letterSpacing:'1px',marginTop:'4px'},
  title:{fontFamily:"'Barlow Condensed', sans-serif",fontWeight:700,fontSize:'1rem',textTransform:'uppercase',letterSpacing:'2px',color:'#fff',marginBottom:'16px'},
  field:{marginBottom:'14px'},
  label:{display:'block',fontSize:'0.68rem',fontFamily:"'Barlow Condensed', sans-serif",textTransform:'uppercase',letterSpacing:'1.5px',color:'rgba(255,255,255,0.4)',marginBottom:'5px'},
  input:{width:'100%',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'10px',padding:'12px 16px',color:'#fff',fontFamily:"'Barlow', sans-serif",fontSize:'0.9rem',outline:'none',boxSizing:'border-box'},
  checkboxGroup:{marginBottom:'16px',display:'flex',flexDirection:'column',gap:'10px'},
  checkboxRow:{display:'flex',alignItems:'flex-start',gap:'10px',cursor:'pointer'},
  checkbox:{marginTop:'2px',accentColor:'#4B2E83',width:'15px',height:'15px',flexShrink:0,cursor:'pointer'},
  checkboxLabel:{fontSize:'0.78rem',color:'rgba(255,255,255,0.45)',lineHeight:1.4},
  error:{background:'rgba(192,57,43,0.15)',border:'1px solid rgba(192,57,43,0.4)',borderRadius:'8px',padding:'10px 14px',color:'#e74c3c',fontSize:'0.82rem',marginBottom:'12px'},
  btn:{width:'100%',padding:'14px',background:'#4B2E83',border:'none',borderRadius:'10px',color:'#fff',fontFamily:"'Barlow Condensed', sans-serif",fontWeight:700,fontSize:'1rem',letterSpacing:'2px',textTransform:'uppercase',cursor:'pointer',marginTop:'6px'},
  switch:{textAlign:'center',marginTop:'18px',fontSize:'0.8rem',color:'rgba(255,255,255,0.38)'},
  link:{color:'#C9A84C',cursor:'pointer',fontWeight:600},
}