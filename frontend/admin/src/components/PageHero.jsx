export default function PageHero({ kicker, title, detail, action }) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-brand/25 bg-card p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-2xl">
          <p className="font-hand text-2xl text-brand">{kicker}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
          {detail && <p className="mt-2 text-sm leading-6 text-mute">{detail}</p>}
        </div>
        {action && <div className="w-full shrink-0 sm:w-auto [&>a]:w-full sm:[&>a]:w-auto">{action}</div>}
      </div>
    </section>
  );
}
