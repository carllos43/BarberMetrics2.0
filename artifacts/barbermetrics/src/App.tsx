import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Login } from "@/pages/Login";

const queryClient = new QueryClient();

function Gate() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-[100dvh] w-full bg-black text-white flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }
  return session ? <AppLayout /> : <Login />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Gate />
          <Toaster
            theme="dark"
            position="top-center"
            toastOptions={{
              className:
                "bg-[#2C2C2E] border border-white/10 text-white rounded-2xl shadow-xl backdrop-blur-xl",
            }}
          />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
