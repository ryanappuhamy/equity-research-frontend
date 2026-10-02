import { isValidElement, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

function getTextContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getTextContent).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getTextContent(node.props.children);
  }
  return "";
}

function pnlTone(text: string): "up" | "down" | null {
  const value = text.trim();
  if (!/[\d$%()]/.test(value)) return null;
  if (/^-|\(-|−/.test(value)) return "down";
  if (/^\+|\(\+/.test(value)) return "up";
  return null;
}

const briefMarkdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-4 text-balance text-2xl font-semibold tracking-[-0.02em] text-foreground sm:text-[28px]">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-9 text-balance text-xl font-semibold tracking-tight text-foreground">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-6 text-base font-semibold text-foreground">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mb-4 text-sm leading-relaxed text-foreground/85 sm:text-[15px]">{children}</p>
  ),
  ul: ({ children }) => <ul className="my-4 space-y-2.5">{children}</ul>,
  ol: ({ children }) => (
    <ol className="my-4 list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-foreground/85">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="flex gap-3 text-sm leading-relaxed text-foreground/85 sm:text-[15px]">
      <span
        aria-hidden
        className="mt-[0.6rem] size-1.5 shrink-0 rounded-full bg-muted-foreground"
      />
      <span className="min-w-0 flex-1 [&>p]:mb-0">{children}</span>
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-5 rounded-2xl bg-warn/10 px-4 py-3 text-sm leading-relaxed text-foreground/85">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => <strong className="font-medium text-foreground">{children}</strong>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-primary underline-offset-4 hover:underline"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-8 border-border/60" />,
  table: ({ children }) => (
    <div className="my-5 overflow-x-auto rounded-xl border border-white/[0.06] bg-card/40">
      <table className="w-full min-w-[520px] border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-white/[0.06] bg-muted/30">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-white/[0.04]">{children}</tbody>,
  tr: ({ children }) => (
    <tr className="even:bg-muted/15 odd:bg-transparent transition-colors">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => {
    const tone = pnlTone(getTextContent(children));
    return (
      <td
        className={cn(
          "px-4 py-3 tabular-nums text-foreground/90",
          tone === "up" && "text-up",
          tone === "down" && "text-down",
        )}
      >
        {children}
      </td>
    );
  },
};

function stripLeadingH1(markdown: string): string {
  const lines = markdown.split("\n");
  let index = 0;

  while (index < lines.length && lines[index].trim() === "") {
    index += 1;
  }

  if (index < lines.length && /^#\s+/.test(lines[index].trim())) {
    index += 1;
    while (index < lines.length && lines[index].trim() === "") {
      index += 1;
    }
  }

  return lines.slice(index).join("\n");
}

export function BriefMarkdown({ content }: { content: string }) {
  const body = stripLeadingH1(content);

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={briefMarkdownComponents}>
      {body}
    </ReactMarkdown>
  );
}
