export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";

// Colonnes disponibles pour l'export
const AVAILABLE_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "subject", label: "Sujet" },
  { key: "from", label: "Expéditeur" },
  { key: "to", label: "Destinataire" },
  { key: "category", label: "Catégorie" },
  { key: "action", label: "Action IA" },
  { key: "aiResponse", label: "Réponse IA" },
  { key: "createdAt", label: "Date" },
];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const orgId = session.user.orgId!;

  const body = await req.json();
  const {
    keywords = [] as string[],   // mots-clés dans le sujet
    fromFilter = "",              // filtre expéditeur
    categories = [] as string[], // catégories à inclure
    dateFrom,                    // date début ISO string
    dateTo,                      // date fin ISO string
    columns = ["subject", "from", "category", "action", "createdAt"] as string[],
    filename = "extraction-emails",
  } = body;

  // Construction des filtres Prisma
  const where: Record<string, unknown> = { orgId };

  if (keywords.length > 0) {
    where.OR = keywords.map((kw: string) => ({
      subject: { contains: kw, mode: "insensitive" },
    }));
  }

  if (fromFilter) {
    where.from = { contains: fromFilter, mode: "insensitive" };
  }

  if (categories.length > 0) {
    where.category = { in: categories };
  }

  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  const logs = await prisma.emailLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10000, // max 10k lignes
  });

  if (logs.length === 0) {
    return NextResponse.json({ error: "Aucun email trouvé avec ces filtres." }, { status: 404 });
  }

  // Construction des lignes Excel
  const validCols = AVAILABLE_COLUMNS.filter((c) => columns.includes(c.key));
  const headers = validCols.map((c) => c.label);

  const rows = logs.map((log) => {
    return validCols.map((col) => {
      const val = log[col.key as keyof typeof log];
      if (col.key === "createdAt" && val instanceof Date) {
        return val.toLocaleString("fr-FR");
      }
      return val ?? "";
    });
  });

  // Génération Excel
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Style largeur colonnes
  ws["!cols"] = validCols.map((c) =>
    c.key === "subject" || c.key === "aiResponse" ? { wch: 50 } : { wch: 20 }
  );

  XLSX.utils.book_append_sheet(wb, ws, "Emails");

  // Feuille résumé
  const summaryData = [
    ["Extraction SortAI"],
    ["Date d'export", new Date().toLocaleString("fr-FR")],
    ["Total emails", logs.length],
    ["Filtres appliqués"],
    ["Mots-clés", keywords.join(", ") || "—"],
    ["Expéditeur contient", fromFilter || "—"],
    ["Catégories", categories.join(", ") || "—"],
    ["Date début", dateFrom ? new Date(dateFrom).toLocaleDateString("fr-FR") : "—"],
    ["Date fin", dateTo ? new Date(dateTo).toLocaleDateString("fr-FR") : "—"],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary["!cols"] = [{ wch: 25 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Résumé");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}-${Date.now()}.xlsx"`,
    },
  });
}
