# SortAI — Note de coûts mise à jour

Date de référence : 2026-05-05

## Hypothèses

- Le produit automatise des réponses de mails avec un workflow RAG.
- Les fichiers / données utilisateurs servent de base documentaire.
- On ne stocke pas les emails eux-mêmes de façon volumineuse ; on conserve surtout les identifiants OAuth, la configuration et la base de connaissances importée par l'utilisateur.
- L'infrastructure ne varie pas significativement avec le nombre d'emails traités par mois tant qu'on reste sur une petite phase de lancement.
- Hypothèse de charge : 100, 1 000 et 10 000 emails / mois.
- Hypothèse moyenne par email : 500 tokens d'entrée et 200 tokens de sortie.

## Prix IA par million de tokens

| Modèle | Entrée | Sortie | Contexte |
|---|---:|---:|---:|
| GPT-4o mini | 0,15 $ / 1M | 0,60 $ / 1M | 128k tokens |
| GPT-4o | 2,50 $ / 1M | 10,00 $ / 1M | - |
| Claude Haiku 4.5 | 1,00 $ / 1M | 5,00 $ / 1M | 200k tokens |
| Claude Sonnet 4.5 | 3,00 $ / 1M | 15,00 $ / 1M | 200k tokens puis grille étendue |

## Coût IA estimé par volume

| Modèle | 100 emails/mois | 1 000 emails/mois | 10 000 emails/mois | Coût / email |
|---|---:|---:|---:|---:|
| GPT-4o mini | 0,02 $ | 0,20 $ | 1,95 $ | 0,000195 $ |
| GPT-4o | 0,13 $ | 1,25 $ | 12,50 $ | 0,00125 $ |
| Claude Haiku 4.5 | 0,15 $ | 1,50 $ | 15,00 $ | 0,00150 $ |
| Claude Sonnet 4.5 | 0,45 $ | 4,50 $ | 45,00 $ | 0,00450 $ |

## Coûts RAG et stockage

| Poste | 100 emails/mois | 1 000 emails/mois | 10 000 emails/mois | Hypothèse |
|---|---:|---:|---:|---|
| Embeddings / indexation RAG | 0 à 1 $ | 1 à 3 $ | 3 à 10 $ | Indexation des nouveaux fichiers uniquement |
| Base vectorielle / pgvector | 0 à 2 $ | 0 à 5 $ | 0 à 15 $ | Coût lié à la taille de la base de connaissances importée, pas au volume d'emails |
| Stockage fichiers / pièces jointes | 0 à 1 $ | 0 à 2 $ | 0 à 5 $ | On stocke peu de données runtime ; surtout les fichiers importés et la config |

## Coûts fixes d'infrastructure

| Poste | Coût mensuel | Remarque |
|---|---:|---|
| Hébergement front / API | 0 $ | Vercel Hobby au départ |
| Base de données applicative | 0 $ | Free tier tant qu'on reste léger |
| Monitoring | 0 $ | Optionnel au démarrage |
| Domaine | ~1 $ | Coût amorti mensuellement |
| Total infra fixe | **1 à 2 $** | Stable tant qu'on n'a pas besoin de plans payants |

## Total mensuel estimé

### Avec GPT-4o mini

| Volume mensuel | IA | RAG | Stockage | Infra fixe | Total estimé |
|---|---:|---:|---:|---:|---:|
| 100 emails | 0,02 $ | 1 à 3 $ | 0 à 1 $ | 1 à 2 $ | 2 à 6 $ |
| 1 000 emails | 0,20 $ | 2 à 6 $ | 0 à 2 $ | 1 à 2 $ | 3 à 10 $ |
| 10 000 emails | 1,95 $ | 4 à 15 $ | 0 à 5 $ | 1 à 2 $ | 7 à 23 $ |

### Avec Claude Haiku 4.5

| Volume mensuel | IA | RAG | Stockage | Infra fixe | Total estimé |
|---|---:|---:|---:|---:|---:|
| 100 emails | 0,15 $ | 1 à 3 $ | 0 à 1 $ | 1 à 2 $ | 2 à 6 $ |
| 1 000 emails | 1,50 $ | 2 à 6 $ | 0 à 2 $ | 1 à 2 $ | 4 à 12 $ |
| 10 000 emails | 15,00 $ | 4 à 15 $ | 0 à 5 $ | 1 à 2 $ | 20 à 37 $ |

### Avec Claude Sonnet 4.5

| Volume mensuel | IA | RAG | Stockage | Infra fixe | Total estimé |
|---|---:|---:|---:|---:|---:|
| 100 emails | 0,45 $ | 1 à 3 $ | 0 à 1 $ | 1 à 2 $ | 2 à 6 $ |
| 1 000 emails | 4,50 $ | 2 à 6 $ | 0 à 2 $ | 1 à 2 $ | 8 à 15 $ |
| 10 000 emails | 45,00 $ | 4 à 15 $ | 0 à 5 $ | 1 à 2 $ | 50 à 67 $ |

## Lecture business

Le coût fixe d'infrastructure reste très bas au démarrage. La variable principale est surtout le coût IA, puis l'indexation RAG si les utilisateurs importent beaucoup de documents ou renouvellent souvent leur base de connaissances.

Le coût n'augmente pas vraiment avec le nombre d'emails tant qu'on reste dans une logique de lecture de contexte ponctuelle. Ce qui fait monter la facture, c'est surtout :
- la taille des documents importés,
- le nombre de réindexations,
- le nombre de chunks récupérés à chaque réponse,
- le choix du modèle.

## Recommandation produit

- GPT-4o mini pour les mails standards.
- pgvector sur Supabase pour la base de connaissance.
- Stockage minimal des données runtime ; garder surtout les identifiants OAuth et la base documentaire importée.

## Conclusion

Pour un SaaS de cette taille, l'infrastructure de base peut rester presque plate tant qu'on ne change pas de tier. La croissance des coûts viendra surtout des usages IA et de la taille des bases documentaires importées, pas du volume brut d'emails eux-mêmes.