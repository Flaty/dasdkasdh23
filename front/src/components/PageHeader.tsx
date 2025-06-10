import BackButton from "./BackButton";

export default function PageHeader({ title }: { title: string }) {
  return (
    <div className="relative h-12 flex items-center">
      <BackButton className="absolute left-2 top-1/2 -translate-y-1/2" />
      <h1 className="text-xl font-extrabold mx-auto pr-4">{title}</h1>
    </div>
  );
}
