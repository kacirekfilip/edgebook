export default function AddTradeButton({ onClick }) {
  return (
    <button
      className="fixed bottom-6 right-6 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-accent to-violet text-3xl font-light text-white shadow-lg shadow-accent/40 transition hover:scale-105 hover:from-accentHover md:hidden"
      type="button"
      aria-label="Přidat obchod"
      onClick={onClick}
    >
      +
    </button>
  );
}
