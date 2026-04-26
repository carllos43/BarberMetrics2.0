import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCreateAppointment, useListServices } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { logAndExtract } from "@/lib/errors";

const PRESET_NAMES = ["Corte", "Barba", "Corte + Barba"];

export function QuickLaunch() {
  const { data: services } = useListServices();
  const { mutateAsync: createAppointment, isPending } = useCreateAppointment();
  const [customPriceStr, setCustomPriceStr] = useState("");
  const [busyChip, setBusyChip] = useState<string | null>(null);

  const presets = useMemo(() => {
    return PRESET_NAMES.map((name) => {
      const match = services?.find(
        (s) => s.name.toLowerCase().trim() === name.toLowerCase().trim(),
      );
      return { name, price: match?.price ?? null, serviceId: match?.id ?? null };
    });
  }, [services]);

  async function launch(name: string, price: number, serviceId: string | null) {
    setBusyChip(name);
    navigator.vibrate?.(10);
    const now = new Date();
    try {
      await createAppointment({
        data: {
          serviceId,
          serviceName: name,
          price,
          startedAt: now.toISOString(),
          endedAt: now.toISOString(),
          durationSeconds: 0,
          note: null,
        },
      });
      toast.success(`${name} lançado`);
    } catch (err) {
      toast.error(logAndExtract(err, "Erro ao lançar atendimento"));
    } finally {
      setBusyChip(null);
    }
  }

  function handlePresetClick(p: { name: string; price: number | null; serviceId: string | null }) {
    if (p.price == null) {
      toast.message(
        `Cadastre "${p.name}" no catálogo para usar o lançamento rápido com 1 toque`,
      );
      return;
    }
    launch(p.name, p.price, p.serviceId);
  }

  function handleCustomLaunch() {
    const price = parseFloat(customPriceStr.replace(/\D/g, "") || "0") / 100;
    if (!price) {
      toast.error("Informe um valor para lançar");
      return;
    }
    launch("Atendimento Avulso", price, null);
    setCustomPriceStr("");
  }

  const formatInputCurrency = (val: string) => {
    const num = parseInt(val.replace(/\D/g, "") || "0", 10);
    return (num / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="bg-[#1C1C1E] rounded-3xl p-5 shadow-lg shadow-black/40 space-y-4"
    >
      <div className="flex items-center gap-2">
        <Zap size={14} className="text-amber-500" />
        <h3 className="text-xs uppercase font-semibold tracking-wider text-gray-400">
          Lançamento Rápido
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {presets.map((p) => {
          const disabled = isPending && busyChip === p.name;
          return (
            <button
              key={p.name}
              onClick={() => handlePresetClick(p)}
              disabled={disabled}
              className="flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl bg-[#2C2C2E] active:scale-95 transition disabled:opacity-50"
            >
              <span className="text-[11px] font-bold text-white text-center leading-tight">
                {p.name}
              </span>
              <span className="text-[10px] font-mono text-amber-500 tabular-nums">
                {p.price != null ? formatCurrency(p.price) : "definir"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-2.5 text-gray-500 text-sm font-medium">
            R$
          </span>
          <input
            type="tel"
            inputMode="numeric"
            value={customPriceStr ? formatInputCurrency(customPriceStr) : ""}
            onChange={(e) => setCustomPriceStr(e.target.value)}
            placeholder="0,00"
            className="w-full bg-[#2C2C2E] rounded-2xl pl-10 pr-3 py-2.5 text-white font-mono text-sm outline-none focus:ring-1 focus:ring-amber-500 tabular-nums placeholder:text-gray-600"
          />
        </div>
        <button
          onClick={handleCustomLaunch}
          disabled={isPending}
          className="px-4 py-2.5 rounded-2xl bg-amber-500 text-black font-bold text-sm flex items-center gap-1 active:scale-95 transition disabled:opacity-50"
        >
          <Plus size={16} strokeWidth={3} />
          Lançar
        </button>
      </div>
    </motion.div>
  );
}
