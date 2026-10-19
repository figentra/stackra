import { Button } from "@heroui/react";

export function App() {
  return (
    <main className="grid min-h-dvh place-items-center gap-4 p-4">
      <h1 className="text-2xl font-semibold">{{ TITLE }}</h1>
      <Button>Get started</Button>
    </main>
  );
}
