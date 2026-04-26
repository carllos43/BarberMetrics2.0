import { useListServices, useCreateService, useUpdateService, useDeleteService } from "@/lib/data";
import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Plus, ChevronLeft, Trash } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { logAndExtract } from "@/lib/errors";

export function ServiceCatalogSheet({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { data: services, isLoading } = useListServices();
  const [editingService, setEditingService] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <Modal open={open} onOpenChange={onOpenChange} className="h-[96vh] bg-black">
      <div className="flex flex-col h-full bg-black">
        <div className="flex items-center justify-between mb-6 pt-2 pl-2 pr-4">
          <button onClick={() => onOpenChange(false)} className="text-amber-500 flex items-center">
            <ChevronLeft size={24} />
            <span className="text-lg">Voltar</span>
          </button>
          <h2 className="text-xl font-bold text-white">Serviços</h2>
          <div className="w-20" />
        </div>

        <div className="flex-1 overflow-y-auto pb-24 px-4 space-y-3">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-[#1C1C1E] rounded-2xl" />)}
            </div>
          ) : services?.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              Nenhum serviço cadastrado.
            </div>
          ) : (
            services?.map((service) => (
              <ServiceRow 
                key={service.id} 
                service={service} 
                onEdit={() => setEditingService(service)} 
              />
            ))
          )}
        </div>

        <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsCreating(true)}
            className="bg-amber-500 text-black px-6 py-4 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 pointer-events-auto"
          >
            <Plus size={20} strokeWidth={3} />
            Novo Serviço
          </motion.button>
        </div>
      </div>

      <ServiceFormSheet 
        open={isCreating || !!editingService} 
        onOpenChange={(o) => {
          if (!o) {
            setIsCreating(false);
            setEditingService(null);
          }
        }}
        service={editingService}
      />
    </Modal>
  );
}

function ServiceRow({ service, onEdit }: { service: any, onEdit: () => void }) {
  const { mutateAsync: deleteService } = useDeleteService();
  const [showActions, setShowActions] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.vibrate?.([10, 30, 10]);
      await deleteService({ id: service.id });
      toast.success("Serviço excluído");
    } catch (err) {
      toast.error(logAndExtract(err, "Erro ao excluir serviço"));
    }
  };

  return (
    <motion.div className="relative overflow-hidden rounded-2xl bg-[#2C2C2E]">
      <motion.div
        drag="x"
        dragConstraints={{ left: -70, right: 0 }}
        onDragEnd={(e, info) => {
          if (info.offset.x < -35) setShowActions(true);
          else setShowActions(false);
        }}
        animate={{ x: showActions ? -70 : 0 }}
        className="bg-[#2C2C2E] p-4 flex items-center justify-between relative z-10"
        onClick={onEdit}
      >
        <div className="font-bold text-white">{service.name}</div>
        <div className="text-amber-500 font-mono font-bold tabular-nums">
          {formatCurrency(service.price)}
        </div>
      </motion.div>

      <div className="absolute inset-0 right-0 flex items-center justify-end z-0">
        <button 
          onClick={handleDelete}
          className="w-[70px] h-full bg-[#FF3B30] flex items-center justify-center text-white"
        >
          <Trash size={20} />
        </button>
      </div>
    </motion.div>
  );
}

function ServiceFormSheet({ open, onOpenChange, service }: { open: boolean, onOpenChange: (open: boolean) => void, service?: any }) {
  const { mutateAsync: createService } = useCreateService();
  const { mutateAsync: updateService } = useUpdateService();

  const [name, setName] = useState("");
  const [priceStr, setPriceStr] = useState("");

  // Re-sync form when opening or switching service
  useEffect(() => {
    if (!open) return;
    if (service) {
      setName(service.name);
      setPriceStr((service.price * 100).toString());
    } else {
      setName("");
      setPriceStr("");
    }
  }, [open, service]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Informe o nome do serviço");
      return;
    }
    const price = parseFloat(priceStr.replace(/\D/g, "") || "0") / 100;
    if (!price) {
      toast.error("Informe um valor válido");
      return;
    }

    try {
      if (service) {
        await updateService({ id: service.id, data: { name: name.trim(), price } });
        toast.success("Serviço atualizado");
      } else {
        await createService({ data: { name: name.trim(), price } });
        toast.success("Serviço criado");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(logAndExtract(err, "Erro ao salvar serviço"));
    }
  };

  const formatInputCurrency = (val: string) => {
    const num = parseInt(val.replace(/\D/g, "") || "0", 10);
    return (num / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <div className="space-y-6 pt-2 pb-6">
        <h2 className="text-xl font-bold text-center text-white">
          {service ? "Editar Serviço" : "Novo Serviço"}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase font-semibold text-gray-500 mb-1 block">Nome do Serviço</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#2C2C2E] rounded-2xl px-4 py-3 text-white outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

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
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-2xl bg-amber-500 text-black font-bold text-lg"
          >
            Salvar
          </button>
          <button
            onClick={() => onOpenChange(false)}
            className="w-full py-3 rounded-2xl bg-[#3a3a3c] text-white font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}
