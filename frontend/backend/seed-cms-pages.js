const mongoose = require('mongoose');
require('dotenv').config();

const CMS = require('./src/models/CMS');

const cmsPages = [
  {
    slug: 'conditions-generales',
    title: 'Conditions Générales',
    content: `<div class="max-w-4xl mx-auto px-4 py-8">
  <h1 class="text-4xl font-bold text-gray-900 mb-6 text-center">Conditions Générales</h1>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
    <p class="text-lg text-gray-600 leading-relaxed mb-6">
      Les présentes conditions générales définissent les modalités d'utilisation du site Tunisia Store et les droits et obligations des parties dans le cadre de la vente en ligne de produits technologiques.
    </p>
    <h2 class="text-2xl font-bold text-gray-900 mb-4 mt-6">1. Objet</h2>
    <p class="text-gray-600 mb-4">Les présentes Conditions Générales ont pour objet de définir les droits et obligations des parties dans le cadre de la vente en ligne de produits proposés par Tunisia Store.</p>
    <h2 class="text-2xl font-bold text-gray-900 mb-4 mt-6">2. Commandes</h2>
    <p class="text-gray-600 mb-4">Toute commande passée sur notre site implique l'acceptation pleine et entière des présentes conditions générales de vente.</p>
    <h2 class="text-2xl font-bold text-gray-900 mb-4 mt-6">3. Prix et paiement</h2>
    <p class="text-gray-600 mb-4">Les prix indiqués sont en dinars tunisiens (TND). Le paiement s'effectue par carte bancaire, espèces ou virement bancaire.</p>
    <h2 class="text-2xl font-bold text-gray-900 mb-4 mt-6">4. Livraison</h2>
    <p class="text-gray-600 mb-4">La livraison est effectuée dans un délai de 24 à 72 heures dans toute la Tunisie.</p>
    <h2 class="text-2xl font-bold text-gray-900 mb-4 mt-6">5. Retours et remboursement</h2>
    <p class="text-gray-600 mb-4">Vous disposez de 14 jours pour retourner un produit non ouvert. Le remboursement est effectué sous 7 jours ouvrables.</p>
  </div>
</div>`,
    type: 'PAGE',
    isActive: true,
    order: 1
  },
  {
    slug: 'politique-confidentialite',
    title: 'Politique de Confidentialité',
    content: `<div class="max-w-4xl mx-auto px-4 py-8">
  <h1 class="text-4xl font-bold text-gray-900 mb-6 text-center">Politique de Confidentialité</h1>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
    <p class="text-lg text-gray-600 leading-relaxed mb-6">
      Tunisia Store s'engage à protéger la vie privée de ses clients et à sécuriser leurs données personnelles.
    </p>
    <h2 class="text-2xl font-bold text-gray-900 mb-4 mt-6">1. Collecte des données</h2>
    <p class="text-gray-600 mb-4">Nous collectons uniquement les informations nécessaires au traitement de votre commande et à l'amélioration de nos services.</p>
    <h2 class="text-2xl font-bold text-gray-900 mb-4 mt-6">2. Utilisation des données</h2>
    <p class="text-gray-600 mb-4">Vos données sont utilisées pour le traitement des commandes, la communication et l'envoi d'offres promotionnelles.</p>
    <h2 class="text-2xl font-bold text-gray-900 mb-4 mt-6">3. Sécurité</h2>
    <p class="text-gray-600 mb-4">Toutes vos données sont chiffrées et stockées de manière sécurisée.</p>
  </div>
</div>`,
    type: 'PAGE',
    isActive: true,
    order: 2
  },
  {
    slug: 'paiement',
    title: 'Méthodes de paiement',
    content: `<div class="max-w-4xl mx-auto px-4 py-8">
  <h1 class="text-4xl font-bold text-gray-900 mb-6 text-center">Méthodes de paiement</h1>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
    <p class="text-lg text-gray-600 leading-relaxed mb-6">
      Chez <strong>Tunisia Store</strong>, nous vous proposons plusieurs moyens de paiement sécurisés pour faciliter vos achats en ligne.
    </p>
    <p class="text-lg text-gray-600 leading-relaxed">
      Toutes vos transactions sont protégées et chiffrées pour garantir la sécurité de vos données personnelles et financières.
    </p>
  </div>
  <h2 class="text-2xl font-bold text-gray-900 mb-4">Modes de paiement disponibles</h2>
  <div class="grid md:grid-cols-3 gap-6 mb-8">
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
      <div class="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
      </div>
      <h3 class="font-semibold text-gray-900 mb-2">Carte Bancaire</h3>
      <p class="text-gray-500 text-sm">Visa, Mastercard, Cartes tunisiennes</p>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
      <div class="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
      </div>
      <h3 class="font-semibold text-gray-900 mb-2">Espèces</h3>
      <p class="text-gray-500 text-sm">Paiement à la livraison</p>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
      <div class="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      </div>
      <h3 class="font-semibold text-gray-900 mb-2">Virement bancaire</h3>
      <p class="text-gray-500 text-sm">Virement depuis votre banque</p>
    </div>
  </div>
  <div class="bg-green-50 rounded-xl border border-green-200 p-6">
    <div class="flex items-start">
      <svg class="w-6 h-6 text-green-600 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
      <div>
        <h3 class="font-semibold text-green-900 mb-2">Paiement sécurisé</h3>
        <p class="text-green-700 text-sm">Vos coordonnées bancaires sont cryptées et ne sont jamais stockées sur nos serveurs. Vous pouvez commander en toute tranquillité.</p>
      </div>
    </div>
  </div>
</div>`,
    type: 'PAGE',
    isActive: true,
    order: 3
  },
  {
    slug: 'comment-commander',
    title: 'Comment commander',
    content: `<div class="max-w-4xl mx-auto px-4 py-8">
  <h1 class="text-4xl font-bold text-gray-900 mb-6 text-center">Comment commander</h1>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
    <p class="text-lg text-gray-600 leading-relaxed">
      Commander sur <strong>Tunisia Store</strong> est simple et rapide. Suivez ces étapes pour passer votre commande en quelques minutes.
    </p>
  </div>
  <div class="grid md:grid-cols-2 gap-6 mb-8">
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative">
      <div class="absolute -top-3 -left-3 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
      <h3 class="font-semibold text-gray-900 mb-2 mt-2">Parcourez le catalogue</h3>
      <p class="text-gray-500 text-sm">Explorez nos catégories de produits technologiques et utilisez les filtres pour trouver ce que vous cherchez.</p>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative">
      <div class="absolute -top-3 -left-3 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
      <h3 class="font-semibold text-gray-900 mb-2 mt-2">Ajoutez au panier</h3>
      <p class="text-gray-500 text-sm">Cliquez sur "Ajouter au panier" pour les produits souhaités. Vous pouvez modifier les quantités à tout moment.</p>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative">
      <div class="absolute -top-3 -left-3 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
      <h3 class="font-semibold text-gray-900 mb-2 mt-2">Finalisez la commande</h3>
      <p class="text-gray-500 text-sm">Saisissez vos informations de livraison et choisissez votre mode de paiement.</p>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative">
      <div class="absolute -top-3 -left-3 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
      <h3 class="font-semibold text-gray-900 mb-2 mt-2">Confirmation</h3>
      <p class="text-gray-500 text-sm">Vous recevrez un email de confirmation avec les détails de votre commande et le suivi de livraison.</p>
    </div>
  </div>
  <div class="bg-blue-50 rounded-xl border border-blue-200 p-6">
    <h3 class="font-semibold text-blue-900 mb-3">💡 Besoin d'aide ?</h3>
    <p class="text-blue-700 text-sm mb-4">Notre équipe est disponible pour vous accompagner dans votre processus de commande.</p>
    <div class="flex flex-wrap gap-4 text-sm">
      <span>📞 <strong>Téléphone:</strong> +216 00 000 000</span>
      <span>✉️ <strong>Email:</strong> contact@tunisiastore.tn</span>
    </div>
  </div>
</div>`,
    type: 'PAGE',
    isActive: true,
    order: 4
  },
  {
    slug: 'a-propos',
    title: 'À propos de Tunisia Store',
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
    order: 5
  },
  {
    slug: 'livraisons-retours',
    title: 'Livraison & Retours',
    content: `<div class="max-w-4xl mx-auto px-4 py-8">
  <h1 class="text-4xl font-bold text-gray-900 mb-6 text-center">Livraison & Retours</h1>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
    <p class="text-lg text-gray-600 leading-relaxed mb-6">
      Chez <strong>Tunisia Store</strong>, nous nous engageons à vous offrir une expérience d'achat fluide, de la commande à la livraison.
    </p>
  </div>
  <h2 class="text-2xl font-bold text-gray-900 mb-4">Livraison</h2>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
    <ul class="space-y-3 text-gray-600">
      <li class="flex items-start gap-3">
        <span class="text-green-500">✓</span>
        <div><strong>Livraison rapide:</strong> 24-72h dans toute la Tunisie</div>
      </li>
      <li class="flex items-start gap-3">
        <span class="text-green-500">✓</span>
        <div><strong>Livraison gratuite:</strong> Pour toute commande supérieure à 200 TND</div>
      </li>
      <li class="flex items-start gap-3">
        <span class="text-green-500">✓</span>
        <div><strong>Suivi de commande:</strong> Suivez votre colis en temps réel</div>
      </li>
    </ul>
  </div>
  <h2 class="text-2xl font-bold text-gray-900 mb-4">Retours</h2>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <ul class="space-y-3 text-gray-600">
      <li class="flex items-start gap-3">
        <span class="text-green-500">✓</span>
        <div><strong>14 jours pour changer d'avis:</strong> Retournez votre produit sans justification</div>
      </li>
      <li class="flex items-start gap-3">
        <span class="text-green-500">✓</span>
        <div><strong>Produits défectueux:</strong> Échange immédiat ou remboursement intégral</div>
      </li>
      <li class="flex items-start gap-3">
        <span class="text-green-500">✓</span>
        <div><strong>Procédure simple:</strong> Contactez notre service client pour initier un retour</div>
      </li>
    </ul>
  </div>
</div>`,
    type: 'PAGE',
    isActive: true,
    order: 6
  },
  {
    slug: 'garantie',
    title: 'Garantie',
    content: `<div class="max-w-4xl mx-auto px-4 py-8">
  <h1 class="text-4xl font-bold text-gray-900 mb-6 text-center">Garantie</h1>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
    <p class="text-lg text-gray-600 leading-relaxed mb-6">
      Tous nos produits bénéficient d'une <strong>garantie officielle</strong> pour vous protéger contre les défauts de fabrication.
    </p>
  </div>
  <h2 class="text-2xl font-bold text-gray-900 mb-4">Nos garanties</h2>
  <div class="grid md:grid-cols-2 gap-6 mb-8">
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 class="font-semibold text-gray-900 mb-2">Produits authentiques</h3>
      <p class="text-gray-500 text-sm">Tous nos produits sont 100% originaux avec facture et garantie constructeur.</p>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 class="font-semibold text-gray-900 mb-2">Garantie commerciale</h3>
      <p class="text-gray-500 text-sm">6 mois à 2 ans selon le produit, en plus de la garantie constructeur.</p>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 class="font-semibold text-gray-900 mb-2">Service après-vente</h3>
      <p class="text-gray-500 text-sm">Notre équipe technique est disponible pour toute assistance.</p>
    </div>
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 class="font-semibold text-gray-900 mb-2">Extension de garantie</h3>
      <p class="text-gray-500 text-sm">Option d'extension de garantie disponible à l'achat.</p>
    </div>
  </div>
  <div class="bg-blue-50 rounded-xl border border-blue-200 p-6">
    <h3 class="font-semibold text-blue-900 mb-2">Comment bénéficier de la garantie ?</h3>
    <p class="text-blue-700 text-sm">Contactez notre service client avec votre facture et une description du problème. Nous traiterons votre demande sous 48h.</p>
  </div>
</div>`,
    type: 'PAGE',
    isActive: true,
    order: 7
  },
  {
    slug: 'politique-remboursement',
    title: 'Politique de Remboursement',
    content: `<div class="max-w-4xl mx-auto px-4 py-8">
  <h1 class="text-4xl font-bold text-gray-900 mb-6 text-center">Politique de Remboursement</h1>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
    <p class="text-lg text-gray-600 leading-relaxed mb-6">
      Chez <strong>Tunisia Store</strong>, nous nous engageons à vous offrir une expérience d'achat sans souci. Si vous n'êtes pas satisfait, nous vous remboursons.
    </p>
  </div>
  <h2 class="text-2xl font-bold text-gray-900 mb-4">Conditions de remboursement</h2>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
    <ul class="space-y-3 text-gray-600">
      <li class="flex items-start gap-3">
        <span class="text-green-500">✓</span>
        <div><strong>14 jours de rétractation:</strong> Retournez le produit dans son état d'origine</div>
      </li>
      <li class="flex items-start gap-3">
        <span class="text-green-500">✓</span>
        <div><strong>Produit non utilisé:</strong> Le produit doit être neuf et dans son emballage</div>
      </li>
      <li class="flex items-start gap-3">
        <span class="text-green-500">✓</span>
        <div><strong>Facture originale:</strong> Présentez votre preuve d'achat</div>
      </li>
    </ul>
  </div>
  <h2 class="text-2xl font-bold text-gray-900 mb-4">Délai de remboursement</h2>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <p class="text-gray-600 mb-4">Une fois votre retour accepté, le remboursement est effectuée sous <strong>7 jours ouvrables</strong> via le même moyen de paiement utilisé lors de la commande.</p>
  </div>
</div>`,
    type: 'PAGE',
    isActive: true,
    order: 8
  },
  {
    slug: 'vus-recemment',
    title: 'Vus récemment',
    content: `<div class="max-w-4xl mx-auto px-4 py-8">
  <h1 class="text-4xl font-bold text-gray-900 mb-6 text-center">Vus récemment</h1>
  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
    <p class="text-lg text-gray-600 leading-relaxed mb-6">
      Consultez l'historique des produits que vous avez consultés sur <strong>Tunisia Store</strong>.
    </p>
  </div>
  <div class="bg-blue-50 rounded-xl border border-blue-200 p-6">
    <h3 class="font-semibold text-blue-900 mb-2">Comment ça marche ?</h3>
    <p class="text-blue-700 text-sm">Nous mémorisons automatiquement les produits que vous avez consultés pour vous permettre de les retrouver facilement. Vous pouvez également effacer votre historique à tout moment.</p>
  </div>
</div>`,
    type: 'PAGE',
    isActive: true,
    order: 9
  }
];

