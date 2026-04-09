import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold">Tell Us About Your Nonprofit</h1>
      <p className="text-muted-foreground">
        Form coming in Week 2.
      </p>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        ← Back to Home
      </Link>
    </main>
  );
}
