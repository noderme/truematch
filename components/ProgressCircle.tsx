// components/ProgressCircle.tsx
interface ProgressCircleProps {
  percent: number;
}

export default function ProgressCircle({ percent }: ProgressCircleProps) {
  return (
    <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-blue-500">
      <span className="text-sm font-bold">{percent}%</span>
    </div>
  );
}
