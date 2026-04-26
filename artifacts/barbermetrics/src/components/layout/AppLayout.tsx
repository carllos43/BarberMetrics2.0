import { useAppStore } from "@/store";
import { Header } from "./Header";
import { TabBar } from "./TabBar";
import { Home } from "@/pages/Home";
import { Timer } from "@/pages/Timer";
import { Appointments } from "@/pages/Appointments";
import { Analysis } from "@/pages/Analysis";
import { Reports } from "@/pages/Reports";
import { motion, AnimatePresence } from "framer-motion";

export function AppLayout() {
  const { currentTab } = useAppStore();

  return (
    <div className="min-h-[100dvh] w-full bg-black text-white relative flex flex-col overflow-hidden">
      {/* Background ambient gradient for desktop */}
      <div className="fixed inset-0 pointer-events-none hidden md:block bg-gradient-to-br from-[#1C1C1E] to-black" />

      <div className="flex-1 w-full max-w-md mx-auto relative flex flex-col bg-black md:shadow-2xl md:border-x md:border-white/5 overflow-hidden">
        <Header />

        <main className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="absolute inset-0 overflow-y-auto overflow-x-hidden px-4 pt-[calc(env(safe-area-inset-top)+4rem)] pb-[calc(env(safe-area-inset-bottom)+6rem)]"
            >
              {currentTab === "home" && <Home />}
              {currentTab === "timer" && <Timer />}
              {currentTab === "appointments" && <Appointments />}
              {currentTab === "analysis" && <Analysis />}
              {currentTab === "reports" && <Reports />}
            </motion.div>
          </AnimatePresence>
        </main>

        <TabBar />
      </div>
    </div>
  );
}
