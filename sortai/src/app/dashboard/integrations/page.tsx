import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { IntegrationCard } from "@/components/dashboard/IntegrationCard";

export const metadata = { title: "Agents & Intégrations" };

const INTEGRATION_CATALOG = [
  {
    type: "gmail",
    name: "Gmail",
    description: "Connectez votre boîte Gmail pour que l'agent Email puisse lire, catégoriser et répondre à vos messages.",
    icon: "📧",
    color: "#EA4335",
    scopes: ["gmail.readonly", "gmail.send", "gmail.modify"],
    authUrl: "/api/integrations/gmail/connect",
  },
  {
    type: "outlook",
    name: "Outlook / Microsoft 365",
    description: "Connectez votre messagerie Outlook ou Microsoft 365 pour une gestion email complète.",
    icon: "📬",
    color: "#0078D4",
    scopes: ["Mail.ReadWrite", "Mail.Send", "Calendars.ReadWrite"],
    authUrl: "/api/integrations/outlook/connect",
  },
  {
    type: "slack",
    name: "Slack",
    description: "Intégrez Slack pour permettre à l'agent de répondre aux questions de votre équipe et résumer les discussions.",
    icon: "💬",
    color: "#4A154B",
    scopes: ["channels:read", "chat:write", "users:read"],
    authUrl: "/api/integrations/slack/connect",
  },
  {
    type: "notion",
    name: "Notion",
    description: "Connectez Notion pour créer des pages, mettre à jour des bases de données et générer des comptes-rendus automatiquement.",
    icon: "📝",
    color: "#ffffff",
    scopes: ["read_content", "update_content", "insert_content"],
    authUrl: "/api/integrations/notion/connect",
  },
];

const COMING_SOON_CATALOG = [
  // Communication
  {
    type: "teams",
    name: "Microsoft Teams",
    description: "Automatisez vos réunions, résumez les conversations et gérez les tâches d'équipe directement depuis Teams.",
    icon: "🟣",
    color: "#6264A7",
    category: "Communication",
    useCases: ["Résumé de réunions", "Alertes d'équipe", "Planification automatique"],
  },
  {
    type: "zoom",
    name: "Zoom",
    description: "Transcription automatique des réunions, création de comptes-rendus et suivi des actions décidées.",
    icon: "📹",
    color: "#2D8CFF",
    category: "Communication",
    useCases: ["Transcription IA", "Compte-rendu auto", "Suivi des décisions"],
  },
  {
    type: "whatsapp",
    name: "WhatsApp Business",
    description: "Répondez automatiquement aux demandes clients sur WhatsApp et qualifiez vos leads entrants.",
    icon: "💚",
    color: "#25D366",
    category: "Communication",
    useCases: ["Réponse automatique", "Qualification leads", "Support client"],
  },
  // Gestion de projet
  {
    type: "trello",
    name: "Trello",
    description: "Créez des cartes automatiquement depuis vos emails, mettez à jour les statuts et notifiez votre équipe.",
    icon: "🗂️",
    color: "#0052CC",
    category: "Gestion de projet",
    useCases: ["Création de cartes", "Mise à jour statuts", "Notifications"],
  },
  {
    type: "asana",
    name: "Asana",
    description: "Transformez vos emails et messages en tâches Asana, assignez automatiquement et suivez les deadlines.",
    icon: "📋",
    color: "#F06A6A",
    category: "Gestion de projet",
    useCases: ["Création de tâches", "Assignation auto", "Suivi deadlines"],
  },
  {
    type: "jira",
    name: "Jira",
    description: "Créez et mettez à jour des tickets Jira depuis vos emails clients, avec priorité et assignation automatiques.",
    icon: "🔵",
    color: "#0052CC",
    category: "Gestion de projet",
    useCases: ["Création de tickets", "Triage automatique", "Suivi sprints"],
  },
  {
    type: "monday",
    name: "Monday.com",
    description: "Synchronisez vos données et automatisez la mise à jour de vos tableaux Monday depuis vos outils.",
    icon: "📊",
    color: "#FF3D57",
    category: "Gestion de projet",
    useCases: ["Mise à jour tableaux", "Alertes automatiques", "Reporting"],
  },
  // CRM
  {
    type: "hubspot",
    name: "HubSpot",
    description: "Enrichissez vos contacts automatiquement, créez des deals depuis vos emails et déclenchez des séquences.",
    icon: "🟠",
    color: "#FF7A59",
    category: "CRM",
    useCases: ["Enrichissement contacts", "Création de deals", "Séquences email"],
  },
  {
    type: "salesforce",
    name: "Salesforce",
    description: "Synchronisez vos leads, mettez à jour les opportunités et générez des rapports commerciaux automatiquement.",
    icon: "☁️",
    color: "#00A1E0",
    category: "CRM",
    useCases: ["Sync leads", "Rapports auto", "Pipeline IA"],
  },
  {
    type: "pipedrive",
    name: "Pipedrive",
    description: "Alimentez votre pipeline automatiquement depuis vos emails et qualifiez vos prospects avec l'IA.",
    icon: "🟢",
    color: "#1A9C3E",
    category: "CRM",
    useCases: ["Pipeline auto", "Qualification IA", "Suivi relances"],
  },
  // Stockage
  {
    type: "googledrive",
    name: "Google Drive",
    description: "Organisez vos fichiers, générez des documents et partagez automatiquement selon vos règles métier.",
    icon: "📁",
    color: "#4285F4",
    category: "Stockage & Documents",
    useCases: ["Organisation auto", "Génération docs", "Partage intelligent"],
  },
  {
    type: "onedrive",
    name: "OneDrive / SharePoint",
    description: "Gérez vos documents Microsoft, automatisez l'archivage et la classification de vos fichiers.",
    icon: "🔷",
    color: "#0078D4",
    category: "Stockage & Documents",
    useCases: ["Archivage auto", "Classification IA", "Sync équipe"],
  },
  // Comptabilité
  {
    type: "quickbooks",
    name: "QuickBooks",
    description: "Catégorisez vos dépenses, générez des rapports financiers et automatisez la facturation.",
    icon: "💰",
    color: "#2CA01C",
    category: "Comptabilité",
    useCases: ["Catégorisation dépenses", "Rapports financiers", "Facturation auto"],
  },
  {
    type: "pennylane",
    name: "Pennylane",
    description: "Synchronisez vos factures, automatisez la réconciliation et générez vos tableaux de bord financiers.",
    icon: "🪙",
    color: "#6C47FF",
    category: "Comptabilité",
    useCases: ["Sync factures", "Réconciliation auto", "Dashboard financier"],
  },
  // Support
  {
    type: "zendesk",
    name: "Zendesk",
    description: "Triez et répondez automatiquement aux tickets, suggérez des solutions et escaladez les cas complexes.",
    icon: "🎫",
    color: "#03363D",
    category: "Support client",
    useCases: ["Triage automatique", "Réponses IA", "Escalade intelligente"],
  },
  {
    type: "intercom",
    name: "Intercom",
    description: "Qualifiez vos visiteurs, répondez aux chats et déclenchez des campagnes selon le comportement utilisateur.",
    icon: "💬",
    color: "#1F8DED",
    category: "Support client",
    useCases: ["Qualification visiteurs", "Chat IA", "Campagnes auto"],
  },
  // E-commerce
  {
    type: "shopify",
    name: "Shopify",
    description: "Gérez vos commandes, répondez aux demandes clients et optimisez vos fiches produits avec l'IA.",
    icon: "🛍️",
    color: "#96BF48",
    category: "E-commerce",
    useCases: ["Gestion commandes", "Support client auto", "Optimisation produits"],
  },
];

