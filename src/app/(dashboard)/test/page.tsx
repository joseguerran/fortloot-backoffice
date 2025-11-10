'use client';

export default function TestPage() {
  console.log('[TestPage] Rendering');

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">Test Page</h1>
      <p className="text-lg">If you can see this, the dashboard layout is working!</p>
      <div className="mt-4 p-4 bg-green-500 text-white rounded">
        Success! The component is rendering correctly.
      </div>
    </div>
  );
}
