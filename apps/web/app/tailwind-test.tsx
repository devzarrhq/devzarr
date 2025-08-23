export default function TailwindTest() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-500 text-white">
      <h1 className="text-4xl font-bold mb-4">Tailwind Test</h1>
      <p className="text-lg">If you see a blue background and white text, Tailwind is working!</p>
      <div className="mt-6 p-4 bg-white text-blue-700 rounded shadow">
        This box should have white background and blue text.
      </div>
    </div>
  );
}