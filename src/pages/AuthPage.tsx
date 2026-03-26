import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { motion } from "framer-motion";
import { toast } from "sonner";
import { DollarSign } from "lucide-react";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isLogin) {
      const { error } = await login(email, password);
      if (error) toast.error(error);
      else { toast.success("Login realizado com sucesso!"); navigate("/dashboard"); }
    } else {
      const { error } = await register(name, email, password);
      if (error) toast.error(error);
      else { toast.success("Conta criada com sucesso!"); navigate("/"); }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-dark p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <DollarSign className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground">FinControl</h1>
        </div>

        <Card className="glass-card border-primary-deep/30">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{isLogin ? "Entrar" : "Criar Conta"}</CardTitle>
            <CardDescription>
              {isLogin ? "Acesse sua conta para gerenciar suas finanças" : "Crie sua conta e comece a organizar suas finanças"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <Button type="submit" disabled={loading} className="w-full gradient-primary hover:opacity-90 transition-opacity">
                {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar Conta"}
              </Button>
            </form>



            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:underline"
              >
                {isLogin ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AuthPage;
