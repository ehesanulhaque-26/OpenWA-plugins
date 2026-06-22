import type { HookContext, IncomingMessage } from '../types/openwa';

export const COLUMNS = [
  'timestamp', 'sessionId', 'event', 'direction', 'chatId', 'from', 'to',
  'senderName', 'isGroup', 'type', 'body', 'messageId', 'ackStatus', 'error',
] as const;

type FailedPayload = { sessionId?: string; error?: string; input?: { chatId?: string; text?: string } };
type AckPayload = { messageId?: string; status?: string };

// Neutralize CSV / spreadsheet formula injection: a value whose first character is one of
// = + - @ <tab> <CR> is treated as a formula by spreadsheet apps on export/re-import. Prefixing
// with a single quote makes Sheets keep it literal (the quote is stripped on display). All
// attacker-controlled cells flow through here, so this single guard covers the whole row.
function str(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

export function buildRow(ctx: HookContext): string[] {
  const event = ctx.event;
  const timestamp = new Date(ctx.timestamp ?? Date.now()).toISOString();
  const sessionId = str(ctx.sessionId);
  const direction = event === 'message:received' ? 'in' : 'out';

  if (event === 'message:failed') {
    const p = (ctx.data ?? {}) as FailedPayload;
    // A failed send carries no recipient field, so the destination (to) mirrors chatId; from is unknown.
    return [timestamp, sessionId, event, direction, str(p.input?.chatId), '', str(p.input?.chatId),
            '', '', 'text', str(p.input?.text), '', '', str(p.error)];
  }

  if (event === 'message:ack') {
    const p = (ctx.data ?? {}) as AckPayload;
    return [timestamp, sessionId, event, direction, '', '', '', '', '', '', '', str(p.messageId), str(p.status), ''];
  }

  // message:received / message:sent carry an IncomingMessage
  const m = (ctx.data ?? {}) as Partial<IncomingMessage>;
  const senderName = m.contact?.pushName || m.contact?.name || '';
  return [timestamp, sessionId, event, direction, str(m.chatId), str(m.from), str(m.to),
          str(senderName), str(m.isGroup), str(m.type), str(m.body), str(m.id), '', ''];
}
