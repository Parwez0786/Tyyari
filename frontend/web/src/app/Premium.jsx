import { Link } from "react-router-dom";
import { Check, Crown, Lock, Sparkles } from "lucide-react";
import Layout from "../components/Layout";
import Loader from "../components/Loader";
import { usePremiumPage } from "../hooks/usePremium";

const PERKS = [
  "Unlock every premium HLD, LLD, DSA, and frontend problem",
  "Keep the free library — Premium only opens the locked set",
  "Same editors, sheets, and dashboard. No second product.",
  "Lifetime access. Pay once.",
];

export default function Premium() {
  const p = usePremiumPage();

  if (p.isLoading || p.busy) {
    return (
      <Layout>
        <Loader fill />
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="relative overflow-hidden rounded-[28px] border border-brand/25 bg-card p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
            <Crown size={12} />
            Premium
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Unlock the rest of the library.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-mute">
            Free covers the published practice set. Premium opens the locked HLD, LLD, DSA, and frontend problems — the ones with the lock on the card.
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[28px] border border-line bg-card p-6">
          <p className="label-caps">What you get</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight">Same workspace. More problems.</h2>
          <ul className="mt-5 grid gap-3">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-3 rounded-2xl border border-line bg-white/5 px-4 py-3">
                <Check size={16} className="mt-0.5 shrink-0 text-brand" />
                <span className="text-sm leading-6">{perk}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[28px] border border-brand/30 bg-gradient-to-br from-brand/15 via-card to-card p-6">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
            <Sparkles size={12} />
            Lifetime
          </p>
          <p className="mt-3 text-4xl font-extrabold tracking-tight">{p.price}</p>
          <p className="mt-1 text-sm text-mute">One payment. No subscription.</p>
          {p.entitled ? (
            <p className="mt-6 rounded-2xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm font-semibold">
              You already have Premium. Locked cards will open.
            </p>
          ) : p.token ? (
            <div className="mt-6 grid gap-3">
              <button type="button" className="btn-premium !px-5 !py-3" onClick={p.checkout} disabled={p.busy}>
                {p.busy ? "Working…" : `Upgrade · ${p.price}`}
              </button>
              {p.provider === "dev" && (
                <button type="button" className="btn-ghost !px-5 !py-2.5" onClick={p.activateDev} disabled={p.busy}>
                  Unlock locally (no Stripe key)
                </button>
              )}
              {p.status === "cancel" && (
                <p className="text-sm text-mute">Checkout was cancelled. Nothing was charged.</p>
              )}
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/register" className="btn-premium !px-5 !py-3">Create an account</Link>
              <Link to="/login" className="btn-ghost !px-5 !py-2.5">Sign in</Link>
            </div>
          )}
          {p.note && <p className="mt-4 text-sm font-semibold text-brand">{p.note}</p>}
          {p.error && <p className="mt-4 text-sm text-hard">{p.error}</p>}
          {p.provider === "dev" && !p.entitled && (
            <p className="mt-4 text-xs leading-5 text-mute">
              Stripe keys are not set, so checkout stays on this machine. Add <code>STRIPE_SECRET_KEY</code> to <code>.env</code> for a real card page.
            </p>
          )}
        </article>
      </section>
    </Layout>
  );
}

export function PremiumGate({ question, backTo }) {
  return (
    <section className="mx-auto max-w-lg py-16 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/15 text-brand">
        <Lock size={20} />
      </span>
      <p className="label-caps mt-5">Premium problem</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{question?.title || "Locked"}</h1>
      <p className="mt-3 text-sm leading-6 text-mute">
        This one is behind the lock. Upgrade to open the editor, canvas, and hidden cases.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/premium" className="btn-premium !px-5 !py-2.5">Upgrade to Premium</Link>
        {backTo && <Link to={backTo} className="btn-ghost !px-5 !py-2.5">Back</Link>}
      </div>
    </section>
  );
}
