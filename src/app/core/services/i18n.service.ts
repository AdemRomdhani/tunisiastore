import { Injectable, signal, computed, effect } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export type Language = 'fr' | 'ar';

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
      'contact.wecl': 'Nous vous répondrons soon'
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
      'nav.register': 'ان��اء حساب',
      'nav.logout': 'تسجيل الخروج',
      'nav.account': 'حسابي',
      'nav.orders': 'طلباتي',
      'nav.returns': 'المردودات',
      'nav.addresses': 'عناويني',
      'nav.profile': 'ملفي',
      'nav.admin': 'الادارة',
      'nav.compare': 'مقارنة',

      // Common
      'common.search': 'بحث...',
      'common.searchBtn': 'بحث',
      'common.viewAll': 'عرض الكل',
      'common.viewMore': '显示更多',
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

      // Checkout
      'checkout.title': 'اتمام الطلب',
      'checkout.shipping': 'التوصيل',
      'checkout.payment': 'الدفع',
      'checkout.summary': 'الملخص',
      'checkout.deliveryAddress': 'عنوان التوصيل',
      'checkout.addNewAddress': 'اضافة عنوان جديد',
      'checkout.paymentMethod': 'طريقة الدفع',
      'checkout.placeOrder': 'تاكيد الطلب',
      'checkout.thankYou': 'شكرا لطلبك!',
      'checkout.orderConfirmed': 'تم تاكيد طلبك',
      'checkout.orderNumber': 'رقم الطلب',

      // Auth
      'auth.login': 'تسجيل الدخول',
      'auth.register': 'انشاء حساب',
      'auth.email': 'البريد',
      'auth.password': 'كلمة المرور',
      'auth.confirmPassword': 'تاكيد كلمة المرور',
      'auth.forgotPassword': 'نسيت كلمة المرور?',
      'auth.rememberMe': 'تذكرني',
      'auth.noAccount': 'ليس لديك حساب?',
      'auth.haveAccount': 'لديك حساب?',
      'auth.signIn': 'دخول',
      'auth.signUp': 'تسجيل',
      'auth.signOut': 'خروج',

      // Orders
      'orders.title': 'طلباتي',
      'orders.noOrders': 'لا توجد طلبات',
      'orders.noOrdersText': 'لم تقم باي طلب بعد',
      'orders.shopNow': 'ابدأ التسوق',
      'orders.order': 'الطلب',
      'orders.date': 'التاريخ',
      'orders.status': 'الحالة',
      'orders.total': 'الاجمالي',
      'orders.details': 'التفاصيل',
      'orders.tracking': 'التتبع',
      'orders.return': 'طلب 返回',

      // Returns
      'returns.title': 'المردودات',
      'returns.noReturns': 'لا توجد مردودات',
      'returns.noReturnsText': 'ليس لديك طلبات مردودات',
      'returns.requestReturn': 'طلب 返回',
      'returns.reason': 'سبب الارجاع',
      'returns.selectReason': 'اختر السبب',
      'returns.productDefective': 'منتج معيب',
      'returns.wrongProduct': 'منتج خاطئ',
      'returns.notAsDescribed': 'ليس كما هو موصوف',
      'returns.other': 'اخر',
      'returns.comment': 'تعليق',
      'returns.submitReturn': 'ارسال الطلب',

      // Addresses
      'addresses.title': 'عناويني',
      'addresses.noAddresses': 'لا توجد عناوين',
      'addresses.addAddress': 'اضافة عنوان',
      'addresses.editAddress': 'تعديل العنوان',
      'addresses.default': 'العنوان الافتراضي',
      'addresses.setDefault': 'تعيين الافتراضي',

      // Errors
      'error.required': 'هذا الحقل مطلوب',
      'error.email': 'بريد غير صالح',
      'error.password': 'كلمة مرور غير صالحة',
      'error.minLength': 'الحد الادنى {count} حرف',
      'error.maxLength': 'الحد الاقصى {count} حرف',
      'error.generic': 'حدث خطا',
      'error.network': 'خطا في الاتصال',
      'error.tryAgain': 'حاول مرة اخرى',

      // Contact
      'contact.title': 'اتصل بنا',
      'contact.name': 'الاسم الكامل',
      'contact.subject': 'الموضوع',
      'contact.message': 'الرسالة',
      'contact.send': 'ارسال',
      'contact.success': 'تم الارسال!',
      'contact.wecl': 'سنتواصل معك قريبا'
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
    let text = this.translations[this.currentLang()][key] || this.translations['fr'][key] || key;
    
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
    const newLang = this.currentLang() === 'fr' ? 'ar' : 'fr';
    this.setLanguage(newLang);
  }

  private getStoredLanguage(): Language | null {
    const stored = localStorage.getItem('language');
    return (stored === 'ar' || stored === 'fr') ? stored : null;
  }

  private updateDirection() {
    document.documentElement.dir = this.isRTL() ? 'rtl' : 'ltr';
    document.documentElement.lang = this.currentLang();
    
    if (typeof document !== 'undefined') {
      document.body?.classList.toggle('rtl', this.isRTL());
    }
  }
}