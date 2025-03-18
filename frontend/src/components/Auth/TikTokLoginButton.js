import React from 'react';
import { authService } from '../../services/api';
import './Auth.css';

const TikTokLoginButton = () => {
  const handleTikTokLogin = async () => {
    try {
      const { authUrl } = await authService.getTikTokAuthUrl();
      // Rediriger vers la page d'authentification TikTok
      window.location.href = authUrl;
    } catch (error) {
      console.error('Erreur lors de la génération de l\'URL TikTok:', error);
      alert('Impossible de se connecter avec TikTok pour le moment. Veuillez réessayer plus tard.');
    }
  };

  return (
    <button 
      className="tiktok-auth-button" 
      onClick={handleTikTokLogin}
    >
      <img 
        src="/tiktok-logo.png" 
        alt="TikTok Logo" 
        className="tiktok-logo" 
      />
      Se connecter avec TikTok
    </button>
  );
};

export default TikTokLoginButton;