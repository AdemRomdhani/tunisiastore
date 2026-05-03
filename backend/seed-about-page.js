const mongoose = require('mongoose');
require('dotenv').config();

const CMS = require('./src/models/CMS');

const aboutUsPage = {
  slug: 'a-propos',
  title: 'À propos de nous',
  content: `<div class="max-w-4xl mx-auto px-4 py-8">
  <h1 class="text-4xl font-bold text-gray-900 mb-6 text-center">À propos de Tunisia Store</h1>

  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
    <p class="text-lg text-gray-600 leading-relaxed mb-6">
     Bienvenue sur <strong>Tunisia Store</strong>, votre destination privilégiée pour les produits technologiques de qualité en Tunisie. Nous nous engageons à vous offrir une expérience d'achat en ligne simple, sécurisée et fiable.
    </p>
    <p class="text-lg text-gray-600 leading-relaxed">
      Depuis notre fondation, nous avons à cœur de proposer les dernières innovations en matière d'électronique, avec un service client réactif et des livraison rapides dans tout le pays.
    </p>
  </div>

  <h2 class="text-2xl font-bold text-gray-900 mb-4">Nos engagements</h2>
  <div class="grid md:grid-cols-3 gap-6 mb-8">
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
      <div class="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
      </div>
      <h3 class="font-semibold text-gray-900 mb-2">Produits authentiques</h3>
      <p class="text-gray-500 text-sm">100% originaux avec garantie officielle</p>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
      <div class="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      </div>
      <h3 class="font-semibold text-gray-900 mb-2">Livraison rapide</h3>
      <p class="text-gray-500 text-sm">Livraison sous 24-72h dans toute la Tunisie</p>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
      <div class="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
      </div>
      <h3 class="font-semibold text-gray-900 mb-2">Support 7j/7</h3>
      <p class="text-gray-500 text-sm">Assistance clientèle disponible</p>
    </div>
  </div>

  <h2 class="text-2xl font-bold text-gray-900 mb-4">Contactez-nous</h2>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
    <div class="grid md:grid-cols-2 gap-6">
      <div>
        <p class="text-gray-600 mb-4">📍 <strong>Adresse:</strong><br>Tunis, Tunisia</p>
        <p class="text-gray-600 mb-4">📞 <strong>Téléphone:</strong><br>+216 00 000 000</p>
      </div>
      <div>
        <p class="text-gray-600 mb-4">✉️ <strong>Email:</strong><br>contact@tunisiastore.tn</p>
        <p class="text-gray-600">🕐 <strong>Heures d'ouverture:</strong><br>Lundi - Samedi: 9h - 18h</p>
      </div>
    </div>
  </div>
</div>`,
  type: 'PAGE',
  isActive: true,
  order: 1
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await CMS.findOne({ slug: 'a-propos' });
    if (existing) {
      console.log('Page already exists, updating...');
      await CMS.findByIdAndUpdate(existing._id, aboutUsPage);
      console.log('Page updated!');
    } else {
      await CMS.create(aboutUsPage);
      console.log('Page created!');
    }

    await mongoose.disconnect();
    console.log('Done!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

seed();