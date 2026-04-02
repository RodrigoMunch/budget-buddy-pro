import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user is admin — admins always have premium
    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    
    const isAdmin = roles?.some((r: any) => r.role === "admin") || false;
    if (isAdmin) {
      logStep("User is admin, granting premium");
      // Update profile to premium
      await supabaseClient
        .from("profiles")
        .update({ plan: "premium", plan_expires_at: null })
        .eq("user_id", user.id);
      
      return new Response(JSON.stringify({
        subscribed: true,
        product_id: "admin",
        subscription_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found, setting free plan");
      // Check if trial period is still active
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("plan, plan_expires_at, trial_used")
        .eq("user_id", user.id)
        .single();

      if (profile?.plan === "premium" && profile?.plan_expires_at) {
        const expiresAt = new Date(profile.plan_expires_at);
        if (expiresAt > new Date()) {
          logStep("Trial still active", { expiresAt: profile.plan_expires_at });
          return new Response(JSON.stringify({
            subscribed: true,
            product_id: "trial",
            subscription_end: profile.plan_expires_at,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }

      // Trial expired or no trial, set to free
      await supabaseClient
        .from("profiles")
        .update({ plan: "free", trial_used: true })
        .eq("user_id", user.id);

      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      logStep("Raw subscription data", {
        current_period_end: subscription.current_period_end,
        current_period_start: subscription.current_period_start,
        type_end: typeof subscription.current_period_end,
      });

      // Handle both numeric timestamps and ISO string dates
      const endValue = subscription.current_period_end;
      const startValue = subscription.current_period_start;
      
      if (typeof endValue === "number") {
        subscriptionEnd = new Date(endValue * 1000).toISOString();
      } else if (typeof endValue === "string") {
        subscriptionEnd = new Date(endValue).toISOString();
      }

      let subscriptionStart: string | null = null;
      if (typeof startValue === "number") {
        subscriptionStart = new Date(startValue * 1000).toISOString();
      } else if (typeof startValue === "string") {
        subscriptionStart = new Date(startValue).toISOString();
      }

      productId = subscription.items.data[0]?.price?.product ?? null;
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });

      // Update profile to premium
      const updateData: any = {
        plan: "premium",
        trial_used: true,
      };
      if (subscriptionEnd) updateData.plan_expires_at = subscriptionEnd;
      if (subscriptionStart) updateData.plan_started_at = subscriptionStart;

      await supabaseClient
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id);
    } else {
      logStep("No active subscription found");
      // Check trial
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("plan, plan_expires_at, trial_used")
        .eq("user_id", user.id)
        .single();

      if (profile?.plan === "premium" && profile?.plan_expires_at) {
        const expiresAt = new Date(profile.plan_expires_at);
        if (expiresAt > new Date()) {
          return new Response(JSON.stringify({
            subscribed: true,
            product_id: "trial",
            subscription_end: profile.plan_expires_at,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }

      await supabaseClient
        .from("profiles")
        .update({ plan: "free", trial_used: true })
        .eq("user_id", user.id);
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
