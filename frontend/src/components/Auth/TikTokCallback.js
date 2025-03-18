import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api';

const TikTokCallback = () => {
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleTikTokCallback = async () => {
      // Récupérer le code d'autorisation TikTok de l'URL
      const urlParams = new URLSearchParams(location.search);
      const code = urlParams.get('code');
      const errorMsg = urlParams.get('error');

      if (errorMsg) {
        setError(`Erreur TikTok : ${errorMsg}`);
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      if (!code) {
        setError('Code d\'autorisation manquant');
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      try {
        // Échanger le code contre un token
        await authService.loginWithTikTok(code);
        // Rediriger vers la page d'accueil
        navigate('/');
      } catch (err) {
        console.error('Erreur lors de l\'authentification TikTok:', err);
        setError('Erreur lors de l\'authentification TikTok. Veuillez réessayer.');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleTikTokCallback();
  }, [location, navigate]);

  return (
    <div className="tiktok-callback">
      {error ? (
        <div className="auth-error">{error}</div>
      ) : (
        <div className="loading">
          <p>Authentification TikTok en cours...</p>
        </div>
      )}
    </div>
  );
};

export default TikTokCallback;