# BTQ Commerce

Plateforme de commerce en ligne construite pendant le stage NETCOM SA. Le projet couvre les objectifs du guide jusqu'a la page 30 : catalogue, stock, vente POS, commandes speciales, tickets, rapports, caisse, parametres et preparation de livraison.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- React Router
- i18next FR/AR avec support RTL
- Supabase Auth, Database et Storage
- Zustand
- TanStack Query
- TanStack Table
- React Hook Form + Zod

## Roles

- `vendeur` : acces a la vente POS et aux commandes.
- `gerant` : acces complet a toutes les pages.
- `gerant@btq.test` est traite comme compte gerant.
- Les autres nouveaux comptes sont vendeurs.

## Modules livres

- Authentification Supabase sans OTP obligatoire cote application.
- Protection des routes et navigation selon le role.
- Catalogue produits avec CRUD, categories separees, variantes, prix, stock et upload image Supabase Storage.
- Gestion des categories avec page dediee.
- Mouvements de stock et alertes de stock faible.
- POS complet : recherche debounced, panier persistant, remise, TVA, paiement, validation, sortie de stock.
- Workflow caisse POS : l'ecran POS reste ferme tant qu'aucune session de caisse n'est ouverte ; chaque vente et mouvement de stock est lie automatiquement a la session active.
- Ecran ticket apres vente, ticket imprimable et telechargeable PDF.
- Commandes speciales avec CRUD, statuts, ticket et suppression gerant.
- Dashboard gerant avec KPI, valeur stock et alertes.
- Rapports ventes avec filtres periode et export CSV compatible Excel francais.
- Caisse journaliere : ouverture, fermeture, montant attendu et historique.
- Gestion utilisateurs : activation/desactivation par gerant.
- Page parametres : logo boutique, infos ticket, preferences langue/theme et changement de mot de passe.
- Theme clair/sombre.
- Fichiers de suivi : `BUGS.md`, `BLOCAGES.md`, `IDEES-FUTURES.md`, `Observations terrain.md`.

## Pages principales

- `/login`
- `/vente`
- `/ticket/vente`
- `/commandes`
- `/produits`
- `/categories`
- `/stock`
- `/alertes-stock`
- `/dashboard`
- `/ventes`
- `/caisse`
- `/utilisateurs`
- `/settings`

## Supabase

Executer les scripts SQL dans Supabase SQL Editor selon le besoin :

1. `supabase/schema.sql`
2. `supabase/seed.sql`
3. `supabase/fix-users-rls.sql`
4. `supabase/role-based-access.sql`
5. `supabase/categories-crud.sql`
6. `supabase/storage-boutique-policy.sql`
7. `supabase/week4-catalog-stock.sql`
8. `supabase/week5-pos.sql`
9. `supabase/custom-orders-access.sql`
10. `supabase/week6-tickets-status.sql`
11. `supabase/settings.sql`
12. `supabase/week7-week8-completion.sql`

Le bucket Storage utilise est `boutique`.

## Variables d'environnement

Creer `.env` a la racine :

```bash
VITE_SUPABASE_URL=URL_DU_PROJET
VITE_SUPABASE_ANON_KEY=CLE_ANON_PUBLIC
```

## Lancer le projet

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Le dernier build local passe avec succes. Vite signale seulement un warning de taille de bundle, non bloquant.

## Parcours de demonstration

1. Se connecter en gerant.
2. Creer une categorie.
3. Creer un produit avec image et variante.
4. Faire une entree de stock si necessaire.
5. Realiser une vente depuis `/vente`.
6. Verifier la redirection vers le ticket.
7. Imprimer ou telecharger le ticket.
8. Verifier le mouvement de stock et telecharger le ticket depuis `/stock`.
9. Creer une commande speciale, changer son statut et generer son ticket.
10. Consulter dashboard, rapports ventes et caisse.
11. Tester la desactivation d'un utilisateur.
12. Modifier le logo et les infos boutique dans `/settings`.

## Notes de livraison

- Le PDF direct est genere cote navigateur sans dependance externe lourde.
- Le ticket imprimable de l'ecran `/ticket/vente` affiche le logo boutique.
- La creation d'utilisateurs Auth administrateur reste limitee par Supabase cote client ; le projet gere la desactivation des profils existants et la creation normale via l'ecran de connexion.
