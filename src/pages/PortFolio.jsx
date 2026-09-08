import React, { useState, useRef, useEffect } from 'react';
import { Typography, Button, Container, CircularProgress, Alert } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import StorageIcon from '@mui/icons-material/Storage';
import MemoryIcon from '@mui/icons-material/Memory';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TerminalIcon from '@mui/icons-material/Terminal';
import CodeIcon from '@mui/icons-material/Code';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../utils/api';
import { GOOGLE_AUTH_URL } from '../utils/constant';
import bgDesktop from '../assets/BGImage.jpeg';
import bgMobile from '../assets/BGImg.jpeg';
import profileImg from '../assets/profile.jpeg';
import demoVideo from '../assets/vedio.mp4';
import './PortFolio.css';

export function Portfolio() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Video State
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false); // Default to unmuted
  const videoRef = useRef(null);

  // Sync state directly to native HTML video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      videoRef.current.volume = 1.0;
    }
  }, [isMuted]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        const response = await apiPost(GOOGLE_AUTH_URL, { token: tokenResponse.access_token });
        if (response?.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          navigate('/dashboard');
        } else {
          setError('Authentication failed. No token received.');
        }
      } catch (err) {
        console.error('Google sign-in error:', err);
        setError('Failed to authenticate with Google. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google sign-in was cancelled or failed.')
  });

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => console.error("Playback error:", err));
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuteState = !isMuted;
      videoRef.current.muted = newMuteState;
      videoRef.current.volume = 1.0;
      setIsMuted(newMuteState);

      if (!newMuteState && videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true));
      }
    }
  };

  return (
   <div 
    className="dev-portfolio"
    style={{
      '--bg-desktop': `url(${bgDesktop})`,
      '--bg-mobile': `url(${bgMobile})`
    }}
  >
      <div className="bg-grid-overlay"></div>
      <div className="glow-blur glow-top-left"></div>
      <div className="glow-blur glow-bottom-right"></div>

      <nav className="sys-nav">
        <div className="sys-logo">
          <span className="logo-badge">VB</span>
          <span className="logo-title">Vickhyath Bhora</span>
          <span className="role-tag desktop-only">Full-Stack Engineer</span>
        </div>
        <div className="sys-metrics">
          <div className="metric-item">
            <span className="status-indicator active"></span>
            <span className="metric-label desktop-only">System Status:</span>
            <span className="metric-val">100% Operational</span>
          </div>
          <div className="metric-item desktop-only">
            <span className="metric-label">Architecture:</span>
            <span className="metric-val">Distributed Real-Time Engine</span>
          </div>
        </div>
      </nav>

      <main className="dev-hero">
        <Container maxWidth="xl" className="hero-grid">

          <div className="hero-left">
            <div className="developer-profile-header">
              <div className="avatar-frame">
                <img src={profileImg} alt="Vickhyath Bhora" className="avatar-img" />
              </div>
              <div className="profile-text">
                <Typography variant="h6" className="dev-name">Vickhyath Bhora</Typography>
                <Typography variant="body2" className="dev-location">Bengaluru, KA • vickhyathbhora@gmail.com</Typography>
              </div>
            </div>

            <h1 className="hero-title">
              <span className="highlight-text">ChatLive</span> - Engineered for High Concurrency & <span className="highlight-text">Real-Time Messaging</span>
            </h1>

            <p className="hero-description">
              Full-stack engineer specializing in building distributed real-time engines with React, Node.js, custom database indexing pipelines, and resilient multi-node backend clusters.
            </p>

            <div className="stack-pills">
              <span className="tech-pill"><CodeIcon fontSize="inherit" /> React.js</span>
              <span className="tech-pill"><TerminalIcon fontSize="inherit" /> Node.js</span>
              <span className="tech-pill"><FlashOnIcon fontSize="inherit" /> WebSockets</span>
              <span className="tech-pill"><MemoryIcon fontSize="inherit" /> Redis Pub/Sub</span>
              <span className="tech-pill"><StorageIcon fontSize="inherit" /> PostgreSQL</span>
            </div>

            {error && <Alert severity="error" className="auth-alert">{error}</Alert>}

            <div className="action-row">
              <Button
                variant="contained"
                onClick={() => handleGoogleLogin()}
                disabled={loading}
                className="btn-google-auth"
                startIcon={!loading && <GoogleIcon />}
              >
                {loading ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  <>
                    ChatLive <ArrowForwardIcon sx={{ fontSize: '1.5rem', verticalAlign: 'middle', ml: 0.5 }} />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* RIGHT COLUMN: VIDEO WITH NATIVE CONTROLS + CUSTOM BUTTON OVERLAY */}
          <div className="hero-right">
            <div className="video-card-frame" style={{ position: 'relative' }}>
              <video
                ref={videoRef}
                src={demoVideo}
                autoPlay
                controls
                loop
                playsInline
                className="hero-demo-video"
                style={{ width: '100%', borderRadius: '12px' }}
              />
              <div 
                className="video-controls"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  display: 'flex',
                  gap: '8px',
                  zIndex: 20
                }}
              >
                <button 
                  onClick={togglePlay} 
                  type="button" 
                  style={{
                    background: 'rgba(0, 0, 0, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                </button>
                <button 
                  onClick={toggleMute} 
                  type="button" 
                  style={{
                    background: 'rgba(0, 0, 0, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
                </button>
              </div>
            </div>
          </div>

        </Container>
      </main>
    </div>
  );
}