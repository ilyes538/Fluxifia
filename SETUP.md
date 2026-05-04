# Novea SaaS — Guide de démarrage rapide

## Prérequis
- Node.js 20+
- pnpm (`npm install -g pnpm`)

## Installation

```bash
cd novea-saas
pnpm install
```

## Configuration

```bash
cp .env.example .env.local
```

Remplissez au minimum :
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="votre-secret-32-chars"
ANTHROPIC_API_KEY="sk-ant-..."
```

## Base de données

```bash
pnpm db:push        # Crée la DB SQLite et applique le schéma
pnpm db:studio      # Ouvre Prisma Studio (UI pour la DB)
```

## Lancer en développement

```bash
pnpm dev            # Démarre sur http://localhost:3000
```

## Stripe (paiements)

1. Créez un compte sur [stripe.com](https://stripe.com)
2. Créez 3 produits avec abonnement mensuel : Starter (49€), Pro (99€), Enterprise (299€)
3. Copiez les Price IDs dans `.env.local`
4. Lancez le webhook en local :
```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

## OAuth Intégrations

### Gmail
1. Google Cloud Console → Créer un projet → Activer Gmail API
2. Créer des identifiants OAuth 2.0 (type : Web application)
3. Ajouter `http://localhost:3000/api/integrations/gmail/callback` comme redirect URI

### Outlook / Microsoft 365
1. Azure Portal → App registrations → Nouvelle inscription
2. Ajouter `http://localhost:3000/api/integrations/outlook/callback` comme redirect URI
3. Ajouter les permissions : Mail.ReadWrite, Mail.Send

### Slack
1. api.slack.com → Create New App
2. OAuth & Permissions → Ajouter redirect URI
3. Activer les scopes : channels:read, chat:write

### Notion
1. notion.so/my-integrations → Créer une intégration publique
2. Ajouter `http://localhost:3000/api/integrations/notion/callback` comme redirect URI

## Architecture

```
src/app/
├── page.tsx                     # Landing page (marketing)
├── auth/{login,register}/       # Authentification
└── dashboard/
    ├── page.tsx                 # Vue d'ensemble
    ├── agents/                  # Gestion des agents IA
    ├── integrations/            # Connexion des outils
    ├── billing/                 # Plans et paiements
    └── settings/                # Paramètres

src/app/api/
├── auth/[...nextauth]/          # NextAuth
├── auth/register/               # Inscription
├── agents/                      # CRUD agents
├── ai/email/                    # Agent email (Claude)
├── billing/{checkout,portal,webhook}/
├── integrations/{gmail,outlook,slack,notion}/
└── settings/
```

## Déploiement (Vercel)

```bash
vercel deploy
```

Variables d'environnement à configurer dans Vercel :
- Toutes celles de `.env.example`
- `DATABASE_URL` → PostgreSQL (ex: Supabase, Neon, PlanetScale)
- `NEXTAUTH_URL` → URL de production

> **Note** : En production, remplacez SQLite par PostgreSQL.
> Modifiez `prisma/schema.prisma` : `provider = "postgresql"`
