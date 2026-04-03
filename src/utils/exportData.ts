import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Transaction, Category } from "@/contexts/FinanceContext";

interface ExportOptions {
  transactions: Transaction[];
  categories: Category[];
  title?: string;
}

const getCategoryName = (id: string | null | undefined, categories: Category[]) =>
  categories.find((c) => c.id === id)?.name || "Sem categoria";

export function exportToCSV({ transactions, categories, title }: ExportOptions) {
  const header = ["Data", "Tipo", "Descrição", "Categoria", "Valor (R$)", "Parcela"];
  const rows = transactions.map((t) => [
    format(new Date(t.date), "dd/MM/yyyy"),
    t.type === "income" ? "Entrada" : "Despesa",
    t.description,
    t.type === "expense" ? getCategoryName(t.category_id, categories) : "—",
    t.amount.toFixed(2).replace(".", ","),
    t.current_installment ? `${t.current_installment}/${t.installments}` : "—",
  ]);

  const csvContent = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${title || "transacoes"}_${format(new Date(), "yyyy-MM-dd")}.csv`);
}

export function exportToPDF({ transactions, categories, title }: ExportOptions) {
  const doc = new jsPDF();
  const pageTitle = title || "Relatório de Transações";

  // Header
  doc.setFontSize(18);
  doc.setTextColor(100, 92, 231);
  doc.text("FinControl", 14, 20);
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  doc.text(pageTitle, 14, 30);
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 37);

  // Summary
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(`Total Entradas: R$ ${totalIncome.toFixed(2)}`, 14, 46);
  doc.text(`Total Despesas: R$ ${totalExpense.toFixed(2)}`, 14, 52);
  doc.text(`Saldo: R$ ${(totalIncome - totalExpense).toFixed(2)}`, 14, 58);

  // Table
  const tableData = transactions.map((t) => [
    format(new Date(t.date), "dd/MM/yyyy"),
    t.type === "income" ? "Entrada" : "Despesa",
    t.description,
    t.type === "expense" ? getCategoryName(t.category_id, categories) : "—",
    `R$ ${t.amount.toFixed(2)}`,
    t.current_installment ? `${t.current_installment}/${t.installments}` : "—",
  ]);

  autoTable(doc, {
    startY: 64,
    head: [["Data", "Tipo", "Descrição", "Categoria", "Valor", "Parcela"]],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [100, 92, 231], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    columnStyles: {
      4: { halign: "right" },
    },
  });

  doc.save(`${title || "transacoes"}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
