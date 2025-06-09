import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <h1 className="text-5xl font-bold tracking-tighter">
        Welcome to TGeasy
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        The easiest way to manage your advertising campaigns in Telegram. Automate everything from post creation to analytics.
      </p>
      <div className="mt-8">
        <Button size="lg">
          Войти через Telegram
        </Button>
      </div>
    </main>
  );
} 