'use client'

import { useState, useEffect } from 'react'
import { getSpotifyAccessToken } from '@/app/actions'
import { authClient } from '@/lib/auth-client'

export default function TestSpotifyPage() {
  const { data: session } = authClient.useSession()
  const [token, setToken] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])
  const [playerReady, setPlayerReady] = useState(false)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [nowPlaying, setNowPlaying] = useState<{ name: string; artist: string; art: string; paused: boolean } | null>(null)
  const [accountInfo, setAccountInfo] = useState<string | null>(null)
  const [statuses, setStatuses] = useState({
    auth: { cls: 'wait', msg: 'Checking session...' },
    sdk: { cls: 'wait', msg: 'Waiting for auth...' },
    play: { cls: 'wait', msg: 'Waiting for SDK...' },
    account: { cls: 'wait', msg: 'Waiting for auth...' },
  })

  const addLog = (msg: string) => setLog((prev) => [...prev, `${new Date().toLocaleTimeString()} — ${msg}`])
  const setStatus = (key: string, cls: string, msg: string) =>
    setStatuses((prev) => ({ ...prev, [key]: { cls, msg } }))

  // Step 1: Get token from existing auth
  useEffect(() => {
    if (!session) {
      setStatus('auth', 'fail', 'Not signed in — sign in with Spotify on the main app first')
      return
    }

    addLog(`Session found: ${session.user.email}`)
    setStatus('auth', 'wait', 'Fetching Spotify token...')

    getSpotifyAccessToken().then((t) => {
      if (t) {
        setToken(t)
        addLog('Got Spotify access token')
        setStatus('auth', 'pass', 'Spotify token acquired')
      } else {
        addLog('No Spotify token — sign in with Spotify on the main app')
        setStatus('auth', 'fail', 'No Spotify token available')
      }
    })
  }, [session])

  // Step 2: Check account type
  useEffect(() => {
    if (!token) return

    fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        addLog(`Account: ${data.display_name} (${data.product})`)
        setAccountInfo(`${data.display_name} — ${data.product}`)
        if (data.product === 'premium') {
          setStatus('account', 'pass', `Premium: ${data.display_name} — Playback supported!`)
        } else {
          setStatus('account', 'fail', `${data.product}: ${data.display_name} — Web Playback requires Premium`)
        }
      })
      .catch((e) => {
        addLog(`Account check failed: ${e.message}`)
        setStatus('account', 'fail', e.message)
      })
  }, [token])

  // Step 3: Initialize Web Playback SDK
  useEffect(() => {
    if (!token) return

    setStatus('sdk', 'wait', 'Loading Web Playback SDK...')
    addLog('Loading SDK...')

    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true
    document.body.appendChild(script)

    window.onSpotifyWebPlaybackSDKReady = () => {
      addLog('SDK loaded, creating player...')

      const player = new Spotify.Player({
        name: 'Crank Test Player',
        getOAuthToken: (cb) => cb(token),
        volume: 0.5,
      })

      player.addListener('ready', ({ device_id }) => {
        setDeviceId(device_id)
        setPlayerReady(true)
        addLog(`Player ready! Device: ${device_id}`)
        setStatus('sdk', 'pass', 'Player ready')
        setStatus('play', 'info', 'Ready — click Play below')
      })

      player.addListener('not_ready', () => {
        addLog('Player not ready')
        setStatus('sdk', 'fail', 'Player not ready')
      })

      player.addListener('initialization_error', ({ message }) => {
        addLog(`Init error: ${message}`)
        setStatus('sdk', 'fail', `Init error: ${message}`)
      })

      player.addListener('authentication_error', ({ message }) => {
        addLog(`Auth error: ${message}`)
        setStatus('sdk', 'fail', `Auth error: ${message}`)
      })

      player.addListener('account_error', ({ message }) => {
        addLog(`Account error: ${message}`)
        setStatus('sdk', 'fail', `Premium required: ${message}`)
      })

      player.addListener('player_state_changed', (state) => {
        if (!state) return
        const track = state.track_window.current_track
        addLog(`${state.paused ? 'Paused' : 'Playing'}: ${track.name} — ${track.artists[0].name}`)
        setNowPlaying({
          name: track.name,
          artist: track.artists.map((a) => a.name).join(', '),
          art: track.album.images[0]?.url || '',
          paused: state.paused,
        })
      })

      addLog('Connecting...')
      player.connect().then((ok) => {
        if (ok) addLog('Connected')
        else {
          addLog('Connection failed')
          setStatus('sdk', 'fail', 'Connection failed')
        }
      })

      // Store on window for play/pause buttons
      ;(window as unknown as Record<string, unknown>).__testPlayer = player
    }

    if (window.Spotify) window.onSpotifyWebPlaybackSDKReady?.()

    return () => {
      const p = (window as unknown as Record<string, unknown>).__testPlayer as Spotify.Player | undefined
      p?.disconnect()
    }
  }, [token])

  const playTrack = async () => {
    if (!deviceId || !token) return
    const uri = 'spotify:track:59WN2psjkt1tyaxjspN8fp' // Killing In The Name
    addLog('Playing...')
    setStatus('play', 'wait', 'Starting playback...')
    try {
      const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uris: [uri] }),
      })
      if (res.ok || res.status === 204) {
        addLog('Playback started!')
        setStatus('play', 'pass', 'Playing! Check your speakers.')
      } else {
        const err = await res.json().catch(() => ({}))
        addLog(`Failed (${res.status}): ${JSON.stringify(err)}`)
        setStatus('play', 'fail', `Failed: ${(err as { error?: { message?: string } }).error?.message || res.status}`)
      }
    } catch (e) {
      addLog(`Error: ${(e as Error).message}`)
      setStatus('play', 'fail', (e as Error).message)
    }
  }

  const pause = () => {
    const p = (window as unknown as Record<string, unknown>).__testPlayer as Spotify.Player | undefined
    p?.pause()
  }
  const resume = () => {
    const p = (window as unknown as Record<string, unknown>).__testPlayer as Spotify.Player | undefined
    p?.resume()
  }

  const statusStyle = (cls: string) => ({
    padding: '8px 12px',
    borderRadius: '4px',
    margin: '4px 0',
    fontSize: '14px',
    borderLeft: `3px solid ${cls === 'pass' ? '#1db954' : cls === 'fail' ? '#e74646' : cls === 'info' ? '#3498db' : '#f0ad4e'}`,
    background: cls === 'pass' ? '#1db95422' : cls === 'fail' ? '#e7464622' : cls === 'info' ? '#3498db22' : '#f0ad4e22',
  })

  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: 600, margin: '40px auto', padding: '0 20px', background: '#1a1a2e', color: '#e0e0e0', minHeight: '100vh' }}>
      <h1 style={{ color: '#1db954' }}>Crank — Spotify Playback Test</h1>
      <p>Tests the full pipeline: Auth → Web Playback SDK → Play</p>

      {(['auth', 'sdk', 'play', 'account'] as const).map((key, i) => (
        <div key={key} style={{ background: '#16213e', padding: 16, borderRadius: 8, margin: '12px 0' }}>
          <h3 style={{ margin: 0, color: '#a0a0a0', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Step {i + 1}: {key === 'auth' ? 'Spotify Auth' : key === 'sdk' ? 'Web Playback SDK' : key === 'play' ? 'Test Playback' : 'Account Check'}
          </h3>
          <div style={statusStyle(statuses[key].cls)}>{statuses[key].msg}</div>

          {key === 'auth' && !session && (
            <p style={{ fontSize: 13, color: '#a0a0a0' }}>
              Go to <a href="/generate" style={{ color: '#1db954' }}>the main app</a> and sign in with Spotify first, then come back here.
            </p>
          )}

          {key === 'play' && playerReady && (
            <div style={{ marginTop: 8 }}>
              <button onClick={playTrack} style={{ background: '#1db954', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 20, cursor: 'pointer', marginRight: 8 }}>
                Play "Killing In The Name"
              </button>
              <button onClick={pause} style={{ background: '#333', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 20, cursor: 'pointer', marginRight: 8 }}>
                Pause
              </button>
              <button onClick={resume} style={{ background: '#333', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 20, cursor: 'pointer' }}>
                Resume
              </button>
              {nowPlaying && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                  {nowPlaying.art && <img src={nowPlaying.art} alt="" style={{ width: 64, height: 64, borderRadius: 4 }} />}
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{nowPlaying.name}</div>
                    <div style={{ color: '#a0a0a0' }}>{nowPlaying.artist}</div>
                    <div style={{ color: '#1db954', fontSize: 12 }}>{nowPlaying.paused ? 'Paused' : 'Playing'}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <div style={{ background: '#16213e', padding: 16, borderRadius: 8, margin: '12px 0' }}>
        <h3 style={{ margin: 0, color: '#a0a0a0', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Log</h3>
        <div style={{ fontFamily: 'monospace', fontSize: 12, maxHeight: 200, overflowY: 'auto', marginTop: 8 }}>
          {log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
