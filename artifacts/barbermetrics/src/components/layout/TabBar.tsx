import { useAppStore } from "@/store";
import { Home, Timer, Calendar, BarChart2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function TabBar() {
  const { currentTab, setCurrentTab } = useAppStore();

  const tabs = [
    { id: "home", icon: Home, label: "Início", isCenter: false },
    { id: "timer", icon: Timer, label: "Cronômetro", isCenter: true },
    { id: "appointments", icon: Calendar, label: "Atendimentos", isCenter: false },
    { id: "analysis", icon: BarChart2, label: "Análise", isCenter: false },
    { id: "reports", icon: FileText, label: "Relatórios", isCenter: false },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="backdrop-blur-xl bg-black/80 border-t border-white/10 flex justify-around items-center h-16 px-2 max-w-md mx-auto relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          if (tab.isCenter) {
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCurrentTab(tab.id as any)}
                className="relative -top-5 flex flex-col items-center justify-center"
              >
                <div className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-black/40",
                  isActive ? "bg-amber-500 text-black" : "bg-[#2C2C2E] text-amber-500"
                )}>
                  <Icon size={28} strokeWidth={isActive ? 2.5 : 2} />
                </div>
              </motion.button>
            );
          }

          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentTab(tab.id as any)}
              className="flex flex-col items-center justify-center w-16 h-full gap-1"
            >
              <Icon 
                size={22} 
                className={isActive ? "text-amber-500" : "text-gray-500"} 
              />
              <span className={cn(
                "text-[10px] font-medium tracking-wide",
                isActive ? "text-amber-500" : "text-gray-500"
              )}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
