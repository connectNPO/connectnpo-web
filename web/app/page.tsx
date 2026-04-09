import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8">
      <h1 className="text-4xl font-bold">Hello ConnectNPO 👋</h1>
      <p className="text-muted-foreground">
        Find grants for your nonprofit in 5 minutes.
      </p>
      <div className="flex gap-3">
        <Button>Get Started</Button>
        <Button variant="outline">Learn More</Button>
        <Button variant="ghost">Skip</Button>
      </div>
    </main>
  );
}
