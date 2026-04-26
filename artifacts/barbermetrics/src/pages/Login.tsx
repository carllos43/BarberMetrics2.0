import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha email e senha");
      return;
    }
    setLoading(true);
    try {
      const { error } = mode === "signin"
        ? await signIn(email, password)
        : await signUp(email, password);
      if (error) {
        toast.error(error);
      } else if (mode === "signup") {
        toast.success("Conta criada — confira seu email se a confirmação estiver ativada.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-black text-white flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex w-16 h-16 rounded-3xl bg-amber-500 items-center justify-center text-black font-black text-2xl tracking-tight shadow-lg shadow-amber-500/20">
            B
          </div>
          <h1 className="text-2xl font-bold">BarberMetrics 2.0</h1>
          <p className="text-sm text-gray-400">
            {mode === "signin" ? "Entre na sua conta" : "Crie sua conta"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-[#1C1C1E] rounded-2xl px-4 py-4 text-white placeholder:text-gray-500 outline-none focus:ring-1 focus:ring-amber-500"
          />
          <input
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full bg-[#1C1C1E] rounded-2xl px-4 py-4 text-white placeholder:text-gray-500 outline-none focus:ring-1 focus:ring-amber-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-amber-500 text-black font-bold text-lg disabled:opacity-50"
          >
            {loading ? "..." : mode === "signin" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-sm text-gray-400 hover:text-white"
        >
          {mode === "signin"
            ? "Não tem conta? Criar agora"
            : "Já tem conta? Entrar"}
        </button>
      </motion.div>
    </div>
  );
}
