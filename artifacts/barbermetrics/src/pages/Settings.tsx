import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useGetSettings, useUpdateSettings } from "@/lib/data";
import { useState, useEffect } from "react";
import { ChevronRight, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ServiceCatalogSheet } from "./ServiceCatalog";
import { useAuth } from "@/lib/auth";

export function SettingsSheet({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { data: settings } = useGetSettings();
  const { mutateAsync: updateSettings } = useUpdateSettings();
  const queryClient = useQueryClient();
  const { signOut, user } = useAuth();

  const [name, setName] = useState("");
  const [goalStr, setGoalStr] = useState("");
  const [catalogOpen, setCatalogOpen] = useState(false);

  useEffect(() => {
    if (settings) {
      setName(settings.barbershopName);
      setGoalStr((settings.dailyGoal * 100).toString());
    }
  }, [settings, open]);

  const handleSave = async () => {
    try {
      const goal = parseInt(goalStr.replace(/\D/g, "") || "0", 10) / 100;
      await updateSettings({
        data: {
          barbershopName: name,
          dailyGoal: goal
        }
      });
      toast.success("Ajustes salvos");
      onOpenChange(false);
    } catch (e) {
      toast.error("Erro ao salvar");
    }
  };

  const formatInputCurrency = (val: string) => {
    const num = parseInt(val.replace(/\D/g, "") || "0", 10);
    return (num / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <>
      <BottomSheet open={open} onOpenChange={onOpenChange} className="h-[90vh]">
        <div className="flex flex-col h-full">
          <h2 className="text-2xl font-bold text-white mb-6 pl-2">Ajustes</h2>

          <div className="flex-1 space-y-8 pb-10">
            {/* Perfil Group */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-semibold text-gray-500 ml-4 tracking-wider">Perfil</p>
              <div className="bg-[#2C2C2E] rounded-3xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5">
                  <label className="text-xs text-gray-400 block mb-1">Nome da Barbearia</label>
                  <input 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-transparent text-white font-medium outline-none"
                  />
                </div>
                <div className="px-4 py-3">
                  <label className="text-xs text-gray-400 block mb-1">Meta Diária (R$)</label>
                  <div className="flex items-center">
                    <span className="text-gray-400 mr-2">R$</span>
                    <input 
                      type="tel"
                      value={formatInputCurrency(goalStr)}
                      onChange={e => setGoalStr(e.target.value)}
                      className="w-full bg-transparent text-white font-medium outline-none tabular-nums"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Serviços Group */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-semibold text-gray-500 ml-4 tracking-wider">Serviços</p>
              <div className="bg-[#2C2C2E] rounded-3xl overflow-hidden">
                <button 
                  onClick={() => setCatalogOpen(true)}
                  className="w-full px-4 py-4 flex items-center justify-between text-left"
                >
                  <span className="text-white font-medium">Catálogo de Serviços</span>
                  <ChevronRight size={18} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Aparência */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-semibold text-gray-500 ml-4 tracking-wider">Aparência</p>
              <div className="bg-[#2C2C2E] rounded-3xl overflow-hidden">
                <div className="px-4 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Tema Escuro</p>
                    <p className="text-xs text-gray-500">Sempre escuro (Padrão)</p>
                  </div>
                  <div className="w-12 h-7 bg-[#34C759] rounded-full relative">
                    <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full shadow" />
                  </div>
                </div>
              </div>
            </div>

            {/* Conta */}
            <div className="space-y-2 pt-4">
              {user?.email && (
                <p className="text-xs text-gray-500 text-center mb-3">
                  Conectado como <span className="text-gray-300">{user.email}</span>
                </p>
              )}
              <button
                onClick={async () => {
                  await signOut();
                  onOpenChange(false);
                  toast.success("Sessão encerrada");
                }}
                className="w-full bg-[#2C2C2E] px-4 py-4 rounded-3xl flex items-center justify-center gap-2 text-[#FF3B30] font-medium"
              >
                <LogOut size={18} />
                Sair da conta
              </button>
            </div>
          </div>

          <div className="sticky bottom-0 pt-4 pb-8 bg-[#1C1C1E] border-t border-white/5">
            <button
              onClick={handleSave}
              className="w-full py-4 rounded-full bg-amber-500 text-black font-bold text-lg"
            >
              Salvar Ajustes
            </button>
          </div>
        </div>
      </BottomSheet>

      <ServiceCatalogSheet open={catalogOpen} onOpenChange={setCatalogOpen} />
    </>
  );
}
