# Gestion des Tâches - API REST Node.js

## 📌 Description
Ce projet est une **API REST** développée avec **Node.js**, **Express** et **MongoDB**.  
Elle permet de gérer des tâches avec un système d’authentification par **JWT** (JSON Web Token).

Fonctionnalités :
- Création, lecture, mise à jour et suppression de tâches (**CRUD**)
- Authentification et gestion des utilisateurs
- Filtrage et pagination des tâches
- Sécurisation avec JWT
- Middleware d’authentification

---

## 📂 Structure du projet
├── config/
│ └── db.js # Connexion à MongoDB
├── controllers/
│ ├── authController.js # Gestion inscription/connexion
│ └── tacheController.js # Gestion des tâches
├── middlewares/
│ └── auth.js # Vérification du token
├── models/
│ ├── userModel.js # Modèle utilisateur
│ └── tacheModel.js # Modèle tâche
├── routes/
│ ├── authRoutes.js # Routes d’authentification
│ └── tacheRoutes.js # Routes pour les tâches
├── .env # Variables d’environnement (non versionné)
├── .gitignore # Fichiers/dossiers ignorés par git
├── package.json # Dépendances et scripts
├── server.js # Point d’entrée du serveur
└── README.md # Documentation

yaml
Copier
Modifier

---

## ⚙️ Installation

### 1️⃣ Cloner le projet
```bash
git clone https://github.com/mon-utilisateur/mon-projet.git
cd mon-projet
2️⃣ Installer les dépendances
bash
Copier
Modifier
npm install
3️⃣ Créer le fichier .env
Crée un fichier .env à la racine (ou dans config/.env) avec :

ini
Copier
Modifier
PORT=3000
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<db>
JWT_SECRET=monsecret
4️⃣ Lancer le serveur
bash
Copier
Modifier
npm start
ou

bash
Copier
Modifier
nodemon server.js
📌 Routes de l’API
Authentification
Méthode	Endpoint	Description	Auth requise
POST	/register	Inscription utilisateur	❌
POST	/login	Connexion utilisateur	❌

Gestion des tâches
Méthode	Endpoint	Description	Auth requise
POST	/api/tache	Créer une nouvelle tâche	✅
GET	/api/tache	Lister toutes les tâches	✅
GET	/api/tache/:id	Obtenir une tâche par ID	✅
PUT	/api/tache/:id	Modifier une tâche	✅
DELETE	/api/tache/:id	Supprimer une tâche	✅

🔑 Utilisation avec Postman
Créer un utilisateur

POST /register

Body JSON :

json
Copier
Modifier
{
  "username": "test",
  "email": "test@mail.com",
  "password": "123456"
}
Se connecter pour obtenir un token JWT

POST /login

Body JSON :

json
Copier
Modifier
{
  "email": "test@mail.com",
  "password": "123456"
}
Réponse :

json
Copier
Modifier
{
  "token": "votre_token_ici"
}
Utiliser le token dans les requêtes protégées
Dans Postman → Headers :

makefile
Copier
Modifier
Authorization: Bearer votre_token_ici
Lister les tâches avec pagination et filtres

GET /api/taches/tache?page=1&limit=5&status=done

🚀 Déploiement sur Render
Crée un compte sur Render

Crée un nouveau service Web

Connecte ton dépôt GitHub

Ajoute tes variables d’environnement dans l’onglet Environment

Définis la commande de lancement :

sql
Copier
Modifier
npm start
Lance le déploiement 🚀

👨‍💻 Auteur
Nom : Aissatou Diallo

Email : ton-email@mail.com

GitHub : ton-github

📜 Licence
Ce projet est sous licence MIT. Vous pouvez le réutiliser librement.

yaml
Copier
Modifier

---

Veux-tu que je te prépare aussi **une version avec des exemples réels de requêtes Postman déjà prêts à importer** pour que tes futurs utilisateurs testent l’API directement ?  
Ça rendrait la documentation encore plus pratique.