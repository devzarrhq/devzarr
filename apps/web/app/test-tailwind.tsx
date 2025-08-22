export default function TestTailwind() {
  return (
    <div className="p-10 space-y-4">
      <div className="bg-blue-500 text-4xl text-white p-4 rounded">
        If you see this blue box, Tailwind is working!
      </div>
      <p className="text-red-500">
        If you see this red text, Tailwind is compiling default utilities.
      </p>
    </div>
  );
}