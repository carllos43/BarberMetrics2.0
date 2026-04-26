import { useListAppointments, useDeleteAppointment, useUpdateAppointment, useListServices } from "@/lib/data";
import { useState, useEffect } from "react";
import { format, addDays, subDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Calendar as CalendarIcon, Clock, Trash, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function Appointments() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const { data: appointments, isLoading } = useListAppointments({ date: dateStr });

  // Generate 7 days strip centered around selectedDate
  const stripDates = Array.from({ length: 7 }).map((_, i) => {
    return addDays(subDays(selectedDate, 3), i);
  });

  return (
    <div className="space-y-6">
      {/* Date Strip */}
      <div className="flex items-center gap-2">
        <div className="flex-1 overflow-x-auto hide-scrollbar -mx-4 px-4">
          <div className="flex gap-2 min-w-max">
            {stripDates.map(d => {
              const isSelected = isSameDay(d, selectedDate);
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelectedDate(d)}
                  className={`flex flex-col items-center justify-center w-14 h-16 rounded-2xl transition-colors ${
                    isSelected ? "bg-amber-500 text-black" : "bg-[#1C1C1E] text-white"
                  }`}
                >
                  <span className={`text-[10px] font-semibold uppercase ${isSelected ? "text-black/70" : "text-gray-500"}`}>
                    {format(d, "EEE", { locale: ptBR })}
                  </span>
                  <span className="text-lg font-bold tabular-nums">
                    {format(d, "dd")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <button 
          onClick={() => setCalendarOpen(true)}
          className="w-12 h-12 rounded-full bg-[#1C1C1E] flex items-center justify-center flex-shrink-0 text-amber-500"
        >
          <CalendarIcon size={20} />
        </button>
      </div>

      <div className="space-y-3 pb-10">
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 bg-[#1C1C1E] rounded-2xl animate-pulse" />)}
          </div>
        ) : appointments?.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p>Nenhum atendimento neste dia.</p>
          </div>
        ) : (
          appointments?.map((app, i) => (
            <AppointmentCard key={app.id} appointment={app} index={i} />
          ))
        )}
      </div>

      {/* Calendar Bottom Sheet */}
      <BottomSheet open={calendarOpen} onOpenChange={setCalendarOpen}>
        <div className="pb-8 pt-4">
          <MonthPicker 
            selectedDate={selectedDate} 
            onChange={(d) => {
              setSelectedDate(d);
              setCalendarOpen(false);
            }} 
          />
        </div>
      </BottomSheet>
    </div>
  );
}

function MonthPicker({ selectedDate, onChange }: { selectedDate: Date, onChange: (d: Date) => void }) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));
  
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const nextMonth = () => setCurrentMonth(addDays(endOfMonth(currentMonth), 1));
  const prevMonth = () => setCurrentMonth(subDays(startOfMonth(currentMonth), 1));

  // padding for day 1
  const startDay = startOfMonth(currentMonth).getDay();
  const padding = Array.from({ length: startDay }).map((_, i) => <div key={`pad-${i}`} className="h-10" />);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="w-10 h-10 rounded-full bg-[#2C2C2E] flex items-center justify-center text-white"><ChevronLeft size={20} /></button>
          <button onClick={nextMonth} className="w-10 h-10 rounded-full bg-[#2C2C2E] flex items-center justify-center text-white"><ChevronRight size={20} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-500 uppercase">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {padding}
        {days.map(d => {
          const isSelected = isSameDay(d, selectedDate);
          const isTodayDate = isToday(d);
          return (
            <button
              key={d.toISOString()}
              onClick={() => onChange(d)}
              className={`h-10 rounded-full flex items-center justify-center text-sm tabular-nums transition-colors ${
                isSelected ? "bg-amber-500 text-black font-bold" : 
                isTodayDate ? "text-amber-500 font-bold" : "text-white"
              }`}
            >
              {format(d, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AppointmentCard({ appointment, index }: { appointment: any, index: number }) {
  const queryClient = useQueryClient();
  const { mutateAsync: deleteApp } = useDeleteAppointment();
  const [showActions, setShowActions] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const handleDelete = async () => {
    try {
      navigator.vibrate?.([10, 30, 10]);
      await deleteApp({ id: appointment.id });
      toast.success("Atendimento excluído");
      setDeleteConfirmOpen(false);
    } catch (e) {
      toast.error("Erro ao excluir");
    }
  };

  const start = new Date(appointment.startedAt);
  const end = appointment.endedAt ? new Date(appointment.endedAt) : start;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className="relative overflow-hidden rounded-2xl bg-[#1C1C1E]"
      >
        <motion.div 
          drag="x"
          dragConstraints={{ left: -140, right: 0 }}
          onDragEnd={(e, info) => {
            if (info.offset.x < -50) setShowActions(true);
            else setShowActions(false);
          }}
          animate={{ x: showActions ? -140 : 0 }}
          className="bg-[#1C1C1E] p-4 flex items-center justify-between relative z-10"
        >
          <div className="flex flex-col">
            <div className="text-xs text-gray-400 flex items-center gap-1 font-mono tabular-nums">
              <Clock size={12} />
              {format(start, "HH:mm")} &rarr; {format(end, "HH:mm")}
              <span className="ml-1 text-gray-600">({Math.round((appointment.durationSeconds || 0)/60)}m)</span>
            </div>
            <div className="font-bold text-white mt-1">{appointment.serviceName}</div>
          </div>
          <div className="text-amber-500 font-mono font-bold tabular-nums text-lg">
            {formatCurrency(appointment.price)}
          </div>
        </motion.div>

        {/* Actions Background */}
        <div className="absolute inset-0 right-0 flex items-center justify-end z-0">
          <button 
            onClick={() => { setShowActions(false); setEditOpen(true); }}
            className="w-[70px] h-full bg-amber-500 flex items-center justify-center text-black"
          >
            <Edit size={20} />
          </button>
          <button 
            onClick={() => { setShowActions(false); setDeleteConfirmOpen(true); }}
            className="w-[70px] h-full bg-[#FF3B30] flex items-center justify-center text-white"
          >
            <Trash size={20} />
          </button>
        </div>
      </motion.div>

      <BottomSheet open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <div className="py-6 space-y-6 text-center">
          <h3 className="text-xl font-bold text-white">Excluir Atendimento?</h3>
          <p className="text-gray-400">Esta ação não pode ser desfeita e afetará as métricas do dia.</p>
          <div className="space-y-3">
            <button 
              onClick={handleDelete}
              className="w-full py-4 rounded-2xl bg-[#FF3B30] text-white font-bold text-lg"
            >
              Excluir
            </button>
            <button 
              onClick={() => setDeleteConfirmOpen(false)}
              className="w-full py-4 rounded-2xl bg-[#2C2C2E] text-white font-bold text-lg"
            >
              Cancelar
            </button>
          </div>
        </div>
      </BottomSheet>

      <EditAppointmentSheet appointment={appointment} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}

function EditAppointmentSheet({ appointment, open, onOpenChange }: { appointment: any, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { data: services } = useListServices();
  const { mutateAsync: updateApp } = useUpdateAppointment();
  const queryClient = useQueryClient();

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(appointment.serviceId || "custom");
  const [customName, setCustomName] = useState(appointment.serviceName);
  const [priceStr, setPriceStr] = useState((appointment.price * 100).toString());
  const [note, setNote] = useState(appointment.note || "");

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
      await updateApp({
        id: appointment.id,
        data: {
          serviceId: selectedServiceId === "custom" ? null : selectedServiceId,
          serviceName,
          price,
          note: note || null,
        }
      });
      
      toast.success("Atendimento atualizado");
      onOpenChange(false);
    } catch (err) {
      toast.error("Erro ao atualizar");
    }
  };

  const handleServiceSelect = (id: string) => {
    setSelectedServiceId(id);
    if (id !== "custom") {
      const svc = services?.find(s => s.id === id);
      if (svc) {
        setPriceStr((svc.price * 100).toString());
        setCustomName(svc.name);
      }
    } else {
      setCustomName("");
    }
  };

  const formatInputCurrency = (val: string) => {
    const num = parseInt(val.replace(/\D/g, "") || "0", 10);
    return (num / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <div className="space-y-6 pt-2 pb-6">
        <h2 className="text-xl font-bold text-center text-white">Editar Atendimento</h2>
        
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
          Salvar Alterações
        </button>
      </div>
    </BottomSheet>
  );
}
