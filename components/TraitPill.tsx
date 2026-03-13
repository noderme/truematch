// components/TraitPill.tsx
interface TraitPillProps {
  trait: string;
  selected: boolean;
  onClick: () => void;
}

export default function TraitPill({ trait, selected, onClick }: TraitPillProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
        selected
          ? "bg-gradient-to-r from-rose-500/20 via-fuchsia-500/20 to-sky-500/20 border border-fuchsia-500/40 text-fuchsia-300"
          : "bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-200"
      }`}
    >
      {trait}
    </button>
  );
}
