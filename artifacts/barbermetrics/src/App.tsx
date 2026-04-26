import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppLayout />
        <Toaster theme="dark" position="top-center" toastOptions={{
          className: "bg-[#2C2C2E] border border-white/10 text-white rounded-2xl shadow-xl backdrop-blur-xl"
        }} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
