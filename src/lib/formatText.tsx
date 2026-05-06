import React from "react";

export function formatText(text: string, highlight?: string): React.ReactNode {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  const pattern = /(\*[^*]+\*|_[^_]+_|~[^~]+~|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  const renderSegment = (segment: string, keyPrefix: string): React.ReactNode => {
    if (!highlight || !highlight.trim()) return segment;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const subParts = segment.split(regex);
    return subParts.map((s, i) =>
      regex.test(s)
        ? <mark key={`${keyPrefix}-h${i}`} className="bg-yellow-200/60 dark:bg-yellow-500/30 rounded">{s}</mark>
        : s
    );
  };

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      const plain = text.slice(last, match.index);
      parts.push(<React.Fragment key={`p${last}`}>{renderSegment(plain, `p${last}`)}</React.Fragment>);
    }

    const raw = match[0];
    const inner = raw.slice(1, -1);
    const key = `fmt${match.index}`;

    if (raw.startsWith("*")) {
      parts.push(<strong key={key}>{renderSegment(inner, key)}</strong>);
    } else if (raw.startsWith("_")) {
      parts.push(<em key={key}>{renderSegment(inner, key)}</em>);
    } else if (raw.startsWith("~")) {
      parts.push(<del key={key}>{renderSegment(inner, key)}</del>);
    } else if (raw.startsWith("`")) {
      parts.push(
        <code key={key} className="bg-muted px-1 rounded text-xs font-mono">
          {inner}
        </code>
      );
    }

    last = match.index + raw.length;
  }

  if (last < text.length) {
    const plain = text.slice(last);
    parts.push(<React.Fragment key={`p${last}`}>{renderSegment(plain, `p${last}`)}</React.Fragment>);
  }

  return parts.length ? parts : text;
}
