interface PageHeaderProps {
  orgName: string;
  period: string;
}

export function PageHeader({ orgName, period }: PageHeaderProps) {
  return (
    <header className="border-b border-border">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{orgName}</h1>
          <p className="text-sm text-muted mt-0.5">{period}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-sm border border-border rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            Export PDF
          </button>
        </div>
      </div>
    </header>
  );
}
