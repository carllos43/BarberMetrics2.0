import { useAppStore } from "@/store";
import { formatDuration } from "@/lib/utils";
import { motion } from "framer-motion";
import { Play, Square, Check } from "lucide-react";
import { useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useState } from "react";
import { useListServices, useCreateAppointment } from "@/lib/data";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function Timer() {
  const { 
    timerDuration, 
    timerRunning, 
    startTimer, 
    stopTimer, 
    tickTimer, 
    resetTimer,
    timerStartedAt 
  } = useAppStore();
  
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    let interval: number;
    if (timerRunning) {
      interval = window.setInterval(() => {
        tickTimer();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, tickTimer]);

  const toggleTimer = () => {
    navigator.vibrate?.(10);
    if (timerRunning) {
      stopTimer();
    } else {
      startTimer();
    }
  };

  const handleFinish = () => {
    stopTimer();
    setSheetOpen(true);
  };

  let colorClass = "text-gray-400";
  if (timerDuration > 0) {
    if (timerDuration < 15 * 60) colorClass = "text-[#34C759]"; // Green
    else if (timerDuration < 30 * 60) colorClass = "text-amber-500"; // Amber
    else colorClass = "text-[#FF3B30]"; // Red
  }

  return (
    <div className="flex flex-col items-center justify-center h-full pb-20">
      <div className="flex-1 flex items-center justify-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-8xl font-black tabular-nums tracking-tighter ${colorClass}`}
        >
          {formatDuration(timerDuration)}
        </motion.div>
      </div>

      <div className="flex flex-col items-center gap-8 w-full max-w-xs">
        <div className="flex items-center justify-center gap-6">
          {(timerDuration > 0 && !timerRunning) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={resetTimer}
              className="w-16 h-16 rounded-full bg-[#2C2C2E] flex items-center justify-center text-gray-400"
            >
              <Square size={24} fill="currentColor" />
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTimer}
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg shadow-black/40 ${
              timerRunning ? "bg-[#2C2C2E] text-amber-500" : "bg-amber-500 text-black"
            }`}
          >
            {timerRunning ? <Square size={36} fill="currentColor" /> : <Play size={40} className="ml-2" fill="currentColor" />}
          </motion.button>

          {(timerDuration > 0 && !timerRunning) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleFinish}
              className="w-16 h-16 rounded-full bg-[#34C759] flex items-center justify-center text-black shadow-lg"
            >
              <Check size={32} strokeWidth={3} />
            </motion.button>
          )}
        </div>
        
        {timerDuration > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleFinish}
            className="w-full py-4 rounded-full bg-amber-500 text-black font-bold text-lg shadow-lg shadow-amber-500/20"
          >
            Finalizar Atendimento
          </motion.button>
        )}
      </div>

      <SaveAppointmentSheet 
        open={sheetOpen} 
        onOpenChange={setSheetOpen} 
        durationSeconds={timerDuration} 
        startedAt={timerStartedAt || Date.now()}
      />
    </div>
  );
}

function SaveAppointmentSheet({ open, onOpenChange, durationSeconds, startedAt }: { open: boolean, onOpenChange: (open: boolean) => void, durationSeconds: number, startedAt: number }) {
  const { data: services } = useListServices();
  const { mutateAsync: createAppointment } = useCreateAppointment();
  const { resetTimer, setCurrentTab } = useAppStore();
  const queryClient = useQueryClient();

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [priceStr, setPriceStr] = useState("");
  const [note, setNote] = useState("");
  const [customName, setCustomName] = useState("");

  const handleSave = async () => {
    if (!priceStr) return;
    const price = parseFloat(priceStr.replace(/\D/g, "")) / 100;
    
    let serviceName = customName;
    if (selectedServiceId && selectedServiceId !== "custom") {
      const svc = services?.find(s => s.id === selectedServiceId);
      if (svc) serviceName = svc.name;
    }
    
    if (!serviceName) serviceName = "Atendimento Avulso";

    try {
      navigator.vibrate?.(10);
      await createAppointment({
        data: {
          serviceId: selectedServiceId === "custom" ? null : selectedServiceId,
          serviceName,
          price,
          startedAt: new Date(startedAt).toISOString(),
          endedAt: new Date().toISOString(),
          durationSeconds,
          note: note || null,
        }
      });
      
      toast.success("Atendimento salvo");
      
      resetTimer();
      onOpenChange(false);
      setCurrentTab("home");
    } catch (err) {
      toast.error("Erro ao salvar");
    }
  };

  const handleServiceSelect = (id: string) => {
    setSelectedServiceId(id);
    if (id !== "custom") {
      const svc = services?.find(s => s.id === id);
      if (svc) {
        setPriceStr((svc.price * 100).toString());
      }
    } else {
      setPriceStr("");
    }
  };

  const formatInputCurrency = (val: string) => {
    const num = parseInt(val.replace(/\D/g, "") || "0", 10);
    return (num / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <div className="space-y-6 pt-2">
        <h2 className="text-xl font-bold text-center text-white">Salvar Atendimento</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase font-semibold text-gray-500 mb-2 block">Serviço</label>
            <div className="flex flex-wrap gap-2">
              {services?.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleServiceSelect(s.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedServiceId === s.id ? "bg-amber-500 text-black" : "bg-[#2C2C2E] text-white"
                  }`}
                >
                  {s.name}
                </button>
              ))}
              <button
                onClick={() => handleServiceSelect("custom")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedServiceId === "custom" ? "bg-amber-500 text-black" : "bg-[#2C2C2E] text-white"
                }`}
              >
                Avulso
              </button>
            </div>
          </div>

          {selectedServiceId === "custom" && (
            <div>
              <label className="text-xs uppercase font-semibold text-gray-500 mb-1 block">Nome do Serviço</label>
              <input 
                type="text" 
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                placeholder="Ex: Barba e Sobrancelha"
                className="w-full bg-[#2C2C2E] rounded-2xl px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          )}

          <div>
            <label className="text-xs uppercase font-semibold text-gray-500 mb-1 block">Valor (R$)</label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-400 font-medium">R$</span>
              <input 
                type="tel"
                value={formatInputCurrency(priceStr)}
                onChange={e => setPriceStr(e.target.value)}
                className="w-full bg-[#2C2C2E] rounded-2xl pl-12 pr-4 py-3 text-white font-mono text-lg outline-none focus:ring-1 focus:ring-amber-500 tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase font-semibold text-gray-500 mb-1 block">Observação (Opcional)</label>
            <textarea 
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-[#2C2C2E] rounded-2xl px-4 py-3 text-white placeholder:text-gray-500 outline-none focus:ring-1 focus:ring-amber-500 min-h-[80px]"
              placeholder="Alguma nota sobre o cliente..."
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-4 rounded-2xl bg-amber-500 text-black font-bold text-lg"
        >
          Salvar atendimento
        </button>
      </div>
    </Modal>
  );
}
