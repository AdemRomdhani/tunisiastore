# 🛡️ Audit de Sécurité — Tunisia Store
**Date:** 2026-05-03

J'ai effectué une analyse de sécurité du backend et des configurations de l'application. L'application possède de bonnes bases de sécurité (hachage des mots de passe, utilisation de JWT, middleware de sécurité), mais plusieurs vulnérabilités et mauvaises pratiques ont été identifiées, particulièrement pour un passage en production.

Voici le rapport détaillé :

---

## 🔴 Vulnérabilités Critiques / Élevées (À corriger en priorité)

### 1. ⚠️ Identifiants Sensibles dans le fichier `.env`
Le fichier `.env` contient des identifiants réels (notamment le mot de passe d'application Gmail `SMTP_PASS=rulm zqjn mtek yjca`). Si ce fichier est partagé ou versionné sur Git, cela compromet le compte email.
*   **Recommandation :** Révoguer immédiatement le mot de passe d'application généré chez Google. S'assurer que le fichier `.env` est dans le `.gitignore` et créer un `.env.example` vide pour le développement.

### 2. ⚠️ Stockage du Token JWT côté Frontend
L'API renvoie le JWT dans le corps JSON (`res.json({ token, ... })`), ce qui implique que le frontend le stocke probablement dans le `localStorage` ou `sessionStorage`. C'est vulnérable aux attaques **XSS (Cross-Site Scripting)**. Si un script malveillant est injecté sur le site, il peut voler les tokens des utilisateurs.
*   **Recommandation :** Modifier le système d'authentification pour stocker le token dans un **cookie `HttpOnly` et `Secure`**. Le frontend ne pourra pas le lire, mais le navigateur l'enverra automatiquement avec chaque requête.

### 3. ⚠️ Secret JWT par défaut
Le fichier `.env` utilise un secret JWT trivial : `tunisia_store_secret_key_2024_change_in_production`. Si l'application est déployée telle quelle, n'importe qui peut forger des tokens d'administrateur.
*   **Recommandation :** Générer une chaîne aléatoire forte de 256 bits (ex: avec `crypto.randomBytes(64).toString('hex')`) avant le déploiement en production.

---

## 🟠 Risques Moyens

### 4. ⚠️ Vulnérabilité potentielle sur l'upload de fichiers
Le middleware d'upload (`upload.js`) vérifie seulement le `mimetype` envoyé par le client (qui peut être falsifié) et conserve l'extension d'origine (`path.extname(file.originalname)`). Un attaquant pourrait renommer un fichier exécutable (ex: `shell.php` ou `malware.html`) avec un faux mimetype d'image.
*   **Recommandation :** 
    *   Ne pas faire confiance à l'extension fournie par l'utilisateur. 
    *   Forcer l'extension en fonction d'une validation stricte (ex: vérifier les "magic numbers" des fichiers).
    *   S'assurer que le dossier `uploads` est configuré dans le serveur web (Nginx/Apache) pour ne jamais exécuter de scripts.

### 5. ⚠️ Limite de Rate Limiting trop élevée
Le middleware `strictLimiter` pour les routes `/api/auth/login` et `/forgot-password` est configuré à **200 requêtes par minute**. C'est beaucoup trop élevé et ne protège pas efficacement contre les attaques par force brute (Brute Force / Credential Stuffing).
*   **Recommandation :** Réduire la limite pour la connexion à **5 ou 10 tentatives maximum par période de 15 minutes** pour une même adresse IP.

### 6. ⚠️ Limite de payload JSON trop large
Le serveur utilise `express.json({ limit: '10mb' })`. Autoriser des requêtes JSON de 10 Mo peut ouvrir la porte à des attaques par déni de service (DoS), saturant la mémoire du serveur Node.js.
*   **Recommandation :** Réduire cette limite à `100kb` ou `1mb` maximum, sauf si l'envoi d'images encodées en base64 est absolument nécessaire dans le corps JSON.

---

## 🟡 Risques Faibles / Bonnes Pratiques à revoir

### 7. ℹ️ Configuration Helmet désactivée (CORP)
L'application utilise `helmet({ crossOriginResourcePolicy: false })`. Bien que Helmet soit présent, désactiver la politique CORP réduit la sécurité globale contre les attaques cross-origin.
*   **Recommandation :** Configurer correctement les origines autorisées plutôt que de désactiver la protection globalement.

### 8. ℹ️ Gestion des erreurs en production
Le gestionnaire d'erreurs (`server.js`) renvoie `err.message`. Parfois, les messages d'erreur de la base de données (Mongoose) peuvent révéler des détails sur la structure interne ou des chemins de fichiers.
*   **Recommandation :** En mode production (`NODE_ENV === 'production'`), masquer les messages d'erreur internes en renvoyant des messages génériques du type "Erreur interne du serveur".

---

## ✅ Points Positifs Validés
*   **Hachage des mots de passe :** L'utilisation de `bcryptjs` avec 12 tours de salage (`userSchema.pre('save')`) est excellente et sécurisée.
*   **CORS :** Le `cors` est configuré pour n'autoriser que `http://localhost:4200`, empêchant d'autres sites d'appeler l'API (à paramétrer dynamiquement en production).
*   **Protection contre l'Injection SQL / NoSQL :** L'utilisation de Mongoose (ORM) avec des schémas stricts protège naturellement contre la majorité des injections.
*   **Validation des données :** L'utilisation de `express-validator` est présente sur les routes d'authentification.
