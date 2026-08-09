export default function StatsCard({ label, value, detail, trend = "neutral" }) {
  const detailColor = {
    positive: "text-positive",
    negative: "text-negative",
    neutral: "text-slate-400",
  }[trend];

  return (
    <article className="neo-surface rounded-2xl p-5 transition duration-200 hover:-translate-y-0.5 hover:border-accent/60">
      <p className="text-xs font-medium text-slate-400 sm:text-base">{label}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-white sm:text-3xl">{value}</p>
      <p className={`mt-1 text-xs font-medium ${detailColor} sm:text-base`}>{detail}</p>
    </article>
  );
}
