const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

const app = express();
const port = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Middleware
app.use(cors());
app.use(express.json());

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/guerre-departements', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connexion à MongoDB établie'))
.catch(err => console.error('Erreur de connexion à MongoDB:', err));

// Ajoutez ces imports au début du fichier
const axios = require('axios');
const querystring = require('querystring');

// Remplacez avec vos identifiants TikTok
const TIKTOK_CLIENT_ID = process.env.TIKTOK_CLIENT_ID;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const TIKTOK_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || 'http://localhost:3000/auth/tiktok/callback';

// Routes pour l'authentification TikTok
app.get('/api/auth/tiktok', (req, res) => {
  const authUrl = `https://www.tiktok.com/auth/authorize/?client_key=${TIKTOK_CLIENT_ID}&scope=user.info.basic&response_type=code&redirect_uri=${TIKTOK_REDIRECT_URI}&state=${generateRandomState()}`;
  res.json({ authUrl });
});

// Fonction pour générer un état aléatoire pour la sécurité OAuth
function generateRandomState() {
  return Math.random().toString(36).substring(2, 15);
}

app.post('/api/auth/tiktok/callback', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Code d\'autorisation manquant' });
    }

    // Échanger le code contre un token d'accès
    const tokenResponse = await axios.post('https://open-api.tiktok.com/oauth/access_token/', 
      querystring.stringify({
        client_key: TIKTOK_CLIENT_ID,
        client_secret: TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: TIKTOK_REDIRECT_URI
      }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, open_id } = tokenResponse.data.data;

    if (!access_token || !open_id) {
      return res.status(400).json({ message: 'Échec de l\'authentification TikTok' });
    }

    // Récupérer les informations de l'utilisateur
    const userInfoResponse = await axios.get(`https://open-api.tiktok.com/user/info/?open_id=${open_id}&access_token=${access_token}`);
    
    const tiktokUser = userInfoResponse.data.data.user;
    
    // Vérifier si l'utilisateur existe déjà dans notre base de données
    let user = await User.findOne({ tiktokId: open_id });
    
    if (!user) {
      // Créer un nouvel utilisateur avec les données TikTok
      user = new User({
        username: tiktokUser.nickname || `tiktok_user_${open_id.substring(0, 8)}`,
        tiktokId: open_id,
        profilePicture: tiktokUser.avatar_url,
        tiktokUsername: tiktokUser.nickname,
        tiktokFollowers: tiktokUser.follower_count
      });
      
      await user.save();
    } else {
      // Mettre à jour les informations TikTok existantes
      user.tiktokUsername = tiktokUser.nickname;
      user.profilePicture = tiktokUser.avatar_url;
      user.tiktokFollowers = tiktokUser.follower_count;
      
      await user.save();
    }

    // Générer un token JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, tiktokId: user.tiktokId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Connexion TikTok réussie',
      token,
      user: {
        id: user._id,
        username: user.username,
        department: user.department,
        departmentName: user.departmentName,
        level: user.level,
        experience: user.experience,
        nextLevelExp: user.nextLevelExp,
        tiktokUsername: user.tiktokUsername,
        profilePicture: user.profilePicture
      }
    });
    
  } catch (error) {
    console.error('Erreur d\'authentification TikTok:', error);
    res.status(500).json({ 
      message: 'Erreur lors de l\'authentification TikTok',
      error: error.message
    });
  }
});

// Modèle d'utilisateur (à mettre à jour)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Pas obligatoire pour l'auth sociale
  email: { type: String, required: false, unique: true, sparse: true }, // Email pas obligatoire pour TikTok
  department: { type: String, default: null },
  departmentName: { type: String, default: null },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  nextLevelExp: { type: Number, default: 100 },
  lastAttack: { type: Date, default: null },
  cooldown: { type: Number, default: 60 },
  
  // Champs pour TikTok
  tiktokId: { type: String, unique: true, sparse: true },
  tiktokUsername: { type: String },
  profilePicture: { type: String },
  tiktokFollowers: { type: Number },
  
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Routes d'authentification
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Nom d\'utilisateur ou email déjà utilisé' });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un nouvel utilisateur
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    // Générer un token JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        department: user.department,
        departmentName: user.departmentName,
        level: user.level,
        experience: user.experience,
        nextLevelExp: user.nextLevelExp
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'inscription', error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Trouver l'utilisateur
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect' });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        department: user.department,
        departmentName: user.departmentName,
        level: user.level,
        experience: user.experience,
        nextLevelExp: user.nextLevelExp,
        lastAttack: user.lastAttack
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la connexion', error: error.message });
  }
});

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token d\'authentification requis' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalide ou expiré' });
    }
    req.user = user;
    next();
  });
};

// Route protégée pour récupérer le profil de l'utilisateur
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du profil', error: error.message });
  }
});

// Route pour mettre à jour le département de l'utilisateur
app.put('/api/user/department', authenticateToken, async (req, res) => {
  try {
    const { department, departmentName } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { department, departmentName },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Département mis à jour avec succès',
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du département', error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('API de Guerre des Départements S2');
});

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});