-- Investment wallets table
CREATE TABLE public.investment_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'general',
  color text NOT NULL DEFAULT '#10b981',
  icon text NOT NULL DEFAULT '💰',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.investment_wallets TO authenticated;
GRANT ALL ON public.investment_wallets TO service_role;

ALTER TABLE public.investment_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own wallets select" ON public.investment_wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users manage own wallets insert" ON public.investment_wallets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own wallets update" ON public.investment_wallets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own wallets delete" ON public.investment_wallets FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_investment_wallets_updated_at
BEFORE UPDATE ON public.investment_wallets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link transactions to a wallet (contribution = expense, withdrawal = income)
ALTER TABLE public.transactions
  ADD COLUMN investment_wallet_id uuid REFERENCES public.investment_wallets(id) ON DELETE SET NULL;

CREATE INDEX idx_transactions_investment_wallet_id ON public.transactions(investment_wallet_id);
