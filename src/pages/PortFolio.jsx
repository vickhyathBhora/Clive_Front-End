import React, { useState } from 'react';
import { Typography, Button, Container, CircularProgress, Alert } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import StorageIcon from '@mui/icons-material/Storage';
import MemoryIcon from '@mui/icons-material/Memory';
import TerminalIcon from '@mui/icons-material/Terminal';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CodeIcon from '@mui/icons-material/Code';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../utils/api';
import { GOOGLE_AUTH_URL } from '../utils/constant';
import profileImg from '../assets/profile.jpeg';
import './PortFolio.css';

export function Portfolio() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('architecture');

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

  return (
    <div className="dev-portfolio">
      {/* BACKGROUND ACCENTS */}
      <div className="bg-grid-overlay"></div>
      <div className="glow-blur glow-top-left"></div>
      <div className="glow-blur glow-bottom-right"></div>

      {/* SYSTEM STATUS NAVBAR */}
      <nav className="sys-nav">
        <div className="sys-logo">
          <span className="logo-badge">VB</span>
          <span className="logo-title">Vickhyath Bhora</span>
          <span className="role-tag desktop-only">Full-Stack Engineer</span>
        </div>
        <div className="sys-metrics">
          <div className="metric-item">
            <span className="status-indicator active"></span>
            <span className="metric-label">System Status: 100% Operational</span>
          </div>
          <div className="metric-item desktop-only">
            <span className="metric-label">Stack:</span>
            <span className="metric-val">React / Node.js / Redis / Postgres</span>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="dev-hero">
        <Container maxWidth="xl" className="hero-grid">
          
          {/* LEFT COLUMN: PROFILE & CALL TO ACTION */}
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
              Engineered for High Concurrency & <span className="highlight-text">Zero-Latency Sync</span>
            </h1>

            <p className="hero-description">
              Full-stack engineer specializing in building distributed real-time engines with React, Node.js, custom database indexing pipelines, and resilient multi-node backend clusters.
            </p>

            {/* TECH STACK PILLS */}
            <div className="stack-pills">
              <span className="tech-pill"><CodeIcon fontSize="inherit" /> React.js</span>
              <span className="tech-pill"><TerminalIcon fontSize="inherit" /> Node.js</span>
              <span className="tech-pill"><FlashOnIcon fontSize="inherit" /> WebSockets</span>
              <span className="tech-pill"><MemoryIcon fontSize="inherit" /> Redis Pub/Sub</span>
              <span className="tech-pill"><StorageIcon fontSize="inherit" /> PostgreSQL</span>
            </div>

            {error && <Alert severity="error" className="auth-alert">{error}</Alert>}

            {/* CTA BUTTON */}
            <div className="action-row">
              <Button
                variant="contained"
                onClick={() => handleGoogleLogin()}
                disabled={loading}
                className="btn-google-auth"
                startIcon={!loading && <GoogleIcon />}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : "Launch ChatLive Demo (Google Login)"}
              </Button>
            </div>
          </div>

          {/* RIGHT COLUMN: INTERACTIVE ARCHITECTURE TERMINAL */}
          <div className="hero-right">
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="window-dots">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <div className="terminal-tabs">
                  <button 
                    className={`tab-btn ${activeTab === 'architecture' ? 'active' : ''}`}
                    onClick={() => setActiveTab('architecture')}
                  >
                    <TerminalIcon fontSize="small" /> Architecture.config
                  </button>
                  <button 
                    className={`tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('metrics')}
                  >
                    Metrics.log
                  </button>
                </div>
              </div>

              <div className="terminal-body">
                {activeTab === 'architecture' ? (
                  <div className="code-block">
                    <p className="code-line comment">// ChatLive Full-Stack Architecture Config</p>
                    <p className="code-line"><span className="keyword">const</span> <span className="variable">ChatLiveStack</span> = <span className="keyword">require</span>(<span className="string">'@chatlive/core'</span>);</p>
                    <br />
                    <p className="code-line"><span className="keyword">const</span> app = <span className="function">createEngine</span>({'{'}</p>
                    <p className="code-line indent"><span className="property">frontend</span>: <span className="string">'React.js Single Page App'</span>,</p>
                    <p className="code-line indent"><span className="property">backend</span>: <span className="string">'Node.js (Distributed Sockets)'</span>,</p>
                    <p className="code-line indent"><span className="property">stateCache</span>: <span className="string">'Redis Cluster Pub/Sub'</span>,</p>
                    <p className="code-line indent"><span className="property">database</span>: <span className="string">'PostgreSQL B-Tree Indexed'</span></p>
                    <p className="code-line">{'}'});</p>
                    <br />
                    <p className="code-line comment">// Native DB Pruning Trigger Enabled</p>
                    <p className="code-line"><span className="variable">app</span>.<span className="function">enableAutoPruning</span>({'{'} <span className="property">maxMessages</span>: <span className="number">20</span> {'}'});</p>
                  </div>
                ) : (
                  <div className="metrics-logs">
                    <div className="log-item"><CheckCircleIcon className="log-icon" /> [SUCCESS] React Dashboard Mounted (0ms)</div>
                    <div className="log-item"><CheckCircleIcon className="log-icon" /> [SUCCESS] Redis Pub/Sub Cluster Connected</div>
                    <div className="log-item"><CheckCircleIcon className="log-icon" /> [SUCCESS] PostgreSQL Composite B-Tree Index Active</div>
                    <div className="log-item"><CheckCircleIcon className="log-icon" /> [SUCCESS] WebSocket Connection Established</div>
                  </div>
                )}
              </div>

              <div className="terminal-footer">
                <span className="footer-status">STATUS: CLUSTER ONLINE</span>
                <span className="footer-link">clive-front-end.onrender.com</span>
              </div>
            </div>
          </div>

        </Container>
      </main>
    </div>
  );
}