const faqItems = [
  {
    slug: 'comment-passer-commande',
    title: 'Comment passer une commande ?',
    content: 'Parcourez notre catalogue, ajoutez les produits à votre panier, puis suivez les étapes de checkout en choisissant votre mode de paiement et adresse de livraison.',
    type: 'FAQ',
    isActive: true,
    order: 1
  },
  {
    slug: 'delais-livraison',
    title: 'Quels sont les délais de livraison ?',
    content: 'Nos livraisons prennent 24 à 72 heures dans toute la Tunisie. La livraison est gratuite pour toute commande supérieure à 200 TND.',
    type: 'FAQ',
    isActive: true,
    order: 2
  },
  {
    slug: 'retourner-produit',
    title: 'Comment retourner un produit ?',
    content: 'Contactez notre service client dans les 14 jours suivant la réception. Le produit doit être neuf et dans son emballage d\'origine.',
    type: 'FAQ',
    isActive: true,
    order: 3
  },
  {
    slug: 'produits-authentiques',
    title: 'Les produits sont-ils authentiques ?',
    content: 'Oui, tous nos produits sont 100% originaux avec garantie officielle. Nous travaillons uniquement avec des fournisseurs certifiés.',
    type: 'FAQ',
    isActive: true,
    order: 4
  },
  {
    slug: 'modes-paiement',
    title: 'Quels moyens de paiement acceptez-vous ?',
    content: 'Nous acceptons les cartes bancaires (Visa, Mastercard), le paiement en espèces à la livraison, et le virement bancaire.',
    type: 'FAQ',
    isActive: true,
    order: 5
  },
  {
    slug: 'suivre-commande',
    title: 'Comment suivre ma commande ?',
    content: 'Vous recevrez un email avec un lien de suivi dès l\'expédition de votre commande. Vous pouvez aussi suivre votre colis depuis la section "Mes commandes".',
    type: 'FAQ',
    isActive: true,
    order: 6
  }
];

async function seedCmsPages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    for (const page of cmsPages) {
      const existing = await CMS.findOne({ slug: page.slug });
      if (!existing) {
        await CMS.create(page);
        console.log(`✅ Created page: ${page.slug}`);
      } else {
        console.log(`⚠️  Page already exists: ${page.slug}`);
      }
    }

    console.log('\n📝 Adding FAQ items...');
    for (const faq of faqItems) {
      const existing = await CMS.findOne({ title: faq.title, type: 'FAQ' });
      if (!existing) {
        await CMS.create(faq);
        console.log(`✅ Created FAQ: ${faq.title}`);
      } else {
        console.log(`⚠️  FAQ already exists: ${faq.title}`);
      }
    }

    console.log('\n✅ CMS pages seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedCmsPages();