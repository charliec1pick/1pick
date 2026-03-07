import { } from '../supabase'

export default function Topbar({ profile, onAvatarClick }) {
  return (
    <div style={s.topbar}>
      <div style={s.logoWrap}>
        <div style={s.logoName}>
          <em style={{fontStyle:'normal',color:'#C9A84C'}}>1</em>Pick
        </div>
        <div style={s.logoTagline}>Beat the field</div>
      </div>
      <div style={s.right}>
        <div style={s.userChip} onClick={onAvatarClick}>
          <div style={s.avatar}>{profile?.username?.[0]?.toUpperCase() || '?'}</div>
          <div style={s.userName}>{profile?.username || 'Loading...'}</div>
        </div>
      </div>
    </div>
  )
}

const s = {
  topbar:{background:'#1a1a1a',padding:'0 20px 0 28px',display:'flex',alignItems:'center',justifyContent:'space-between',height:'64px',position:'relative'},
  logoWrap:{display:'flex',flexDirection:'column',lineHeight:1},
  logoName:{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:'1.5rem',color:'#fff'},
  logoTagline:{fontFamily:"'Barlow Condensed',sans-serif",fontSize:'0.58rem',textTransform:'uppercase',letterSpacing:'3px',color:'rgba(255,255,255,0.3)',marginTop:'2px'},
  right:{display:'flex',alignItems:'center',gap:'10px'},
  userChip:{display:'flex',alignItems:'center',gap:'8px',background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:'20px',padding:'5px 12px 5px 5px',cursor:'pointer'},
  avatar:{width:'26px',height:'26px',borderRadius:'50%',background:'#4B2E83',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.72rem',fontWeight:700,color:'#fff',fontFamily:"'Barlow Condensed',sans-serif"},
  userName:{fontSize:'0.75rem',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,color:'rgba(255,255,255,0.65)'},
}