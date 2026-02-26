// components/TraitPill.tsx
interface TraitPillProps {
  trait: string;
  selected: boolean;
  onClick: () => void;
}

export default function TraitPill({
  trait,
  selected,
  onClick,
}: TraitPillProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm sm:text-base ${
        selected ? "bg-green-500 text-white" : "bg-gray-200 text-gray-800"
      }`}
    >
      {trait}
    </button>
  );
}
