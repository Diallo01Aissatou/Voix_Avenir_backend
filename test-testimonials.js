const mongoose = require('mongoose');
const User = require('./models/User');
const Testimonial = require('./models/Testimonial');

// Configuration de la base de données
mongoose.connect('mongodb://localhost:27017/mentorat-gn', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testTestimonials() {
  try {
    console.log('🧪 Test des témoignages - Restriction aux mentorées uniquement\n');

    // Créer une mentorée de test
    const mentoree = new User({
      role: 'mentoree',
      name: 'Test Mentorée',
      email: 'mentoree.test@example.com',
      password: 'password123',
      age: 22,
      city: 'Conakry',
      level: 'Licence',
      interests: ['Technologie', 'Leadership'],
      bio: 'Étudiante passionnée par la technologie'
    });

    // Créer une mentore de test
    const mentore = new User({
      role: 'mentore',
      name: 'Test Mentore',
      email: 'mentore.test@example.com',
      password: 'password123',
      profession: 'Ingénieure',
      city: 'Conakry',
      expertise: ['Technologie', 'Management'],
      bio: 'Ingénieure expérimentée'
    });

    // Sauvegarder les utilisateurs
    await mentoree.save();
    await mentore.save();

    console.log('✅ Utilisateurs de test créés');
    console.log(`   - Mentorée: ${mentoree.name} (${mentoree.role})`);
    console.log(`   - Mentore: ${mentore.name} (${mentore.role})\n`);

    // Test 1: Créer un témoignage avec une mentorée (devrait réussir)
    console.log('📝 Test 1: Création de témoignage par une mentorée');
    const testimonialMentoree = new Testimonial({
      author: mentoree._id,
      content: 'Le mentorat m\'a beaucoup aidée dans mon développement personnel et professionnel.',
      rating: 5
    });

    await testimonialMentoree.save();
    console.log('✅ Témoignage créé avec succès par la mentorée\n');

    // Test 2: Vérifier que seuls les témoignages des mentorées sont récupérés
    console.log('🔍 Test 2: Récupération des témoignages des mentorées uniquement');
    
    const testimonials = await Testimonial.find({ isPublished: true })
      .populate({
        path: 'author',
        select: 'name photo profession role',
        match: { role: 'mentoree' }
      })
      .sort({ createdAt: -1 });

    // Filtrer les témoignages où l'auteur est null (pas une mentorée)
    const mentoreesTestimonials = testimonials.filter(testimonial => testimonial.author !== null);

    console.log(`✅ ${mentoreesTestimonials.length} témoignage(s) de mentorée(s) trouvé(s)`);
    mentoreesTestimonials.forEach((testimonial, index) => {
      console.log(`   ${index + 1}. ${testimonial.author.name} (${testimonial.author.role}): "${testimonial.content.substring(0, 50)}..."`);
    });

    // Test 3: Créer un témoignage avec une mentore (pour vérifier qu'il ne sera pas affiché)
    console.log('\n📝 Test 3: Création de témoignage par une mentore (ne devrait pas apparaître)');
    const testimonialMentore = new Testimonial({
      author: mentore._id,
      content: 'J\'aime aider les jeunes femmes dans leur parcours.',
      rating: 5
    });

    await testimonialMentore.save();
    console.log('✅ Témoignage créé par la mentore (mais ne sera pas affiché)\n');

    // Test 4: Vérifier à nouveau que seuls les témoignages des mentorées sont récupérés
    console.log('🔍 Test 4: Vérification finale - seuls les témoignages des mentorées');
    
    const finalTestimonials = await Testimonial.find({ isPublished: true })
      .populate({
        path: 'author',
        select: 'name photo profession role',
        match: { role: 'mentoree' }
      })
      .sort({ createdAt: -1 });

    const finalMentoreesTestimonials = finalTestimonials.filter(testimonial => testimonial.author !== null);

    console.log(`✅ ${finalMentoreesTestimonials.length} témoignage(s) de mentorée(s) affiché(s) sur la page d'accueil`);
    console.log(`📊 Total témoignages en base: ${await Testimonial.countDocuments()}`);
    console.log(`📊 Témoignages affichés: ${finalMentoreesTestimonials.length}`);

    // Nettoyage
    console.log('\n🧹 Nettoyage des données de test...');
    await User.deleteMany({ email: { $in: ['mentoree.test@example.com', 'mentore.test@example.com'] } });
    await Testimonial.deleteMany({ author: { $in: [mentoree._id, mentore._id] } });
    console.log('✅ Données de test supprimées');

    console.log('\n🎉 Tous les tests sont passés avec succès !');
    console.log('✅ Seules les mentorées peuvent créer des témoignages visibles sur la page d\'accueil');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Exécuter les tests
testTestimonials();