import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  CircularProgress,
  Alert
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import SecurityIcon from '@mui/icons-material/Security';
import ForumIcon from '@mui/icons-material/Forum';
import DevicesIcon from '@mui/icons-material/Devices';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../utils/api';
import { GOOGLE_AUTH_URL } from '../utils/constant';
import './PortFolio.css';

export function Portfolio() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');

      try {
        const response = await apiPost(GOOGLE_AUTH_URL, {
          token: tokenResponse.access_token
        });

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
    <div className="portfolio-hero-wrapper">
      <div className="hero-glow glow-1"></div>
      <div className="hero-glow glow-2"></div>

      <Container maxWidth="sm" className="portfolio-container">
        {/* BRAND HEADER */}
        <header className="portfolio-header">
          <div className="portfolio-brand">
            <svg className="google-chat-logo" viewBox="0 0 24 24" width="26" height="26">
              <path fill="#00AC47" d="M12 2C6.48 2 2 6.48 2 12c0 2.17.69 4.19 1.87 5.84L2 22l4.34-1.74C7.94 21.36 9.89 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
            </svg>
            <span className="portfolio-title">ChatLive</span>
          </div>
        </header>

        {/* SINGLE HERO CARD */}
        <Box className="portfolio-card">
          <div className="status-badge">
            <span className="live-dot"></span>
            Real-Time Socket Messaging
          </div>

          <Typography variant="h2" className="hero-heading">
            Connect Instantly with <span className="gradient-text">ChatLive</span>
          </Typography>

          <Typography variant="body1" className="hero-subtitle">
            Experience lightning-fast communication, real-time sync, and seamless user discovery built for web and mobile.
          </Typography>

          {/* INLINE FEATURE CHIPS */}
          <div className="hero-features-chips">
            <div className="feature-chip blue">
              <FlashOnIcon fontSize="small" /> Ultra Fast
            </div>
            <div className="feature-chip green">
              <ForumIcon fontSize="small" /> Discovery
            </div>
            <div className="feature-chip purple">
              <DevicesIcon fontSize="small" /> Responsive
            </div>
            <div className="feature-chip orange">
              <SecurityIcon fontSize="small" /> Secure Auth
            </div>
          </div>

          {error && (
            <Alert severity="error" className="portfolio-alert">
              {error}
            </Alert>
          )}

          <div className="hero-cta-wrapper">
            <Button
              variant="contained"
              size="large"
              onClick={() => handleGoogleLogin()}
              disabled={loading}
              className="portfolio-btn primary-cta"
              startIcon={!loading && <GoogleIcon />}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Sign in with Google"}
            </Button>
          </div>
        </Box>
      </Container>
    </div>
  );
}