const CATEGORIES = ["Communication", "Gestion de projet", "CRM", "Stockage & Documents", "Comptabilité", "Support client", "E-commerce"];

export default async function IntegrationsPage() {
  const session = await getServerSession(authOptions);
  const orgId = session!.user.orgId;

  const integrations = orgId
    ? await prisma.integration.findMany({ where: { orgId } })
    : [];

  const intMap = new Map(integrations.map((i) => [i.type, i]));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Intégrations</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Connectez vos outils pour activer les agents IA correspondants
        </p>
      </div>

      {/* Intégrations actives */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          Disponibles maintenant
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {INTEGRATION_CATALOG.map((cat) => (
            <IntegrationCard
              key={cat.type}
              catalog={cat}
              integration={intMap.get(cat.type) ?? null}
            />
          ))}
        </div>
      </div>

      {/* Intégrations à venir par catégorie */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Bientôt disponible
          </h2>
          <span className="badge text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }}>
            Sur mesure par client
          </span>
        </div>

        {CATEGORIES.map((category) => {
          const tools = COMING_SOON_CATALOG.filter((t) => t.category === category);
          if (!tools.length) return null;
          return (
            <div key={category}>
              <h3 className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>{category}</h3>
              <div className="grid md:grid-cols-3 gap-3">
                {tools.map((tool) => (
                  <div key={tool.type} className="card opacity-80 hover:opacity-100 transition-opacity" style={{ borderStyle: "dashed" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                        style={{ background: `${tool.color}15`, border: `1px solid ${tool.color}25` }}>
                        {tool.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{tool.name}</p>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>Bientôt disponible</span>
                      </div>
                    </div>
                    <p className="text-xs mb-3" style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
                      {tool.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {tool.useCases.map((u) => (
                        <span key={u} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                          {u}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ borderColor: "rgba(56,189,248,0.2)", background: "rgba(56,189,248,0.04)" }}>
        <h3 className="font-semibold mb-2 text-sm">🔒 Sécurité des données</h3>
        <p className="text-sm" style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
          SortAI ne stocke jamais le contenu de vos emails ou messages. Les tokens OAuth sont chiffrés
          et utilisés uniquement pour exécuter les actions demandées par vos agents.
          Vous pouvez déconnecter un service à tout moment.
        </p>
      </div>
    </div>
  );
}
