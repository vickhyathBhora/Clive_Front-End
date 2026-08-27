import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  CircularProgress, 
  Alert, 
  Paper 
} from '@mui/material';
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
        // Pass access_token to backend for server-side verification
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
    <Container maxWidth="md">
      <Box className="portfolio-container">
        <Paper elevation={3} className="portfolio-card">
          <Typography variant="h3" component="h1" fontWeight="bold">
            Im Portfolio
          </Typography>

          <Typography variant="body1" color="text.secondary">
            Welcome to ChatLive. Click below to jump straight into conversation.
          </Typography>

          {error && (
            <Alert severity="error" className="portfolio-alert">
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            size="large"
            onClick={() => handleGoogleLogin()}
            disabled={loading}
            className="portfolio-btn"
          >
            {loading ? <CircularProgress size={26} color="inherit" /> : "Let's Chat"}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}