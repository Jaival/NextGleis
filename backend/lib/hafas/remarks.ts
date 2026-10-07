import type { Hint, Status, Warning } from 'hafas-client';
import type { Notice } from '../../types/index.js';

type Remark = Hint | Status | Warning;

// A departure can carry a dozen remarks, nearly all of them `hint`s that never
// change ("bicycles allowed", "wheelchair accessible", fare zones). Riders only
// need what's different today: `warning`s (construction, disruption) and
// `status` remarks ("stop cancelled", "replacement service").
const SHOWN_TYPES = new Set(['warning', 'status']);
const MAX_NOTICES = 3;
// Some networks paste whole press releases into a warning.
const MAX_TEXT_LENGTH = 400;

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

// Warning texts are HTML fragments: <br>, <a href>, &nbsp; and the like.
function plainText(html: string | undefined): string {
  if (!html) return '';
  const text = html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#\d+|#x[\da-f]+|\w+);/gi, (match, entity: string) => {
      if (entity.startsWith('#x') || entity.startsWith('#X')) {
        return String.fromCodePoint(parseInt(entity.slice(2), 16));
      }
      if (entity.startsWith('#')) return String.fromCodePoint(parseInt(entity.slice(1), 10));
      return ENTITIES[entity.toLowerCase()] ?? match;
    })
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > MAX_TEXT_LENGTH ? `${text.slice(0, MAX_TEXT_LENGTH - 1).trimEnd()}…` : text;
}

export function toNotices(remarks: readonly Remark[] | undefined): Notice[] | undefined {
  if (!remarks?.length) return undefined;

  const notices: Notice[] = [];
  const seen = new Set<string>();
  for (const remark of remarks) {
    if (!SHOWN_TYPES.has(remark.type)) continue;
    const summary = plainText(remark.summary);
    const text = plainText(remark.text) || summary;
    if (!text || seen.has(text)) continue;
    seen.add(text);

    const notice: Notice = { text, severity: remark.type === 'warning' ? 'warning' : 'info' };
    // A summary that only repeats the start of the text adds nothing.
    if (summary && !text.startsWith(summary)) notice.title = summary;
    notices.push(notice);
    if (notices.length === MAX_NOTICES) break;
  }
  return notices.length > 0 ? notices : undefined;
}
