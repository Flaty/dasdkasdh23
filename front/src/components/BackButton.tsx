import { useCustomNavigate } from "../utils/useCustomNavigate";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

export default function BackButton({ className = "" }: { className?: string }) {
  const navigate = useCustomNavigate();

  return (
    <button
      onClick={() => navigate(-1, "backward")}
      className={`absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 p-0 m-0 flex items-center justify-center ${className}`}
    >
      <ChevronLeftIcon className="w-4 h-4 text-white" />
    </button>
  );
}

