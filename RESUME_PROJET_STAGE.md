# Résumé du projet de stage - Application de gestion de boutique

## 1. Nom et objectif du projet

Le projet est une application web de gestion de boutique appelée **1ere Commerce**.

Son objectif est d’aider une petite boutique ou un commerce à gérer ses activités quotidiennes depuis une seule plateforme : les ventes, les produits, les catégories, le stock, les commandes, la caisse, les utilisateurs et les rapports.

L’application fonctionne comme un mini ERP adapté à une boutique, avec un module de point de vente POS pour enregistrer rapidement les ventes.

## 2. Pages et fonctionnalités principales

### Tableau de bord

Cette page donne une vue générale de l’activité de la boutique. Elle affiche les chiffres importants comme le chiffre d’affaires, les ventes du jour, les commandes en cours, la valeur du stock et les alertes de stock.

Elle contient aussi des graphiques simples pour mieux visualiser les statistiques.

### Vente / POS

Cette page est utilisée pour effectuer les ventes en caisse.

Avant de vendre, l’utilisateur ouvre une session de caisse avec un montant initial. Ensuite, il peut sélectionner des produits, les ajouter au panier, choisir le mode de paiement et valider la vente. Le système génère aussi un ticket de vente.

### Produits

Cette page permet de gérer les produits de la boutique.

Le gérant peut ajouter, modifier, supprimer ou consulter les produits. Chaque produit peut avoir une catégorie, un prix, un stock, une image et des variantes.

### Catégories

Cette page permet d’organiser les produits par catégories.

Elle affiche la liste des catégories, permet d’en ajouter ou modifier, et montre aussi le nombre de produits associés à chaque catégorie.

### Mouvements de stock

Cette page permet de suivre les entrées, sorties et ajustements de stock.

Elle aide à comprendre pourquoi le stock change : vente, ajout manuel, correction ou ajustement. Les mouvements liés aux ventes peuvent aussi générer un ticket PDF.

### Commandes

Cette page permet de gérer les commandes clients.

Elle sert à enregistrer les commandes personnalisées, suivre leur état et mettre à jour leur progression jusqu’à la livraison ou le paiement.

### Rapports ventes

Cette page affiche les ventes enregistrées dans le système.

Elle permet au gérant de consulter les ventes, les montants, les vendeurs concernés, les méthodes de paiement et les informations utiles pour le suivi commercial.

### Caisse

Cette page permet de suivre les sessions de caisse.

Elle affiche les ouvertures et fermetures de caisse, les montants initiaux, les montants attendus, les paiements et les différences éventuelles.

### Utilisateurs

Cette page permet au gérant de gérer les comptes utilisateurs.

Elle permet de voir les utilisateurs, leurs rôles, et de désactiver ou supprimer un compte sans supprimer les rapports de vente déjà enregistrés.

### Paramètres

Cette page permet de configurer les informations de la boutique.

On peut modifier le nom de la boutique, le téléphone, l’adresse, le logo et le message affiché sur les tickets. Elle contient aussi les préférences comme la langue, le thème et le mot de passe.

## 3. Rôles utilisateurs

### Gérant

Le gérant est l’administrateur principal de l’application.

Il a accès à toutes les pages et toutes les fonctionnalités : tableau de bord, ventes, produits, catégories, stock, commandes, rapports, caisse, utilisateurs et paramètres.

Le gérant peut aussi faire des ventes comme un vendeur.

### Vendeur

Le vendeur a un accès limité.

Il peut utiliser principalement la page Vente / POS pour vendre les produits, ouvrir une caisse et enregistrer les transactions. Il peut aussi accéder aux commandes si nécessaire, mais il n’a pas accès aux fonctionnalités d’administration comme les produits, utilisateurs ou paramètres.

## 4. Technologies utilisées

L’application est développée avec des technologies web modernes.

### Frontend

Le frontend est développé avec **React** et **TypeScript**.

React permet de construire l’interface utilisateur sous forme de composants. TypeScript aide à rendre le code plus fiable en ajoutant des types.

### Base de données et backend

La base de données est gérée avec **Supabase**.

Supabase sert à stocker les utilisateurs, les produits, les catégories, les ventes, les mouvements de stock, les commandes et les sessions de caisse.

Il est aussi utilisé pour l’authentification des utilisateurs et le stockage des images, par exemple les logos et les images produits.

### Structure générale

L’application est principalement une application frontend connectée à Supabase.

Le frontend affiche les pages et les formulaires, tandis que Supabase gère les données, les permissions et l’authentification.

## 5. Points forts du projet

- L’application centralise plusieurs besoins d’une boutique dans un seul outil.
- Le module POS permet de vendre rapidement et de générer un ticket.
- Le stock est mis à jour et suivi à travers les mouvements.
- Les catégories facilitent l’organisation des produits.
- Le gérant peut suivre l’activité grâce au tableau de bord et aux rapports.
- Les rôles permettent de séparer les accès entre gérant et vendeur.
- Les paramètres permettent de personnaliser la boutique et les tickets.
- L’interface a été améliorée pour ressembler davantage à un outil professionnel de gestion.

## 6. Limites actuelles et améliorations possibles

Même si le projet contient déjà beaucoup de fonctionnalités, certaines parties peuvent encore être améliorées.

- Certaines permissions Supabase doivent être bien vérifiées et appliquées dans la base de données pour éviter les blocages.
- Le système de rapports peut être enrichi avec plus de filtres : par date, vendeur, produit ou catégorie.
- Les tickets peuvent encore être améliorés graphiquement pour être plus proches d’un ticket professionnel imprimé.
- Le module POS peut être optimisé davantage pour tablette et écran tactile.
- Il faudrait ajouter plus de tests pour vérifier automatiquement les ventes, le stock, la caisse et les permissions.
- La gestion des retours, remboursements et dépenses de caisse peut être développée davantage.
- Certaines statistiques du tableau de bord peuvent être rendues plus détaillées et exportables.
- Il serait utile d’ajouter une documentation d’installation et d’utilisation pour faciliter la maintenance du projet.

## Conclusion

Ce projet est une application de gestion de boutique complète qui couvre les besoins essentiels d’un petit commerce : vente, produits, stock, caisse, utilisateurs et rapports.

Il permet au gérant d’avoir une vision globale de l’activité et au vendeur d’effectuer les ventes rapidement. Le projet peut encore évoluer, mais il constitue déjà une base solide pour une solution de gestion commerciale simple, pratique et adaptée aux petites boutiques.
