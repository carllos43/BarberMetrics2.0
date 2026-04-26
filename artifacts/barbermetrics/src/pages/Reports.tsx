import { useGetRangeSummary, useListAppointments, useGetSettings } from "@/lib/data";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { useState } from "react";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { motion } from "framer-motion";

type RangeType = "7days" | "30days" | "thisMonth" | "lastMonth";

export function Reports() {
  const [rangeType, setRangeType] = useState<RangeType>("7days");
  
  const now = new Date();
  let startDate = new Date();
  let endDate = now;

  if (rangeType === "7days") startDate = subDays(now, 6);
  if (rangeType === "30days") startDate = subDays(now, 29);
  if (rangeType === "thisMonth") {
    startDate = startOfMonth(now);
    endDate = endOfMonth(now);
  }
  if (rangeType === "lastMonth") {
    startDate = startOfMonth(subMonths(now, 1));
    endDate = endOfMonth(subMonths(now, 1));
  }

  const startDateStr = format(startDate, "yyyy-MM-dd");
  const endDateStr = format(endDate, "yyyy-MM-dd");

  const { data: range } = useGetRangeSummary({ startDate: startDateStr, endDate: endDateStr });
  const { data: appointments } = useListAppointments({ startDate: startDateStr, endDate: endDateStr });
  const { data: settings } = useGetSettings();

  const handleExportPDF = () => {
    if (!range || !appointments) return;
    
    const doc = new jsPDF();
    const barbershopName = settings?.barbershopName || "Profissional";
    const title = `BarberMetrics - ${barbershopName}`;
    const subtitle = `Período: ${format(startDate, "dd/MM/yyyy")} a ${format(endDate, "dd/MM/yyyy")}`;
    const issuedAt = `Emitido em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(subtitle, 14, 28);
    doc.text(issuedAt, 14, 34);

    // Summary block
    doc.text(`Faturamento Total: ${formatCurrency(range.totalRevenue)}`, 14, 46);
    doc.text(`Atendimentos: ${range.totalAppointments}`, 14, 52);
    doc.text(`Ticket Médio: ${formatCurrency(range.avgTicket)}`, 14, 58);

    const tableData = appointments.map(app => [
      format(new Date(app.startedAt), "dd/MM/yyyy"),
      format(new Date(app.startedAt), "HH:mm"),
      app.serviceName,
      Math.round((app.durationSeconds || 0)/60) + " min",
      formatCurrency(app.price)
    ]);

    autoTable(doc, {
      startY: 68,
      head: [['Data', 'Horário', 'Serviço', 'Duração', 'Valor']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [44, 44, 46], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { font: "helvetica", fontSize: 9 }
    });

    doc.save(`BarberMetrics_Relatorio_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Range Pills */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-2">
        {[
          { id: "7days", label: "7 dias" },
          { id: "30days", label: "30 dias" },
          { id: "thisMonth", label: "Este mês" },
          { id: "lastMonth", label: "Mês passado" }
        ].map(r => (
          <button
            key={r.id}
            onClick={() => setRangeType(r.id as RangeType)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              rangeType === r.id ? "bg-amber-500 text-black" : "bg-[#1C1C1E] text-white"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <motion.div 
        key={rangeType}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1C1C1E] rounded-3xl p-6 space-y-6"
      >
        <div>
          <p className="text-xs uppercase font-semibold text-gray-500 mb-1">Faturamento no período</p>
          <p className="text-4xl font-black tabular-nums text-white">
            {formatCurrency(range?.totalRevenue || 0)}
          </p>
        </div>

        <div className="flex justify-between border-t border-white/5 pt-4">
          <div>
            <p className="text-[10px] uppercase font-semibold text-gray-500 mb-1">Cortes</p>
            <p className="text-lg font-bold tabular-nums text-white">{range?.totalAppointments || 0}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-gray-500 mb-1">Ticket Médio</p>
            <p className="text-lg font-bold tabular-nums text-white">{formatCurrency(range?.avgTicket || 0)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-gray-500 mb-1">Horas</p>
            <p className="text-lg font-bold tabular-nums text-white">{formatDuration((range?.workedSeconds || 0))}</p>
          </div>
        </div>
      </motion.div>

      <button
        onClick={handleExportPDF}
        className="w-full bg-amber-500 text-black py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
      >
        <Download size={20} />
        Gerar Relatório PDF
      </button>
    </div>
  );
}
