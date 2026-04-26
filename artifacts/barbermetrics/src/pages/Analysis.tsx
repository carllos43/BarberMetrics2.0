import { useGetRangeSummary, useGetInsights } from "@workspace/api-client-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency, formatTime } from "@/lib/utils";
import { motion } from "framer-motion";
import { BarChart, Bar, ResponsiveContainer, Cell, XAxis } from "recharts";

export function Analysis() {
  const today = format(new Date(), "yyyy-MM-dd");
  const startDate = format(subDays(new Date(), 6), "yyyy-MM-dd");
  
  const { data: range, isLoading } = useGetRangeSummary({ startDate, endDate: today });
  const { data: insights } = useGetInsights({ date: today });

  if (isLoading) return <div className="p-4 animate-pulse">Carregando...</div>;

  return (
    <div className="space-y-8 pb-10">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Horas Trab.", value: formatTime(range?.workedSeconds || 0) },
          { label: "Horas Ociosas", value: formatTime(range?.idleSeconds || 0) },
          { label: "Ganho/Hora", value: formatCurrency(range?.revenuePerHour || 0) },
          { label: "Ticket Médio", value: formatCurrency(range?.avgTicket || 0) },
        ].map((metric, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#1C1C1E] p-5 rounded-3xl"
          >
            <p className="text-[10px] uppercase font-semibold text-gray-500 mb-1">{metric.label}</p>
            <p className="text-xl font-bold text-white tabular-nums">{metric.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Clean Bar Chart */}
      {range && range.days.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1C1C1E] rounded-3xl p-6"
        >
          <h3 className="text-xs uppercase font-semibold text-gray-500 mb-6">Faturamento Diário</h3>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={range.days} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {range.days.map((entry, index) => (
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
            {range.days.map((d, i) => (
              <span key={i} className="text-[10px] text-gray-500 font-medium">
                {format(new Date(d.date), "EE", { locale: ptBR }).charAt(0).toUpperCase()}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Insights */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase font-semibold text-gray-500 ml-2">Análise Inteligente</h3>
        {insights?.map((insight, i) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="bg-[#1C1C1E] p-5 rounded-2xl flex gap-4 items-start"
          >
            <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
              insight.tone === 'positive' ? 'bg-[#34C759]' : 
              insight.tone === 'warning' ? 'bg-[#FF3B30]' : 'bg-amber-500'
            }`} />
            <div>
              <h4 className="font-bold text-white mb-1">{insight.title}</h4>
              <p className="text-sm text-gray-400 leading-snug">{insight.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
