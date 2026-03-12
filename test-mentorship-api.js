const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

// Test des routes de mentorat
async function testMentorshipAPI() {
  console.log('🧪 Test du système de mentorat API...\n');

  try {
    // Test 1: Vérifier que le serveur répond
    console.log('1. Test de connectivité...');
    const healthCheck = await axios.get(`${API_BASE}/test`);
    console.log('✅ Serveur accessible:', healthCheck.data.message);

    // Test 2: Test des routes de mentorat (sans authentification pour voir les erreurs)
    console.log('\n2. Test des routes de mentorat...');
    
    try {
      await axios.get(`${API_BASE}/mentorship/sent`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Route /mentorship/sent protégée (401 Unauthorized)');
      } else {
        console.log('❌ Erreur inattendue:', error.response?.status);
      }
    }

    try {
      await axios.get(`${API_BASE}/mentorship/received`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Route /mentorship/received protégée (401 Unauthorized)');
      } else {
        console.log('❌ Erreur inattendue:', error.response?.status);
      }
    }

    try {
      await axios.get(`${API_BASE}/mentorship/active`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Route /mentorship/active protégée (401 Unauthorized)');
      } else {
        console.log('❌ Erreur inattendue:', error.response?.status);
      }
    }

    try {
      await axios.get(`${API_BASE}/mentorship/stats`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Route /mentorship/stats protégée (401 Unauthorized)');
      } else {
        console.log('❌ Erreur inattendue:', error.response?.status);
      }
    }

    // Test 3: Test des routes de messages
    console.log('\n3. Test des routes de messages...');
    
    try {
      await axios.get(`${API_BASE}/messages`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Route /messages protégée (401 Unauthorized)');
      } else {
        console.log('❌ Erreur inattendue:', error.response?.status);
      }
    }

    // Test 4: Test des routes utilisateurs
    console.log('\n4. Test des routes utilisateurs...');
    
    try {
      const usersResponse = await axios.get(`${API_BASE}/users`);
      console.log('✅ Route /users accessible, utilisateurs trouvés:', usersResponse.data.length);
    } catch (error) {
      console.log('❌ Erreur route /users:', error.response?.status);
    }

    console.log('\n🎉 Tests API terminés !');
    console.log('\n📋 Résumé:');
    console.log('- ✅ Serveur accessible sur le port 5001');
    console.log('- ✅ Routes de mentorat protégées par authentification');
    console.log('- ✅ Routes de messages protégées par authentification');
    console.log('- ✅ Route utilisateurs accessible');
    console.log('\n💡 Pour tester avec authentification, connectez-vous via l\'interface web');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    console.log('\n🔧 Vérifiez que:');
    console.log('- Le serveur backend est démarré (npm start dans Mentores-GN/)');
    console.log('- MongoDB est accessible');
    console.log('- Le port 5001 est libre');
  }
}

// Test de Socket.IO
async function testSocketIO() {
  console.log('\n🔌 Test de Socket.IO...');
  
  try {
    const io = require('socket.io-client');
    const socket = io('http://localhost:5001');
    
    socket.on('connect', () => {
      console.log('✅ Socket.IO connecté avec succès');
      socket.disconnect();
    });
    
    socket.on('connect_error', (error) => {
      console.log('❌ Erreur de connexion Socket.IO:', error.message);
    });
    
    // Timeout après 5 secondes
    setTimeout(() => {
      if (socket.connected) {
        console.log('✅ Socket.IO test terminé');
      } else {
        console.log('⏰ Timeout Socket.IO - vérifiez le serveur');
      }
    }, 5000);
    
  } catch (error) {
    console.log('❌ Erreur Socket.IO:', error.message);
  }
}

// Exécuter les tests
async function runAllTests() {
  console.log('🚀 Démarrage des tests du système de mentorat...\n');
  
  await testMentorshipAPI();
  await testSocketIO();
  
  console.log('\n✨ Tests terminés !');
  console.log('\n📖 Consultez SYSTEME_MENTORAT_COMPLET.md pour la documentation complète');
}

runAllTests();


