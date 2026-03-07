import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Landing from './components/Landing'
import Main from './components/Main'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#111',color:'#fff',fontFamily:'sans-serif'}}>Loading...</div>

  return session ? <Main session={session} /> : <Landing />
}