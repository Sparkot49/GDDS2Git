import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import TikTokLoginButton from './TikTokLoginButton';

const AuthContainer = ({ onAuthSuccess }) => {
  const [isLoginView, setIsLoginView] = useState(true);

  const switchToRegister = () => {
    setIsLoginView(false);
  };

  const switchToLogin = () => {
    setIsLoginView(true);
  };

  const handleLogin = (user) => {
    onAuthSuccess(user);
  };

  const handleRegister = (user) => {
    onAuthSuccess(user);
  };

  return (
    <div className="auth-container">
      <TikTokLoginButton />
      
      <div className="auth-separator">OU</div>
      
      {isLoginView ? (
        <LoginForm onLogin={handleLogin} switchToRegister={switchToRegister} />
      ) : (
        <RegisterForm onRegister={handleRegister} switchToLogin={switchToLogin} />
      )}
    </div>
  );
};

export default AuthContainer;