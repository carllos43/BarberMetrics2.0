import { useGetDailySummary, getGetDailySummaryQueryKey, useGetRangeSummary, useGetSettings } from "@workspace/api-client-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency, formatTime } from "@/lib/utils";
import { motion } from "framer-motion";
import { BarChart, Bar, ResponsiveContainer, Cell } from "recharts";

export function Home() {
  const today = format(new Date(), "yyyy-MM-dd");
  
  const { data: settings } = useGetSettings();
  const { data: summary, isLoading } = useGetDailySummary({ date: today });
  
  const startDate = format(subDays(new Date(), 6), "yyyy-MM-dd");
  const { data: rangeSummary } = useGetRangeSummary({ startDate, endDate: today });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const name = settings?.barbershopName || "Profissional";

  if (isLoading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-20 bg-[#1C1C1E] rounded-3xl" />
      <div className="h-40 bg-[#1C1C1E] rounded-3xl" />
      <div className="h-32 bg-[#1C1C1E] rounded-3xl" />
    </div>;
  }

  const goal = summary?.goal || 1;
  const progressPct = summary?.goalProgressPct || 0;
  const revenue = summary?.totalRevenue || 0;

  return (
    <div className="space-y-8 pb-10">
      {/* Header / Main Value */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-4"
      >
        <p className="text-gray-400 text-sm font-medium tracking-wide uppercase mb-1">
          {greeting}, {name}
        </p>
        <h1 className="text-5xl font-black tabular-nums tracking-tight text-white">
          {formatCurrency(revenue)}
        </h1>
      </motion.div>

      {/* Activity Ring Equivalent */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center justify-center bg-[#1C1C1E] rounded-3xl p-6 shadow-lg shadow-black/40"
      >
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90 absolute inset-0">
            <circle
              cx="80" cy="80" r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-[#2C2C2E]"
            />
            <circle
              cx="80" cy="80" r="70"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 70}
              strokeDashoffset={2 * Math.PI * 70 * (1 - Math.min(progressPct, 100) / 100)}
              strokeLinecap="round"
              className="text-amber-500 transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="text-center flex flex-col items-center">
            <span className="text-3xl font-bold tabular-nums">{Math.round(progressPct)}%</span>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Meta Diária</p>
          <p className="text-sm text-gray-300 font-medium tabular-nums">{formatCurrency(goal)}</p>
        </div>
      </motion.div>

      {/* Stat Cards - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Cortes hoje", value: String(summary?.totalAppointments || 0) },
          { label: "Ticket médio", value: formatCurrency(summary?.avgTicket || 0) },
          { label: "Tempo trab.", value: formatTime(summary?.workedSeconds || 0) },
          { label: "Ganho/hora", value: formatCurrency(summary?.revenuePerHour || 0) },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            className="bg-[#1C1C1E] p-4 rounded-3xl shadow-lg shadow-black/40 min-w-0"
          >
            <p className="text-[10px] uppercase font-semibold tracking-wider text-gray-500 mb-2 truncate">
              {stat.label}
            </p>
            <p className="text-lg font-bold text-white tabular-nums truncate">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Mini Bar Chart */}
      {rangeSummary && rangeSummary.days.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#1C1C1E] rounded-3xl p-6 shadow-lg shadow-black/40"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs uppercase font-semibold tracking-wider text-gray-500">Resumo da Semana</h3>
            <span className="text-sm font-bold text-white tabular-nums">
              {formatCurrency(rangeSummary.totalRevenue)}
            </span>
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rangeSummary.days}>
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {rangeSummary.days.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.date === today ? "#D4A853" : "#3F3F46"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-2 px-1">
            {rangeSummary.days.map((d, i) => (
              <span key={i} className="text-[10px] text-gray-500 font-medium">
                {format(new Date(d.date), "EE", { locale: ptBR }).charAt(0).toUpperCase()}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
