import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function ThankYouPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold tracking-tight">Thank You!</h1>
        <p className="mt-3 text-muted-foreground">
          We&apos;ve received your information. We&apos;ll reach out soon with
          grant opportunities that match your nonprofit.
        </p>
      </div>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        ← Back to Home
      </Link>
    </main>
  );
}
