import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Map from './components/Map';
import AuthContainer from './components/Auth/AuthContainer';
import TikTokCallback from './components/Auth/TikTokCallback';
import { authService } from './services/api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departmentName, setDepartmentName] = useState(null);
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          // Vérifier que le token est valide en récupérant le profil
          const userProfile = await authService.getProfile();
          setUser(userProfile);
          setIsAuthenticated(true);
          
          // Si l'utilisateur a déjà choisi un département, le définir
          if (userProfile.department) {
            setSelectedDepartment(userProfile.department);
            setDepartmentName(userProfile.departmentName);
          }
        }
      } catch (error) {
        console.error('Erreur d\'authentification:', error);
        authService.logout(); // Déconnecter si le token est invalide
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    
    // Si l'utilisateur a déjà choisi un département, le définir
    if (userData.department) {
      setSelectedDepartment(userData.department);
      setDepartmentName(userData.departmentName);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setSelectedDepartment(null);
    setDepartmentName(null);
    navigate('/');
  };

  const handleDepartmentSelect = async (deptId, deptName) => {
    if (isAuthenticated) {
      try {
        // Mettre à jour le département dans la base de données
        await authService.updateDepartment({
          department: deptId,
          departmentName: deptName
        });
        
        setSelectedDepartment(deptId);
        setDepartmentName(deptName);
      } catch (error) {
        console.error('Erreur lors de la mise à jour du département:', error);
      }
    } else {
      // Si non authentifié, simplement mettre à jour l'état local
      setSelectedDepartment(deptId);
      setDepartmentName(deptName);
    }
  };

  if (isLoading) {
    return (
      <div className="App">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        <Route 
          path="/auth/tiktok/callback" 
          element={<TikTokCallback />} 
        />
        <Route 
          path="*" 
          element={
            <>
              <header className="App-header">
                <h1>Guerre des Départements S2</h1>
                <p className="subtitle">Bataille de territoires interactive</p>
                
                {isAuthenticated && (
                  <div className="user-welcome">
                    <div className="user-info">
                      {user.profilePicture && (
                        <img 
                          src={user.profilePicture} 
                          alt="Profile" 
                          className="user-avatar" 
                        />
                      )}
                      <span>Bienvenue, <strong>{user.tiktokUsername || user.username}</strong>!</span>
                    </div>
                    <button onClick={handleLogout} className="logout-button">
                      Déconnexion
                    </button>
                  </div>
                )}
              </header>
              
              <main>
                {!isAuthenticated ? (
                  <AuthContainer onAuthSuccess={handleAuthSuccess} />
                ) : (
                  <>
                    <div className="instructions">
                      <h2>Comment jouer</h2>
                      <ul>
                        <li>Utilisez la molette pour zoomer sur la carte</li>
                        <li>Cliquez et faites glisser pour naviguer</li>
                        <li>Choisissez votre département pour commencer à jouer</li>
                      </ul>
                    </div>
                    
                    <Map 
                      onDepartmentSelect={handleDepartmentSelect}
                      selectedDepartment={selectedDepartment}
                    />
                    
                    {selectedDepartment && (
                      <div className="department-info">
                        <h3>Département sélectionné</h3>
                        <p>
                          <strong>Nom :</strong> {departmentName || 'Non disponible'}
                        </p>
                        <p>
                          <strong>Code :</strong> {selectedDepartment || 'Non disponible'}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </main>
            </>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;