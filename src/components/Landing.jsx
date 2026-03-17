import { useState, useEffect } from 'react'
import Auth from './Auth'

export default function Landing() {
  const [showAuth, setShowAuth] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])

return (
    <div style={s.page}>
      {/* Auth Modal */}
      {showAuth && (
        <div style={s.modalOverlay} onClick={() => setShowAuth(false)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <button style={s.modalClose} onClick={() => setShowAuth(false)}>✕</button>
            <Auth />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navLogo}>
          <em style={{ fontStyle: 'normal', color: '#C9A84C' }}>1</em>Pick
        </div>
        <button style={s.navBtn} onClick={() => setShowAuth(true)}>Sign In</button>
      </nav>

      {/* Hero */}
      <section style={{ ...s.hero, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.7s ease, transform 0.7s ease' }}>
        <div style={s.heroBadge}>🏆 Free to Play · Friends Only</div>
        <h1 style={s.heroTitle}>
          Beat Your Friends.<br />
          <span style={s.heroAccent}>Every Week.</span>
        </h1>
        <p style={s.heroSub}>
          Make 6 picks across every major sport. Lock your units. Climb the leaderboard. 
          No house edge — just you vs. your friends.
        </p>
        <button style={s.heroBtn} onClick={() => setShowAuth(true)}>
          Get Started Free →
        </button>
        <div style={s.heroNote}>No credit card. No deposits. Just picks.</div>
      </section>

       {/* Social proof bar */}
      <div style={s.proofBar}>
        {[
          { val: '6', label: 'Pick Categories' },
          { val: '100', label: 'Units Per Session' },
          { val: 'Live', label: 'Odds Integration' },
          { val: '18+', label: 'To Play' },
        ].map(item => (
          <div key={item.label} style={s.proofItem}>
            <div style={s.proofVal}>{item.val}</div>
            <div style={s.proofLabel}>{item.label}</div>
          </div>
        ))}
      </div> 

      {/* How it works */}
      <section style={s.section}>
        <div style={s.sectionLabel}>How It Works</div>
        <div style={s.stepsGrid}>
          {[
            { n: '01', title: 'Create or Join a Pool', desc: 'Start a private pool with friends or join one with an invite code. Each pool is its own leaderboard.' },
            { n: '02', title: 'Make Your 6 Picks', desc: 'Every session you get 6 pick slots across ML Favorite, ML Underdog, Spread, and Totals. Live odds lock when you pick.' },
            { n: '03', title: 'Allocate Your 100 Units', desc: 'Spread your 100 units across your 6 picks however you want — max 40 per pick. ALL 100 units must be allocated.' },
            { n: '04', title: 'Results Update Live', desc: 'Wins and losses are calculated automatically. End up at the top of the leaderboard to win your group.' },
          ].map(step => (
            <div key={step.n} style={s.stepCard}>
              <div style={s.stepNum}>{step.n}</div>
              <div style={s.stepTitle}>{step.title}</div>
              <div style={s.stepDesc}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={s.section}>
        <div style={s.sectionLabel}>Everything You Need</div>
        <div style={s.featGrid}>
          {[
            { icon: '🎯', title: '6 Pick Categories', desc: 'ML Favorite · ML Underdog · Spread Fav · Spread Dog · Total Over · Total Under' },
            { icon: '🔒', title: 'Odds Lock on Pick', desc: 'The moment you make a pick your odds freeze. No line shopping, no last-second moves.' },
            { icon: '💰', title: 'Unit-Based Scoring', desc: '100 units per session. Payouts calculated on real odds. Underdogs pay more.' },
            { icon: '👥', title: 'Private Friend Pools', desc: 'Join via invite code. Each pool tracks its own leaderboard, sessions, and all-time records.' },
            { icon: '📊', title: 'Full Profile Stats', desc: 'Win rate, net units, record by category — broken down by sport.' },
            { icon: '🏈', title: 'Multi-Sport', desc: 'NFL · CFB · NBA · CBB · MLB · NHL. One app for every sport all season long.' },
          ].map(f => (
            <div key={f.title} style={s.featCard}>
              <div style={s.featIcon}>{f.icon}</div>
              <div style={s.featTitle}>{f.title}</div>
              <div style={s.featDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={s.section}>
        <div style={s.sectionLabel}>FAQ</div>
        <div style={s.faqList}>
          {[
            { q: 'Is this real money?', a: 'No. 1Pick is completely free to play. You compete with units, not dollars. It\'s all about bragging rights.' },
            { q: 'How are picks scored?', a: 'Wins pay out based on the odds locked at pick time. A -110 pick returns fewer units than a +200 underdog. Losses deduct the units you wagered.' },
            { q: 'What happens at the end of a session?', a: 'The commissioner can start a new session which resets picks for everyone. All-time stats and previous sessions are preserved.' },
            { q: 'Can I be in multiple pools?', a: 'Yes — you can join or create as many pools as you want. Each one is independent with its own leaderboard.' },
            { q: 'When do picks lock?', a: 'Picks lock automatically when the game starts. You can change your pick any time before tip-off or kickoff.' },
            { q: 'What does the Commissioner do?', a: 'The Commissioner is the person who creates the pool. They control when each session starts and ends — once they hit "New Session", all picks reset and a new round begins. All-time stats carry over. The Commissioner should let everyone know when they\'re ending a session so players have time to finalize their picks.' },
          ].map(item => (
            <FAQItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={s.ctaSection}>
        <h2 style={s.ctaTitle}>Ready to run it?</h2>
        <p style={s.ctaSub}>Set up your pool in under 2 minutes.</p>
        <button style={s.heroBtn} onClick={() => setShowAuth(true)}>Create Free Account →</button>
      </section>

      <footer style={s.footer}>
        <div style={s.footerLogo}><em style={{ fontStyle: 'normal', color: '#C9A84C' }}>1</em>Pick</div>
        <div style={s.footerNote}>For entertainment purposes only · 18+ · Play responsibly</div>
        <div style={s.footerNote}>Odds provided by The Odds API</div>
      </footer>
    </div>
  )
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={s.faqItem} onClick={() => setOpen(!open)}>
      <div style={s.faqQ}>
        <span>{q}</span>
        <span style={{ ...s.faqChevron, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
      </div>
      {open && <div style={s.faqA}>{a}</div>}
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#111', color: '#fff', fontFamily: "'Barlow', sans-serif", overflowX: 'hidden', position: 'relative' },
  bgGlow1: { position: 'fixed', top: '-200px', left: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(75,46,131,0.25) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 },
  bgGlow2: { position: 'fixed', bottom: '-200px', right: '-200px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 },

  nav: { position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  navLogo: { fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: '1.6rem', color: '#fff' },
  navBtn: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 20px', color: 'rgba(255,255,255,0.7)', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1.5px', cursor: 'pointer' },

  hero: { position: 'relative', zIndex: 1, textAlign: 'center', padding: '80px 24px 80px', maxWidth: '680px', margin: '0 auto' },
  heroBadge: { display: 'inline-block', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '20px', padding: '6px 16px', fontSize: '0.72rem', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '2px', color: '#C9A84C', marginBottom: '28px' },
  heroTitle: { fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 'clamp(2.4rem, 7vw, 4rem)', lineHeight: 1.1, margin: '0 0 20px', color: '#fff' },
  heroAccent: { color: '#C9A84C' },
  heroSub: { fontSize: '1.05rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: '36px', maxWidth: '500px', margin: '0 auto 36px' },
  heroBtn: { display: 'inline-block', background: 'linear-gradient(135deg, #4B2E83, #6b3fa0)', border: 'none', borderRadius: '12px', padding: '16px 36px', color: '#fff', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px', cursor: 'pointer', boxShadow: '0 8px 32px rgba(75,46,131,0.4)' },
  heroNote: { marginTop: '14px', fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '1px' },

  section: { position: 'relative', zIndex: 1, maxWidth: '960px', margin: '0 auto', padding: '60px 24px' },
  sectionLabel: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '4px', color: '#C9A84C', marginBottom: '32px', textAlign: 'center' },

  stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' },
  stepCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '24px' },
  stepNum: { fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: '2rem', color: 'rgba(201,168,76,0.3)', marginBottom: '12px', lineHeight: 1 },
  stepTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#fff', marginBottom: '8px' },
  stepDesc: { fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 },

  featGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' },
  featCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '22px' },
  featIcon: { fontSize: '1.6rem', marginBottom: '10px' },
  featTitle: { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#fff', marginBottom: '6px' },
  featDesc: { fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 },

  faqList: { maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' },
  faqItem: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px 20px', cursor: 'pointer' },
  faqQ: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#fff', gap: '12px' },
  faqChevron: { color: '#C9A84C', fontSize: '1.1rem', transition: 'transform 0.2s ease', flexShrink: 0 },
  faqA: { marginTop: '12px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' },

  ctaSection: { position: 'relative', zIndex: 1, textAlign: 'center', padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  ctaTitle: { fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', margin: '0 0 12px', color: '#fff' },
  ctaSub: { fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', marginBottom: '32px' },

  footer: { position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '28px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' },
  footerLogo: { fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: '1.2rem', color: '#fff', marginBottom: '4px' },
  footerNote: { fontSize: '0.65rem', fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.2)' },

  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modalBox: { position: 'relative', width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '20px' },
  modalClose: { position: 'absolute', top: '12px', right: '12px', zIndex: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', color: '#fff', fontSize: '1rem' },
  proofBar: { position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'center', gap: '0', flexWrap: 'wrap' },
  proofItem: { padding: '28px 48px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.06)' },
  proofVal: { fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: '2rem', color: '#C9A84C', lineHeight: 1 },
  proofLabel: { fontFamily: "'Barlow Condensed', sans-serif", fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' },
}