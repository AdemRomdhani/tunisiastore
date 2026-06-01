import { Injectable, signal, computed, effect } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export type Language = 'en' | 'fr' | 'ar';

export interface Translations {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private currentLang = signal<Language>(this.getStoredLanguage() || 'fr');
  private rtlLanguages: Language[] = ['ar'];
  
  private translations: Record<Language, Translations> = {
    en: {
      // Navigation
      'nav.home': 'Home',
      'nav.products': 'Products',
      'nav.categories': 'Categories',
      'nav.bundles': 'Bundles',
      'nav.cart': 'Cart',
      'nav.wishlist': 'Wishlist',
      'nav.login': 'Login',
      'nav.register': 'Register',
      'nav.logout': 'Logout',
      'nav.account': 'My Account',
      'nav.orders': 'My Orders',
      'nav.returns': 'My Returns',
      'nav.addresses': 'My Addresses',
      'nav.profile': 'My Profile',
      'nav.admin': 'Admin',
      'nav.compare': 'Compare',
      'nav.freeShipping': 'Free shipping from 200 DT',

      // Common
      'common.search': 'Search...',
      'common.searchBtn': 'Search',
      'common.viewAll': 'View All',
      'common.viewMore': 'View More',
      'common.loading': 'Loading...',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.add': 'Add',
      'common.close': 'Close',
      'common.back': 'Back',
      'common.next': 'Next',
      'common.submit': 'Submit',
      'common.confirm': 'Confirm',
      'common.yes': 'Yes',
      'common.no': 'No',
      'common.ok': 'OK',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.warning': 'Warning',
      'common.info': 'Information',
      'common.email': 'Email',
      'common.noResults': 'No results',
      'common.seeAll': 'See all',
      'common.filter': 'Filter',
      'common.sort': 'Sort',
      'common.clear': 'Clear',
      'common.apply': 'Apply',
      'common.reset': 'Reset',

      // Footer
      'footer.about': 'About Us',
      'footer.contact': 'Contact',
      'footer.delivery': 'Delivery',
      'footer.returns': 'Returns',
      'footer.privacy': 'Privacy',
      'footer.terms': 'Terms',
      'footer.newsletter': 'Newsletter',
      'footer.subscribe': 'Subscribe',
      'footer.subscribeText': 'Subscribe for exclusive offers',
      'footer.copyright': 'All rights reserved',
      'footer.aboutDesc': 'Your preferred destination for electronics in Tunisia. Competitive prices, fast delivery and exceptional customer service.',

      // Products
      'product.addToCart': 'Add to Cart',
      'product.addedToCart': 'Added to Cart',
      'product.outOfStock': 'Out of Stock',
      'product.inStock': 'In Stock',
      'product.lowStock': 'Only {count} left',
      'product.new': 'New',
      'product.sale': 'Sale',
      'product.freeShipping': 'Free Shipping',
      'product.specifications': 'Specifications',
      'product.description': 'Description',
      'product.reviews': 'Reviews',
      'product.noReviews': 'No reviews',
      'product.writeReview': 'Write a Review',
      'product.relatedProducts': 'Related Products',
      'product.category': 'Category',
      'product.sku': 'SKU',
      'product.warranty': 'Warranty',
      'product.months': 'months',

      // Products Page
      'products.reset': 'Reset',
      'products.filters': 'Filters',
      'products.search': 'Search',
      'products.searchPlaceholder': 'Product name...',
      'products.allCategories': 'All',
      'products.priceRange': 'Price (TND)',
      'products.min': 'Min',
      'products.max': 'Max',
      'products.apply': 'Apply',
      'products.sortBy': 'Sort by',
      'products.newest': 'Newest',
      'products.priceAsc': 'Price: Low to High',
      'products.priceDesc': 'Price: High to Low',
      'products.topRated': 'Top Rated',
      'products.resetFilters': 'Reset filters',
      'products.viewResults': 'View results',
      'products.packsBundles': 'Packs & Bundles',
      'products.saveMore': 'Save more with our packages!',
      'products.viewPacks': 'View packs',
      'products.productsCount': '{count} product(s)',
      'products.noProducts': 'No products found',
      'products.tryOtherSearch': 'Try a different search term',
      'products.noProductsYet': "We don't have products yet",
      'products.previous': 'Previous',
      'products.next': 'Next',

      // Recently Viewed
      'recentlyViewed.title': 'Recently Viewed',
      'recentlyViewed.empty': 'No recently viewed products',
      'recentlyViewed.emptyDesc': 'Visit products to see them here',

      // Cart
      'cart.title': 'My Cart',
      'cart.empty': 'Your cart is empty',
      'cart.emptyText': 'You have no items in your cart',
      'cart.continueShopping': 'Continue Shopping',
      'cart.subtotal': 'Subtotal',
      'cart.total': 'Total',
      'cart.shipping': 'Shipping',
      'cart.freeShipping': 'Free Shipping',
      'cart.discount': 'Discount',
      'cart.checkout': 'Checkout',
      'cart.updateQuantity': 'Update',
      'cart.remove': 'Remove',
      'cart.items': '{count} item(s)',
      'cart.totalItems': 'Total: {count} items',
      'cart.subtotalHT': 'Subtotal (excl. tax)',
      'cart.free': 'free',
      'cart.amountHT': 'Amount (excl. tax)',
      'cart.tax': 'VAT (19%)',
      'cart.totalTTC': 'Total (incl. tax)',
      'cart.freeShippingNote': 'Free shipping from 200 DT',

      // Checkout
      'checkout.title': 'Checkout',
      'checkout.shipping': 'Shipping',
      'checkout.payment': 'Payment',
      'checkout.summary': 'Summary',
      'checkout.deliveryAddress': 'Delivery Address',
      'checkout.addNewAddress': 'Add New Address',
      'checkout.paymentMethod': 'Payment Method',
      'checkout.placeOrder': 'Place Order',
      'checkout.thankYou': 'Thank you for your order!',
      'checkout.orderConfirmed': 'Your order has been confirmed',
      'checkout.orderNumber': 'Order Number',

      // Auth
      'auth.login': 'Login',
      'auth.register': 'Create Account',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.confirmPassword': 'Confirm Password',
      'auth.forgotPassword': 'Forgot Password?',
      'auth.rememberMe': 'Remember Me',
      'auth.noAccount': "Don't have an account?",
      'auth.haveAccount': 'Already have an account?',
      'auth.signIn': 'Sign In',
      'auth.signUp': 'Sign Up',
      'auth.signOut': 'Sign Out',
      'auth.orContinueWith': 'or continue with',
      'auth.continueWithGoogle': 'Continue with Google',

      // Orders
      'orders.title': 'My Orders',
      'orders.noOrders': 'No Orders',
      'orders.noOrdersText': "You haven't placed any orders yet",
      'orders.shopNow': 'Shop Now',
      'orders.order': 'Order',
      'orders.date': 'Date',
      'orders.status': 'Status',
      'orders.total': 'Total',
      'orders.details': 'Details',
      'orders.tracking': 'Tracking',
      'orders.return': 'Request Return',

      // Returns
      'returns.title': 'My Returns',
      'returns.noReturns': 'No Returns',
      'returns.noReturnsText': 'You have no return requests',
      'returns.requestReturn': 'Request Return',
      'returns.reason': 'Return Reason',
      'returns.selectReason': 'Select a reason',
      'returns.productDefective': 'Product Defective',
      'returns.wrongProduct': 'Wrong Product',
      'returns.notAsDescribed': 'Not As Described',
      'returns.other': 'Other',
      'returns.comment': 'Comment',
      'returns.submitReturn': 'Submit Request',

      // Addresses
      'addresses.title': 'My Addresses',
      'addresses.noAddresses': 'No Addresses',
      'addresses.addAddress': 'Add Address',
      'addresses.editAddress': 'Edit Address',
      'addresses.default': 'Default Address',
      'addresses.setDefault': 'Set as Default',

      // Errors
      'error.required': 'This field is required',
      'error.email': 'Invalid email',
      'error.password': 'Invalid password',
      'error.minLength': 'Minimum {count} characters',
      'error.maxLength': 'Maximum {count} characters',
      'error.generic': 'An error occurred',
      'error.network': 'Connection error',
      'error.tryAgain': 'Try Again',

      // Contact
      'contact.title': 'Contact Us',
      'contact.name': 'Full Name',
      'contact.subject': 'Subject',
      'contact.message': 'Message',
      'contact.send': 'Send',
      'contact.success': 'Message sent!',
      'contact.wecl': 'We will contact you soon',

      // Home
      'home.newCollection': 'New collection 2026',
      'home.technologyTitle': 'Technology',
      'home.atYourFingertips': 'at your fingertips',
      'home.heroDescription': 'Discover our exclusive selection of smartphones, computers and accessories at the best prices in Tunisia. Fast delivery and authentic warranty.',
      'home.discover': 'Discover',
      'home.promotions': 'Promotions',
      'home.satisfiedClients': 'Satisfied Clients',
      'home.products': 'Products',
      'home.delivery': 'Delivery',
      'home.averageRating': 'Average Rating',
      'home.featuredProducts': 'Featured Products',
      'home.bestSelections': 'The best selections from our customers',
      'home.limitedOffer': 'LIMITED OFFER',
      'home.upTo50': 'Up to -50%',
      'home.onSelection': 'On a selection of products',
      'home.limitedOffers': 'Limited Offers',
      'home.flash': 'Flash',
      'home.offers': 'Deals',
      'home.flashDealsDesc': 'Enjoy exceptional discounts on a selection of products. Hurry, time is running out!',
      'home.promoEndsIn': 'Promotion ends in',
      'home.days': 'Days',
      'home.hours': 'Hours',
      'home.minutes': 'Minutes',
      'home.seconds': 'Seconds',
      'home.explorePromotions': 'Explore all promotions',
      'home.newArrivals': 'New Arrivals',
      'home.latestAdditions': 'The latest additions to our collection',
      'home.allProducts': 'All Products',
      'home.browseAll': 'Browse our complete catalog',
      'home.packsBundles': 'Packs & Bundles',
      'home.saveMorePackages': 'Save more with our packages',
      'home.viewPack': 'View Pack',
      'home.whyChooseUs': 'Why choose Tunisia Store?',
      'home.basedOnReviews': 'Based on 500+ reviews',
      'home.needHelp': 'Need help?',
      'home.customerSupportDesc': 'Our customer service team is available to answer all your questions, advise you or assist you with your purchases.',
      'home.contactUs': 'Contact Us',

      // Product Detail
      'productDetail.productNotFound': 'Product not found',
      'productDetail.zoom': 'Zoom',
      'productDetail.adding': 'Adding...',
      'productDetail.leaveReview': 'Leave a review',
      'productDetail.thankYouReview': 'Thank you! You have already left a review for this product.',
      'productDetail.yourRating': 'Your rating',
      'productDetail.reviewTitle': 'Review title',
      'productDetail.titlePlaceholder': 'In a few words...',
      'productDetail.yourReview': 'Your review',
      'productDetail.reviewPlaceholder': 'Describe your experience with this product...',
      'productDetail.submitting': 'Submitting...',
      'productDetail.submitReview': 'Submit Review',
      'productDetail.loginToReview': 'You must be logged in to leave a review.',
      'productDetail.verifiedPurchase': 'Verified Purchase',

      // Auth
      'auth.accessAccount': 'Access your account',
      'auth.emailPlaceholder': 'your@email.com',
      'auth.passwordPlaceholder': '••••••••',
      'auth.loggingIn': 'Logging in...',
      'auth.joinTunisiaStore': 'Join Tunisia Store',
      'auth.firstName': 'First Name',
      'auth.lastName': 'Last Name',
      'auth.phone': 'Phone',
      'auth.phonePlaceholder': 'XX XXX XXX',
      'auth.phoneFormat': 'Format: 8 digits (ex: 20123456)',
      'auth.registering': 'Registering...',

      // Contact
      'contact.subtitle': 'We are available to answer your questions',
      'contact.namePlaceholder': 'Your name',
      'contact.selectSubject': 'Choose a subject',
      'contact.orderQuestion': 'Question about an order',
      'contact.productQuestion': 'Question about a product',
      'contact.returnRefund': 'Return & Refund',
      'contact.partnership': 'Partnership',
      'contact.messagePlaceholder': 'Describe your request...',
      'contact.phone': 'Phone',
      'contact.address': 'Address',
      'common.other': 'Other',

      // FAQ
      'faq.title': 'Frequently Asked Questions',
      'faq.noQuestions': 'No questions yet',

      // Wishlist
      'wishlist.title': 'My Wishlist',
      'wishlist.empty': 'Your wishlist is empty',
      'wishlist.continueShopping': 'Continue shopping',

      // Orders
      'orders.confirmationEmail': 'Thank you for your order. You will receive a confirmation email.',
      'orders.viewDetails': 'View Details',
      'orders.itemsCount': '{count} item(s)',
      'orders.trackOrder': 'Track Order',
      'orders.downloadInvoice': 'Download Invoice',
      'orders.reorder': 'Reorder',

      // Profile
      'profile.emailNotVerified': 'Email not verified',
      'profile.verifyEmailDesc': 'Please verify your email to access all features.',
      'profile.personalInfo': 'Personal Information',
      'profile.updateProfile': 'Update Profile',
      'profile.changePassword': 'Change Password',
      'profile.orders': 'Orders',
      'profile.returns': 'Returns',
      'profile.addresses': 'Addresses',
      'profile.wishlist': 'Wishlist',

      // Verify Email
      'verifyEmail.verifying': 'Verifying...',
      'verifyEmail.verified': 'Email verified!',
      'verifyEmail.successMessage': 'Your email has been verified successfully.',
      'verifyEmail.goHome': 'Back to Home',
      'verifyEmail.missingToken': 'Verification token missing',
      'verifyEmail.invalidToken': 'Invalid or expired token',

      // Compare
      'compare.title': 'Compare Products',
      'compare.empty': 'No products to compare',
      'compare.addProducts': 'Add products to compare',
      'compare.goShopping': 'Go Shopping',

      // Bundles
      'bundles.title': 'Packs & Bundles',
      'bundles.saveMore': 'Save more with our bundles',
      'bundles.viewDetails': 'View Details',
      'bundles.addToCart': 'Add to Cart',

      // Tracking
      'tracking.title': 'Track My Order',
      'tracking.subtitle': 'Enter your order number and email to track your delivery',
      'tracking.orderNumber': 'Order Number',
      'tracking.orderPlaceholder': 'Ex: TN-20260424-87037',
      'tracking.trackButton': 'Track Order',
      'tracking.orderPlaced': 'Order Placed',
      'tracking.orderConfirmed': 'Order Confirmed',
      'tracking.processing': 'Processing',
      'tracking.shipped': 'Shipped',
      'tracking.outForDelivery': 'Out for Delivery',
      'tracking.delivered': 'Delivered',

      // Payment
      'payment.processing': 'Processing payment...',
      'payment.pleaseWait': 'Please wait, we are preparing your secure transaction.',
      'payment.success': 'Payment Successful!',
      'payment.successMessage': 'Your payment has been processed successfully.',
      'payment.orderNumber': 'Order Number',
      'payment.continueShopping': 'Continue Shopping',
      'payment.failed': 'Payment Failed',
      'payment.failedMessage': 'There was an issue processing your payment.',
      'payment.tryAgain': 'Try Again',
      'payment.cancelled': 'Payment Cancelled',
      'payment.cancelledMessage': 'You have cancelled the payment.',
      'payment.redirecting': 'Redirecting to bank...',
      'payment.autoRedirect': 'If you are not redirected automatically, click below.',
      'payment.continueToBank': 'Continue to Bank'
    },
    fr: {
      // Navigation
      'nav.home': 'Accueil',
      'nav.products': 'Produits',
      'nav.categories': 'Catégories',
      'nav.bundles': 'Packs',
      'nav.cart': 'Panier',
      'nav.wishlist': 'Favoris',
      'nav.login': 'Connexion',
      'nav.register': "S'inscrire",
      'nav.logout': 'Déconnexion',
      'nav.account': 'Mon compte',
      'nav.orders': 'Mes commandes',
      'nav.returns': 'Mes retours',
      'nav.addresses': 'Mes adresses',
      'nav.profile': 'Mon profil',
      'nav.admin': 'Administration',
      'nav.compare': 'Comparer',
      'nav.freeShipping': 'Livraison gratuite dès 200 DT',

      // Common
      'common.search': 'Rechercher...',
      'common.searchBtn': 'Rechercher',
      'common.viewAll': 'Voir tout',
      'common.viewMore': 'Voir plus',
      'common.loading': 'Chargement...',
      'common.save': 'Enregistrer',
      'common.cancel': 'Annuler',
      'common.delete': 'Supprimer',
      'common.edit': 'Modifier',
      'common.add': 'Ajouter',
      'common.close': 'Fermer',
      'common.back': 'Retour',
      'common.next': 'Suivant',
      'common.submit': 'Soumettre',
      'common.confirm': 'Confirmer',
      'common.yes': 'Oui',
      'common.no': 'Non',
      'common.ok': 'OK',
      'common.error': 'Erreur',
      'common.success': 'Succès',
      'common.warning': 'Attention',
      'common.info': 'Information',
      'common.email': 'Email',
      'common.noResults': 'Aucun résultat',
      'common.seeAll': 'Voir tout',
      'common.filter': 'Filtrer',
      'common.sort': 'Trier',
      'common.clear': 'Effacer',
      'common.apply': 'Appliquer',
      'common.reset': 'Réinitialiser',

      // Footer
      'footer.about': 'À propos',
      'footer.contact': 'Contact',
      'footer.delivery': 'Livraison',
      'footer.returns': 'Retours',
      'footer.privacy': 'Confidentialité',
      'footer.terms': 'Conditions',
      'footer.newsletter': 'Newsletter',
      'footer.subscribe': "S'abonner",
      'footer.subscribeText': 'Inscrivez-vous pour recevoir nos offres exclusives',
      'footer.copyright': 'Tous droits réservés',
      'footer.aboutDesc': 'Votre destination privilégiée pour l\'électronique en Tunisie. Prix compétitifs, livraison rapide et service client exceptionnel.',

      // Products
      'product.addToCart': 'Ajouter au panier',
      'product.addedToCart': 'Ajouté au panier',
      'product.outOfStock': 'Rupture de stock',
      'product.inStock': 'En stock',
      'product.lowStock': 'Plus que {count} disponibles',
      'product.new': 'Nouveau',
      'product.sale': 'Promo',
      'product.freeShipping': 'Livraison gratuite',
      'product.specifications': 'Spécifications techniques',
      'product.description': 'Description',
      'product.reviews': 'Avis clients',
      'product.noReviews': 'Aucun avis',
      'product.writeReview': 'Donner mon avis',
      'product.relatedProducts': 'Produits similaires',
      'product.category': 'Catégorie',
      'product.sku': 'Référence',
      'product.warranty': 'Garantie',
      'product.months': 'mois',

      // Products Page
      'products.reset': 'Réinitialiser',
      'products.filters': 'Filtres',
      'products.search': 'Rechercher',
      'products.searchPlaceholder': 'Nom du produit...',
      'products.allCategories': 'Toutes',
      'products.priceRange': 'Prix (TND)',
      'products.min': 'Min',
      'products.max': 'Max',
      'products.apply': 'Appliquer',
      'products.sortBy': 'Trier par',
      'products.newest': 'Nouveautés',
      'products.priceAsc': 'Prix: Croissant',
      'products.priceDesc': 'Prix: Décroissant',
      'products.topRated': 'Mieux notés',
      'products.resetFilters': 'Réinitialiser les filtres',
      'products.viewResults': 'Voir les résultats',
      'products.packsBundles': 'Packs & Bundles',
      'products.saveMore': 'Économisez plus avec nos packages!',
      'products.viewPacks': 'Voir les packs',
      'products.productsCount': '{count} produit(s)',
      'products.noProducts': 'Aucun produit trouvé',
      'products.tryOtherSearch': 'Essayez un autre terme de recherche',
      'products.noProductsYet': "Nous navons pas encore de produits",
      'products.previous': 'Précédent',
      'products.next': 'Suivant',

      // Recently Viewed
      'recentlyViewed.title': 'Vus récemment',
      'recentlyViewed.empty': 'Aucun produit vu récemment',
      'recentlyViewed.emptyDesc': 'Visitez des produits pour les voir ici',

      // Cart
      'cart.title': 'Mon panier',
      'cart.empty': 'Votre panier est vide',
      'cart.emptyText': 'Vous n\'avez aucun produit dans votre panier',
      'cart.continueShopping': 'Continuer mes achats',
      'cart.subtotal': 'Sous-total',
      'cart.total': 'Total',
      'cart.shipping': 'Livraison',
      'cart.freeShipping': 'Livraison gratuite',
      'cart.discount': 'Réduction',
      'cart.checkout': 'Passer la commande',
      'cart.updateQuantity': 'Mettre à jour',
      'cart.remove': 'Retirer du panier',
      'cart.items': '{count} produit(s)',
      'cart.totalItems': 'Total: {count} articles',
      'cart.subtotalHT': 'Sous-total HT',
      'cart.free': 'gratuite',
      'cart.amountHT': 'Montant HT',
      'cart.tax': 'TVA (19%)',
      'cart.totalTTC': 'Total TTC',
      'cart.freeShippingNote': 'Livraison gratuite dès 200 DT',

      // Checkout
      'checkout.title': 'Finaliser la commande',
      'checkout.shipping': 'Livraison',
      'checkout.payment': 'Paiement',
      'checkout.summary': 'Récapitulatif',
      'checkout.deliveryAddress': 'Adresse de livraison',
      'checkout.addNewAddress': 'Ajouter une nouvelle adresse',
      'checkout.paymentMethod': 'Mode de paiement',
      'checkout.placeOrder': 'Confirmer la commande',
      'checkout.thankYou': 'Merci pour votre commande!',
      'checkout.orderConfirmed': 'Votre commande a été confirmée',
      'checkout.orderNumber': 'Numéro de commande',

      // Auth
      'auth.login': 'Connexion',
      'auth.register': 'Créer un compte',
      'auth.email': 'Email',
      'auth.password': 'Mot de passe',
      'auth.confirmPassword': 'Confirmer le mot de passe',
      'auth.forgotPassword': 'Mot de passe oublié?',
      'auth.rememberMe': 'Se souvenir de moi',
      'auth.noAccount': 'Pas de compte?',
      'auth.haveAccount': 'Déjà un compte?',
      'auth.signIn': 'Se connecter',
      'auth.signUp': 'S\'inscrire',
      'auth.signOut': 'Se déconnecter',
      'auth.orContinueWith': 'ou continuer avec',
      'auth.continueWithGoogle': 'Continuer avec Google',

      // Orders
      'orders.title': 'Mes commandes',
      'orders.noOrders': 'Aucune commande',
      'orders.noOrdersText': 'Vous n\'avez pas encore passé de commande',
      'orders.shopNow': 'Commencer les achats',
      'orders.order': 'Commande',
      'orders.date': 'Date',
      'orders.status': 'Statut',
      'orders.total': 'Total',
      'orders.details': 'Détails',
      'orders.tracking': 'Suivi',
      'orders.return': 'Demander un retour',

      // Returns
      'returns.title': 'Mes retours',
      'returns.noReturns': 'Aucun retour',
      'returns.noReturnsText': 'Vous n\'avez pas de demande de retour',
      'returns.requestReturn': 'Demander un retour',
      'returns.reason': 'Motif du retour',
      'returns.selectReason': 'Sélectionner un motif',
      'returns.productDefective': 'Produit défectueux',
      'returns.wrongProduct': 'Mauvais produit',
      'returns.notAsDescribed': 'Pas comme décrit',
      'returns.other': 'Autre',
      'returns.comment': 'Commentaire',
      'returns.submitReturn': 'Soumettre la demande',

      // Addresses
      'addresses.title': 'Mes adresses',
      'addresses.noAddresses': 'Aucune adresse',
      'addresses.addAddress': 'Ajouter une adresse',
      'addresses.editAddress': 'Modifier l\'adresse',
      'addresses.default': 'Adresse par défaut',
      'addresses.setDefault': 'Définir par défaut',

      // Errors
      'error.required': 'Ce champ est requis',
      'error.email': 'Email invalide',
      'error.password': 'Mot de passe invalide',
      'error.minLength': 'Minimum {count} caractères',
      'error.maxLength': 'Maximum {count} caractères',
      'error.generic': 'Une erreur est survenue',
      'error.network': 'Erreur de connexion',
      'error.tryAgain': 'Réessayer',

      // Contact
      'contact.title': 'Contactez-nous',
      'contact.name': 'Nom complet',
      'contact.subject': 'Sujet',
      'contact.message': 'Message',
      'contact.send': 'Envoyer',
      'contact.success': 'Message envoyé!',
      'contact.wecl': 'Nous vous répondrons soon',

      // Home
      'home.newCollection': 'Nouvelle collection 2026',
      'home.technologyTitle': 'La technologie',
      'home.atYourFingertips': 'à votre portée',
      'home.heroDescription': 'Découvrez notre sélection exclusive de smartphones, ordinateurs et accessoires aux meilleurs prix en Tunisie. Livraison rapide et garantie authentique.',
      'home.discover': 'Découvrir',
      'home.promotions': 'Promotions',
      'home.satisfiedClients': 'Clients satisfaits',
      'home.products': 'Produits',
      'home.delivery': 'Livraison',
      'home.averageRating': 'Note moyenne',
      'home.featuredProducts': 'Produits en vedette',
      'home.bestSelections': 'Les meilleures selections de nos clients',
      'home.limitedOffer': 'OFFRE LIMITÉE',
      'home.upTo50': 'Hasta -50%',
      'home.onSelection': 'Sur une sélection de produits',
      'home.limitedOffers': 'Offres Limitées',
      'home.flash': 'Offres',
      'home.offers': 'Flash',
      'home.flashDealsDesc': 'Profitez de réductions exceptionnelles sur une sélection de produits. Ne tardez pas, le temps presse !',
      'home.promoEndsIn': 'La promo se termine dans',
      'home.days': 'Jours',
      'home.hours': 'Heures',
      'home.minutes': 'Minutes',
      'home.seconds': 'Secondes',
      'home.explorePromotions': 'Explorer toutes les promotions',
      'home.newArrivals': 'Nouveautés',
      'home.latestAdditions': 'Les derniers ajouts à notre collection',
      'home.allProducts': 'Tous les Produits',
      'home.browseAll': 'Parcourez notre catalogue complet',
      'home.packsBundles': 'Packs & Bundles',
      'home.saveMorePackages': 'Économisez plus avec nos packages',
      'home.viewPack': 'Voir le pack',
      'home.whyChooseUs': 'Pourquoi choisir Tunisia Store?',
      'home.basedOnReviews': 'Basé sur 500+ avis',
      'home.needHelp': 'Besoin d\'aide ?',
      'home.customerSupportDesc': 'Notre équipe de service client est à votre disposition pour répondre à toutes vos questions, vous conseiller ou vous accompagner dans vos achats.',
      'home.contactUs': 'Nous contacter',

      // Product Detail
      'productDetail.productNotFound': 'Produit non trouvé',
      'productDetail.zoom': 'Zoom',
      'productDetail.adding': 'Ajout...',
      'productDetail.leaveReview': 'Laisser un avis',
      'productDetail.thankYouReview': 'Merci ! Vous avez déjà laissé un avis pour ce produit.',
      'productDetail.yourRating': 'Votre note',
      'productDetail.reviewTitle': 'Titre de l\'avis',
      'productDetail.titlePlaceholder': 'En quelques mots...',
      'productDetail.yourReview': 'Votre avis',
      'productDetail.reviewPlaceholder': 'Décrivez votre expérience avec ce produit...',
      'productDetail.submitting': 'Envoi en cours...',
      'productDetail.submitReview': 'Publier mon avis',
      'productDetail.loginToReview': 'Vous devez être connecté pour laisser un avis.',
      'productDetail.verifiedPurchase': 'Achat vérifié',

      // Auth
      'auth.accessAccount': 'Accédez à votre compte',
      'auth.emailPlaceholder': 'votre@email.com',
      'auth.passwordPlaceholder': '••••••••',
      'auth.loggingIn': 'Connexion en cours...',
      'auth.joinTunisiaStore': 'Rejoignez Tunisia Store',
      'auth.firstName': 'Prénom',
      'auth.lastName': 'Nom',
      'auth.phone': 'Téléphone',
      'auth.phonePlaceholder': 'XX XXX XXX',
      'auth.phoneFormat': 'Format: 8 chiffres (ex: 20123456)',
      'auth.registering': 'Inscription en cours...',

      // Contact
      'contact.subtitle': 'Nous sommes disponibles pour répondre à vos questions',
      'contact.namePlaceholder': 'Votre nom',
      'contact.selectSubject': 'Choisir un sujet',
      'contact.orderQuestion': 'Question sur une commande',
      'contact.productQuestion': 'Question sur un produit',
      'contact.returnRefund': 'Retour & Remboursement',
      'contact.partnership': 'Partenariat',
      'contact.messagePlaceholder': 'Décrivez votre demande...',
      'contact.phone': 'Téléphone',
      'contact.address': 'Adresse',
      'common.other': 'Autre',

      // FAQ
      'faq.title': 'Foire Aux Questions',
      'faq.noQuestions': 'Aucune question pour le moment',

      // Wishlist
      'wishlist.title': 'Ma liste de souhaits',
      'wishlist.empty': 'Votre liste est vide',
      'wishlist.continueShopping': 'Continuer vos achats',

      // Orders
      'orders.confirmationEmail': 'Merci pour votre commande. Vous recevrez un email de confirmation.',
      'orders.viewDetails': 'Voir les détails',
      'orders.itemsCount': '{count} article(s)',
      'orders.trackOrder': 'Suivre la commande',
      'orders.downloadInvoice': 'Télécharger la facture',
      'orders.reorder': 'Commander à nouveau',

      // Profile
      'profile.emailNotVerified': 'Email non vérifié',
      'profile.verifyEmailDesc': 'Veuillez vérifier votre email pour accéder à toutes les fonctionnalités.',
      'profile.personalInfo': 'Informations personnelles',
      'profile.updateProfile': 'Mettre à jour le profil',
      'profile.changePassword': 'Changer le mot de passe',
      'profile.orders': 'Commandes',
      'profile.returns': 'Retours',
      'profile.addresses': 'Adresses',
      'profile.wishlist': 'Favoris',

      // Verify Email
      'verifyEmail.verifying': 'Vérification en cours...',
      'verifyEmail.verified': 'Email vérifié !',
      'verifyEmail.successMessage': 'Votre email a été vérifié avec succès.',
      'verifyEmail.goHome': 'Retour à l\'accueil',
      'verifyEmail.missingToken': 'Token de vérification manquant',
      'verifyEmail.invalidToken': 'Token invalide ou expiré',

      // Compare
      'compare.title': 'Comparer les produits',
      'compare.empty': 'Aucun produit à comparer',
      'compare.addProducts': 'Ajouter des produits à comparer',
      'compare.goShopping': 'Faire les achats',

      // Bundles
      'bundles.title': 'Packs & Bundles',
      'bundles.saveMore': 'Économisez plus avec nos packs',
      'bundles.viewDetails': 'Voir les détails',
      'bundles.addToCart': 'Ajouter au panier',

      // Tracking
      'tracking.title': 'Suivre ma commande',
      'tracking.subtitle': 'Entrez votre numéro de commande et email pour suivre votre livraison',
      'tracking.orderNumber': 'Numéro de commande',
      'tracking.orderPlaceholder': 'Ex: TN-20260424-87037',
      'tracking.trackButton': 'Suivre ma commande',
      'tracking.orderPlaced': 'Commande passée',
      'tracking.orderConfirmed': 'Commande confirmée',
      'tracking.processing': 'En cours de traitement',
      'tracking.shipped': 'Expédiée',
      'tracking.outForDelivery': 'En livraison',
      'tracking.delivered': 'Livrée',

      // Payment
      'payment.processing': 'Traitement du paiement...',
      'payment.pleaseWait': 'Veuillez patienter, nous préparons votre transaction sécurisée.',
      'payment.success': 'Paiement réussi!',
      'payment.successMessage': 'Votre paiement a été traité avec succès.',
      'payment.orderNumber': 'Numéro de commande',
      'payment.continueShopping': 'Continuer les achats',
      'payment.failed': 'Paiement échoué',
      'payment.failedMessage': 'Il y a eu un problème lors du traitement de votre paiement.',
      'payment.tryAgain': 'Réessayer',
      'payment.cancelled': 'Paiement annulé',
      'payment.cancelledMessage': 'Vous avez annulé le paiement.',
      'payment.redirecting': 'Redirection vers la banque...',
      'payment.autoRedirect': 'Si vous n\'êtes pas redirigé automatiquement, cliquez ci-dessous.',
      'payment.continueToBank': 'Continuer vers la banque'
    },
    ar: {
      // Navigation
      'nav.home': 'الرئيسية',
      'nav.products': 'المنتجات',
      'nav.categories': 'الفئات',
      'nav.bundles': 'العروض',
      'nav.cart': 'السلة',
      'nav.wishlist': 'المفضلة',
'nav.login': 'تسجيل الدخول',
      'nav.register': 'إنشاء حساب',
      'nav.logout': 'تسجيل الخروج',
      'nav.account': 'حسابي',
      'nav.orders': 'طلباتي',
      'nav.returns': 'المردودات',
      'nav.addresses': 'عناويني',
      'nav.profile': 'ملفي',
      'nav.admin': 'الادارة',
      'nav.compare': 'مقارنة',
      'nav.freeShipping': 'توصيل مجاني من 200 دينار',

      // Common
      'common.search': 'بحث...',
      'common.searchBtn': 'بحث',
      'common.viewAll': 'عرض الكل',
      'common.viewMore': 'عرض المزيد',
      'common.loading': 'جاري التحميل...',
      'common.save': 'حفظ',
      'common.cancel': 'الغاء',
      'common.delete': 'حذف',
      'common.edit': 'تعديل',
      'common.add': 'اضافة',
      'common.close': 'اغلاق',
      'common.back': 'رجوع',
      'common.next': 'التالي',
      'common.submit': 'ارسال',
      'common.confirm': 'تاكيد',
      'common.yes': 'نعم',
      'common.no': 'لا',
      'common.ok': 'موافق',
      'common.error': 'خطا',
      'common.success': 'نجاح',
      'common.warning': 'تحذير',
      'common.info': 'معلومات',
      'common.email': 'البريد الإلكتروني',
      'common.noResults': 'لا توجد نتائج',
      'common.seeAll': 'عرض الكل',
      'common.filter': 'تصفية',
      'common.sort': 'ترتيب',
      'common.clear': 'مسح',
      'common.apply': 'تطبيق',
      'common.reset': 'اعادة تعيين',

      // Footer
      'footer.about': 'من نحن',
      'footer.contact': 'اتصل بنا',
      'footer.delivery': 'التوصيل',
      'footer.returns': 'المردودات',
      'footer.privacy': 'الخصوصية',
      'footer.terms': 'الشروط',
      'footer.newsletter': 'النشرة',
      'footer.subscribe': 'اشتراك',
      'footer.subscribeText': 'اشترك للحصول على عروض حصرية',
      'footer.copyright': 'جميع الحقوق محفوظة',
      'footer.aboutDesc': 'وجهتك المفضلة للإلكترونيات في تونس. أسعار تنافسية وتوصيل سريع وخدمة عملاء استثنائية.',

      // Products
      'product.addToCart': 'اضف الى السلة',
      'product.addedToCart': 'تمت الاضافة',
      'product.outOfStock': 'نفذت الكمية',
      'product.inStock': 'متوفر',
      'product.lowStock': 'متبقي {count} فقط',
      'product.new': 'جديد',
      'product.sale': 'عرض',
      'product.freeShipping': 'توصيل مجاني',
      'product.specifications': 'المواصفات',
      'product.description': 'الوصف',
      'product.reviews': 'التعليقات',
      'product.noReviews': 'لا توجد تعليقات',
      'product.writeReview': 'اكتب تعليقك',
      'product.relatedProducts': 'منتجات مشابهة',
      'product.category': 'الفئة',
      'product.sku': 'المرجع',
      'product.warranty': 'الضمان',
      'product.months': 'اشهر',

      // Products Page
      'products.reset': 'إعادة تعيين',
      'products.filters': 'الفلاتر',
      'products.search': 'بحث',
      'products.searchPlaceholder': 'اسم المنتج...',
      'products.allCategories': 'الكل',
      'products.priceRange': 'السعر (دينار)',
      'products.min': 'الحد الأدنى',
      'products.max': 'الحد الأقصى',
      'products.apply': 'تطبيق',
      'products.sortBy': 'ترتيب حسب',
      'products.newest': 'الأحدث',
      'products.priceAsc': 'السعر: من الأقل للأعلى',
      'products.priceDesc': 'السعر: من الأعلى للأقل',
      'products.topRated': 'الأفضل تقييماً',
      'products.resetFilters': 'إعادة تعيين الفلاتر',
      'products.viewResults': 'عرض النتائج',
      'products.packsBundles': 'العروض والحزم',
      'products.saveMore': 'وفر أكثر مع عروضنا!',
      'products.viewPacks': 'عرض العروض',
      'products.productsCount': '{count} منتج',
      'products.noProducts': 'لا توجد منتجات',
      'products.tryOtherSearch': 'جرب مصطلح بحث آخر',
      'products.noProductsYet': 'ليس لدينا منتجات بعد',
      'products.previous': 'السابق',
      'products.next': 'التالي',

      // Recently Viewed
      'recentlyViewed.title': 'المعروضة Recently',
      'recentlyViewed.empty': 'لا توجد منتجات معروضة recently',
      'recentlyViewed.emptyDesc': 'زر المنتجات لرؤيتها هنا',

      // Cart
      'cart.title': 'سلة المشتريات',
      'cart.empty': 'سلة فارغة',
      'cart.emptyText': 'ليس لديك اي منتجات في السلة',
      'cart.continueShopping': 'متابعة التسوق',
      'cart.subtotal': 'المجموع الفرعي',
      'cart.total': 'المجموع',
      'cart.shipping': 'التوصيل',
      'cart.freeShipping': 'توصيل مجاني',
      'cart.discount': 'الخصم',
      'cart.checkout': 'اتمام الطلب',
      'cart.updateQuantity': 'تحديث',
      'cart.remove': 'ازالة من السلة',
      'cart.items': '{count} منتج',
'cart.totalItems': 'الاجمالي: {count} منتج',
      'cart.subtotalHT': 'المجموع الفرعي (غير شامل الضريبة)',
      'cart.free': 'مجاني',
      'cart.amountHT': 'المبلغ (غير شامل الضريبة)',
      'cart.tax': 'الضريبة (19%)',
      'cart.totalTTC': 'الإجمالي (شامل الضريبة)',
      'cart.freeShippingNote': 'توصيل مجاني من 200 دينار',

      // Contact
      'contact.title': 'اتصل بنا',
      'contact.name': 'الاسم الكامل',
      'contact.subject': 'الموضوع',
      'contact.message': 'الرسالة',
      'contact.send': 'ارسال',
      'contact.success': 'تم الارسال!',
      'contact.wecl': 'سنتواصل معك قريبا',

      // Home
      'home.newCollection': 'مجموعة جديدة 2026',
      'home.technologyTitle': 'التكنولوجيا',
      'home.atYourFingertips': 'بإمكانك',
      'home.heroDescription': 'اكتشف مجموعتنا الحصرية من الهواتف الذكية وأجهزة الكمبيوتر والإكسسوارات بأفضل الأسعار في تونس. توصيل سريع وضمان أصلي.',
      'home.discover': 'اكتشف',
      'home.promotions': 'العروض',
      'home.satisfiedClients': 'عملاء Satisfaits',
      'home.products': 'منتجات',
      'home.delivery': 'التوصيل',
      'home.averageRating': 'التقييم المتوسط',
      'home.featuredProducts': 'منتجات مميزة',
      'home.bestSelections': 'أفضل اختيارات عملائنا',
      'home.limitedOffer': 'عرض محدود',
      'home.upTo50': 'حتى -50٪',
      'home.onSelection': 'على مجموعة مختارة من المنتجات',
      'home.limitedOffers': 'عروض محدودة',
      'home.flash': 'عروض',
      'home.offers': 'سريعة',
      'home.flashDealsDesc': 'استمتع بخصومات استثنائية على مجموعة مختارة من المنتجات. سارع، الوقت يعمل ضدك!',
      'home.promoEndsIn': 'العرض ينتهي في',
      'home.days': 'أيام',
      'home.hours': 'ساعات',
      'home.minutes': 'دقائق',
      'home.seconds': 'ثواني',
      'home.explorePromotions': 'استكشف جميع العروض',
      'home.newArrivals': 'أحدث arrivals',
      'home.latestAdditions': 'آخر الإضافات إلى مجموعتنا',
      'home.allProducts': 'جميع المنتجات',
      'home.browseAll': 'تصفح كتالوجنا الكامل',
      'home.packsBundles': 'العروض والحزم',
      'home.saveMorePackages': 'وفر أكثر مع عروضنا',
      'home.viewPack': 'عرض الحزمة',
      'home.whyChooseUs': 'لماذا تختار Tunisia Store؟',
      'home.basedOnReviews': 'بناءً على 500+ تقييم',
      'home.needHelp': 'هل تحتاج لمساعدة؟',
      'home.customerSupportDesc': 'فريق خدمة العملاء لدينا متاح للرد على جميع أسئلتك ونصائحك أو مساعدتك في مشترياتك.',
      'home.contactUs': 'اتصل بنا',

      // Product Detail
      'productDetail.productNotFound': 'المنتج غير موجود',
      'productDetail.zoom': 'تكبير',
      'productDetail.adding': 'جاري الاضافة...',
      'productDetail.leaveReview': 'اترك تقييما',
      'productDetail.thankYouReview': 'شكرا! لقد你已经 تركت تقييما لهذا المنتج.',
      'productDetail.yourRating': 'تقييمك',
      'productDetail.reviewTitle': 'عنوان التقييم',
      'productDetail.titlePlaceholder': 'بكلمات قليلة...',
      'productDetail.yourReview': 'تقييمك',
      'productDetail.reviewPlaceholder': 'صف تجربتك مع هذا المنتج...',
      'productDetail.submitting': 'جاري الارسال...',
      'productDetail.submitReview': 'ارسال التقييم',
      'productDetail.loginToReview': 'يجب تسجيل الدخول لترك تقييم.',
      'productDetail.verifiedPurchase': 'شراء موثق',

      // Auth
      'auth.accessAccount': 'الوصول إلى حسابك',
      'auth.emailPlaceholder': 'بريدك@اللكتروني.com',
      'auth.passwordPlaceholder': '••••••••',
      'auth.loggingIn': 'جاري تسجيل الدخول...',
      'auth.joinTunisiaStore': 'انضم إلى Tunisia Store',
      'auth.firstName': 'الاسم الأول',
      'auth.lastName': 'الاسم الأخير',
      'auth.phone': 'الهاتف',
      'auth.phonePlaceholder': 'XX XXX XXX',
      'auth.phoneFormat': 'الصيغة: 8 أرقام (مثال: 20123456)',
      'auth.registering': 'جاري التسجيل...',
      'auth.login': 'تسجيل الدخول',
      'auth.register': 'إنشاء حساب',
      'auth.email': 'البريد الإلكتروني',
      'auth.password': 'كلمة المرور',
      'auth.confirmPassword': 'تأكيد كلمة المرور',
      'auth.forgotPassword': 'هل نسيت كلمة المرور؟',
      'auth.rememberMe': 'تذكرني',
      'auth.noAccount': 'ليس لديك حساب؟',
      'auth.haveAccount': 'لديك حساب بالفعل؟',
      'auth.signIn': 'تسجيل الدخول',
      'auth.signUp': 'إنشاء حساب',
      'auth.signOut': 'تسجيل الخروج',
      'auth.orContinueWith': 'أو تابع باستخدام',
      'auth.continueWithGoogle': 'متابعة باستخدام Google',

      // Contact
      'contact.subtitle': 'نحن متاحون للرد على اسئلتك',
      'contact.namePlaceholder': 'اسمك',
      'contact.selectSubject': 'اختر موضوعا',
      'contact.orderQuestion': 'سؤال عن طلب',
      'contact.productQuestion': 'سؤال عن منتج',
      'contact.returnRefund': 'إرجاع واسترداد',
      'contact.partnership': 'شراكة',
      'contact.messagePlaceholder': 'صف طلبك...',
      'contact.phone': 'الهاتف',
      'contact.address': 'العنوان',
      'common.other': 'أخرى',

      // FAQ
      'faq.title': 'الأسئلة الشائعة',
      'faq.noQuestions': 'لا توجد أسئلة بعد',

      // Wishlist
      'wishlist.title': 'قائمة أمنياتي',
      'wishlist.empty': 'قائمتك فارغة',
      'wishlist.continueShopping': 'متابعة التسوق',

      // Orders
      'orders.confirmationEmail': 'شكرا لطلبك. ستتلقى بريدا إلكترونيا للتأكيد.',
      'orders.viewDetails': 'عرض التفاصيل',
      'orders.itemsCount': '{count} منتج',
      'orders.trackOrder': 'تتبع الطلب',
      'orders.downloadInvoice': 'تحميل الفاتورة',
      'orders.reorder': 'إعادة الطلب',

      // Profile
      'profile.emailNotVerified': 'البريد الإلكتروني غير verified',
      'profile.verifyEmailDesc': 'يرجى التحقق من بريدك الإلكتروني للوصول إلى جميع الميزات.',
      'profile.personalInfo': 'المعلومات الشخصية',
      'profile.updateProfile': 'تحديث الملف الشخصي',
      'profile.changePassword': 'تغيير كلمة المرور',
      'profile.orders': 'الطلبات',
      'profile.returns': 'المردودات',
      'profile.addresses': 'العناوين',
      'profile.wishlist': 'المفضلة',

      // Verify Email
      'verifyEmail.verifying': 'جاري التحقق...',
      'verifyEmail.verified': 'تم التحقق من البريد الإلكتروني!',
      'verifyEmail.successMessage': 'تم التحقق من بريدك الإلكتروني بنجاح.',
      'verifyEmail.goHome': 'العودة إلى الصفحة الرئيسية',
      'verifyEmail.missingToken': 'رمز التحقق مفقود',
      'verifyEmail.invalidToken': 'رمز غير صالح أو منتهي الصلاحية',

      // Compare
      'compare.title': 'مقارنة المنتجات',
      'compare.empty': 'لا توجد منتجات للمقارنة',
      'compare.addProducts': 'أضف منتجات للمقارنة',
      'compare.goShopping': 'اذهب للتسوق',

      // Bundles
      'bundles.title': 'العروض والحزم',
      'bundles.saveMore': 'وفر أكثر مع عروضنا',
      'bundles.viewDetails': 'عرض التفاصيل',
      'bundles.addToCart': 'أضف إلى السلة',

      // Tracking
      'tracking.title': 'تتبع طلبي',
      'tracking.subtitle': 'أدخل رقم الطلب والبريد الإلكتروني لتتبعDelivery',
      'tracking.orderNumber': 'رقم الطلب',
      'tracking.orderPlaceholder': 'مثال: TN-20260424-87037',
      'tracking.trackButton': 'تتبع الطلب',
      'tracking.orderPlaced': 'تم الطلب',
      'tracking.orderConfirmed': 'تم تأكيد الطلب',
      'tracking.processing': 'جاري المعالجة',
      'tracking.shipped': 'تم الشحن',
      'tracking.outForDelivery': 'في الطريق',
      'tracking.delivered': 'تم التسليم',

      // Payment
      'payment.processing': 'جاري معالجة الدفع...',
      'payment.pleaseWait': 'يرجى الانتظار، نقوم بإعداد معاملتك الآمنة.',
      'payment.success': 'الدفع ناجح!',
      'payment.successMessage': 'تمت معالجة دفعك بنجاح.',
      'payment.orderNumber': 'رقم الطلب',
      'payment.continueShopping': 'متابعة التسوق',
      'payment.failed': 'فشل الدفع',
      'payment.failedMessage': 'حدثت مشكلة في معالجة دفعك.',
      'payment.tryAgain': 'حاول مرة أخرى',
      'payment.cancelled': 'الدفع ملغى',
      'payment.cancelledMessage': 'لقد ألغيت الدفع.',
      'payment.redirecting': 'جاري التحويل إلى البنك...',
      'payment.autoRedirect': 'إذا لم يتم تحويلك تلقائيا، انقر أدناه.',
      'payment.continueToBank': 'متابعة إلى البنك'
    }
  };

