import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import {
  DollarSign, BarChart3, CreditCard, Tags, History, Shield, Moon,
  Check, Star, ArrowRight, Crown, Sparkles, ChevronDown,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

const features = [
  { icon: BarChart3, title: "Dashboard Completo", desc: "Visão mensal com gráficos de despesas por categoria e evolução semestral." },
  { icon: Tags, title: "Categorias Inteligentes", desc: "Organize gastos com ícones, cores e limites por categoria." },
  { icon: CreditCard, title: "Parcelamentos com Projeção", desc: "Acompanhe parcelas futuras com projeção automática mês a mês." },
  { icon: History, title: "Histórico com Filtros", desc: "Filtre despesas por data, categoria e período personalizado." },
  { icon: Moon, title: "Dark Mode", desc: "Interface adaptável para uso confortável em qualquer ambiente." },
  { icon: Shield, title: "Segurança Total", desc: "Dados protegidos com criptografia e autenticação segura." },
];

const benefits = [
  { icon: "💰", title: "Controle Total", desc: "Cada real, cada categoria, cada mês. Tudo visível em um único dashboard." },
  { icon: "📊", title: "Parcelamentos Claros", desc: "Saiba exatamente quanto vai sair do seu bolso nos próximos meses." },
  { icon: "🎯", title: "Limites Inteligentes", desc: "Defina tetos de gastos por categoria e veja quando está chegando perto." },
  { icon: "🔍", title: "Histórico Completo", desc: "Filtre, busque e analise todas as suas despesas em segundos." },
];

const testimonials = [
  { name: "Maria S.", text: "Finalmente consegui visualizar para onde meu dinheiro estava indo. Em 2 meses economizei R$ 800!", avatar: "MS" },
  { name: "Carlos R.", text: "O controle de parcelamentos é incrível. Consigo planejar meus gastos com muito mais confiança.", avatar: "CR" },
  { name: "Ana L.", text: "Interface linda e super fácil de usar. Melhor app de finanças que já usei.", avatar: "AL" },
];

const freePlan = [
  { text: "Dashboard mensal completo", included: true },
  { text: "Transações ilimitadas", included: true },
  { text: "Até 5 categorias", included: true },
  { text: "Até 3 parcelamentos ativos", included: true },
  { text: "Gráfico pizza (mês atual)", included: true },
  { text: "Dark mode", included: true },
  { text: "Gráficos avançados (6 meses)", included: false },
  { text: "Histórico completo", included: false },
  { text: "Exportação CSV/PDF", included: false },
  { text: "Metas financeiras", included: false },
];

const premiumPlan = [
  { text: "Tudo do plano gratuito", included: true },
  { text: "Categorias ilimitadas", included: true },
  { text: "Parcelamentos ilimitados", included: true },
  { text: "Histórico completo (todos os meses)", included: true },
  { text: "Gráfico barras + tendências", included: true },
  { text: "Exportação CSV e PDF", included: true },
  { text: "Metas financeiras", included: true },
  { text: "Suporte prioritário", included: true },
];

const faqs = [
  { q: "O app é realmente gratuito?", a: "Sim! O plano gratuito é completo para gestão financeira básica. Você pode registrar transações ilimitadas, criar até 5 categorias e acompanhar seus gastos sem pagar nada." },
  { q: "Meus dados financeiros estão seguros?", a: "Absolutamente. Utilizamos criptografia de ponta a ponta e autenticação segura com Supabase. Seus dados nunca são compartilhados com terceiros." },
  { q: "Posso cancelar o Premium a qualquer momento?", a: "Sim, sem burocracia. Você pode cancelar quando quiser e continua usando até o fim do período pago. Seus dados nunca são deletados." },
  { q: "Funciona no meu celular/navegador?", a: "Sim! O FinControl é um app web responsivo que funciona perfeitamente em qualquer dispositivo — celular, tablet ou computador." },
  { q: "Preciso conectar minha conta bancária?", a: "Não. O FinControl funciona com registro manual de transações, garantindo total controle e privacidade sobre seus dados." },
  { q: "O que acontece se eu cancelar o Premium?", a: "Seus dados permanecem intactos. Você volta ao plano gratuito com acesso restrito a funcionalidades premium, mas pode continuar usando o básico normalmente." },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">FinControl</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="gradient-primary hover:opacity-90">
                Criar Conta Grátis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              7 dias grátis de Premium para novos usuários
            </div>
          </motion.div>
          <motion.h1
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6"
          >
            Suas finanças sob controle.{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              De verdade.
            </span>
          </motion.h1>
          <motion.p
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            Registre gastos, acompanhe categorias, visualize parcelamentos e tome decisões
            melhores sobre seu dinheiro.
          </motion.p>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth">
              <Button size="lg" className="gradient-primary hover:opacity-90 h-12 px-8 text-base">
                Criar minha conta grátis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
              Ver como funciona
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> Dados protegidos</span>
            <span className="flex items-center gap-1"><Star className="w-4 h-4" /> Gratuito para sempre</span>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Por que o FinControl?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Porque controlar seu dinheiro deveria ser simples, visual e acessível para todos.
            </p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b, i) => (
              <motion.div key={b.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-4">{b.icon}</div>
                    <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
                    <p className="text-sm text-muted-foreground">{b.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Funcionalidades em Destaque</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Ferramentas poderosas para você ter controle total das suas finanças.
            </p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}>
                <Card className="h-full hover:shadow-lg transition-shadow group">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <f.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">O que dizem nossos usuários</h2>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-warning text-warning" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">"{t.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {t.avatar}
                      </div>
                      <span className="font-medium text-sm">{t.name}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Escolha seu plano</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Comece grátis. Evolua quando quiser.
            </p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Free */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
              <Card className="h-full">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-1">Gratuito</h3>
                  <p className="text-muted-foreground text-sm mb-4">Para começar a organizar suas finanças</p>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold">R$ 0</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <Link to="/auth">
                    <Button variant="outline" className="w-full mb-6">Começar Grátis</Button>
                  </Link>
                  <div className="space-y-3">
                    {freePlan.map((f) => (
                      <div key={f.text} className="flex items-center gap-2 text-sm">
                        <Check className={`w-4 h-4 shrink-0 ${f.included ? "text-success" : "text-muted-foreground/30"}`} />
                        <span className={f.included ? "" : "text-muted-foreground/50 line-through"}>{f.text}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Premium */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}>
              <Card className="h-full border-primary border-2 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 gradient-primary py-1.5 text-center text-xs font-bold text-primary-foreground">
                  <Crown className="w-3 h-3 inline mr-1" />
                  MAIS POPULAR
                </div>
                <CardContent className="p-8 pt-12">
                  <h3 className="text-xl font-bold mb-1">Premium</h3>
                  <p className="text-muted-foreground text-sm mb-4">Controle financeiro completo e sem limites</p>
                  <div className="mb-2">
                    <span className="text-4xl font-extrabold">R$ 9,90</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-6">ou R$ 79,90/ano (economize 33%)</p>
                  <Link to="/auth">
                    <Button className="w-full gradient-primary hover:opacity-90 mb-6">
                      <Crown className="w-4 h-4 mr-2" />
                      Experimentar 7 dias grátis
                    </Button>
                  </Link>
                  <div className="space-y-3">
                    {premiumPlan.map((f) => (
                      <div key={f.text} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 shrink-0 text-success" />
                        <span>{f.text}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="max-w-3xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Perguntas Frequentes</h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-lg border px-4">
                  <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Comece a controlar seu dinheiro hoje.
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Gratuito para sempre. Premium quando você quiser.
            </p>
            <Link to="/auth">
              <Button size="lg" className="gradient-primary hover:opacity-90 h-14 px-10 text-lg">
                Criar minha conta grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md gradient-primary flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold">FinControl</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} FinControl. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
