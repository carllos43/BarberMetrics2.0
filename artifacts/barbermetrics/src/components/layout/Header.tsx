import { useAppStore } from "@/store";
import { Settings as SettingsIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { SettingsSheet } from "@/pages/Settings"; // We will create this

const tabTitles: Record<string, string> = {
  home: "Hoje",
  timer: "Cronômetro",
  appointments: "Atendimentos",
  analysis: "Desempenho",
  reports: "Relatórios",
  settings: "Ajustes"
};

export function Header() {
  const { currentTab, setCurrentTab } = useAppStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 pt-[env(safe-area-inset-top)]">
        <div className="backdrop-blur-xl bg-black/80 border-b border-white/10 h-14 flex items-center justify-between px-4 max-w-md mx-auto">
          <div className="w-10" /> {/* Spacer */}
          <h1 className="text-lg font-bold tracking-tight text-white">
            {tabTitles[currentTab]}
          </h1>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSettingsOpen(true)}
            className="w-10 h-10 flex items-center justify-end"
          >
            <SettingsIcon className="text-amber-500" size={24} />
          </motion.button>
        </div>
      </header>

      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