  lang = computed(() => this.currentLang());
  isRTL = computed(() => this.rtlLanguages.includes(this.currentLang()));

  constructor(private router: Router) {
    this.updateDirection();
    
    effect(() => {
      this.updateDirection();
    });
  }

  getLang(): Language {
    return this.currentLang();
  }

  t(key: string, params?: Record<string, string | number>): string {
    const currentLang = this.currentLang();
    const fallbackLangs: Language[] = currentLang === 'ar' ? ['fr', 'en'] : currentLang === 'fr' ? ['en'] : [];
    let text = this.translations[currentLang][key];
    
    for (const lang of fallbackLangs) {
      text = text || this.translations[lang][key];
    }
    
    text = text || key;
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, String(value));
      });
    }
    
    return text;
  }

  setLanguage(lang: Language) {
    this.currentLang.set(lang);
    localStorage.setItem('language', lang);
    this.updateDirection();
  }

  toggleLanguage() {
    const langs: Language[] = ['en', 'fr', 'ar'];
    const current = this.currentLang();
    const currentIndex = langs.indexOf(current);
    const newLang = langs[(currentIndex + 1) % langs.length];
    this.setLanguage(newLang);
  }

  private getStoredLanguage(): Language | null {
    const stored = localStorage.getItem('language');
    return (stored === 'ar' || stored === 'fr' || stored === 'en') ? stored : null;
  }

  private updateDirection() {
    document.documentElement.dir = this.isRTL() ? 'rtl' : 'ltr';
    document.documentElement.lang = this.currentLang();
    
    if (typeof document !== 'undefined') {
      document.body?.classList.toggle('rtl', this.isRTL());
    }
  }
}