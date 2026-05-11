import Image from "next/image";

export function ToolsBanner() {
  return (
    <div className="flex items-center justify-center gap-8 py-6 mb-8 bg-[var(--card)] border border-[var(--border)] rounded-xl">
      {/* CodeRabbit */}
      <div className="flex items-center gap-3">
        <Image
          src="/coderabbit-logo.png"
          alt="CodeRabbit"
          width={48}
          height={48}
          className="rounded-xl"
        />
        <div>
          <div className="text-lg font-bold">CodeRabbit</div>
          <div className="text-xs text-[var(--muted-foreground)]">AI Code Review</div>
        </div>
      </div>

      {/* VS */}
      <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-[var(--border)] bg-[var(--muted)]">
        <span className="text-sm font-bold text-[var(--muted-foreground)]">VS</span>
      </div>

      {/* GitHub Copilot */}
      <div className="flex items-center gap-3">
        <Image
          src="/copilot-logo.webp"
          alt="GitHub Copilot"
          width={48}
          height={48}
          className="rounded-xl invert"
        />
        <div>
          <div className="text-lg font-bold">GitHub Copilot</div>
          <div className="text-xs text-[var(--muted-foreground)]">Code Review</div>
        </div>
      </div>
    </div>
  );
}

export function ToolLabel({ tool }: { tool: "coderabbit" | "copilot" }) {
  if (tool === "coderabbit") {
    return (
      <div className="flex items-center gap-2">
        <Image
          src="/coderabbit-logo.png"
          alt="CodeRabbit"
          width={24}
          height={24}
          className="rounded-md"
        />
        <span className="font-semibold text-[#FF6B2B]">CodeRabbit</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Image
        src="/copilot-logo.webp"
        alt="GitHub Copilot"
        width={24}
        height={24}
        className="rounded-md invert"
      />
      <span className="font-semibold text-[#1F6FEB]">GitHub Copilot</span>
    </div>
  );
}
