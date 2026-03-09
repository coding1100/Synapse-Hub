export type MentionContext = {
  query: string;
  start: number;
  end: number;
};

export function extractMentionContext(content: string, caretPosition: number) {
  const safeCaret = Math.max(0, Math.min(caretPosition, content.length));
  const uptoCaret = content.slice(0, safeCaret);
  const match = uptoCaret.match(/(?:^|\s)@([a-zA-Z0-9._-]{1,64})$/);

  if (!match) {
    return null;
  }

  const query = match[1];
  const start = safeCaret - query.length - 1;

  return {
    query,
    start,
    end: safeCaret,
  } satisfies MentionContext;
}

export function buildMentionHandle(displayName: string, email: string) {
  const normalizedDisplayName = displayName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '');

  if (normalizedDisplayName.length >= 2) {
    return normalizedDisplayName;
  }

  const localPart = email
    .split('@')[0]
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');

  if (localPart && localPart.length >= 2) {
    return localPart;
  }

  return 'user';
}

export function insertMention(
  content: string,
  mention: MentionContext,
  handle: string,
) {
  const replacement = `@${handle} `;
  const nextContent = `${content.slice(0, mention.start)}${replacement}${content.slice(mention.end)}`;
  const nextCaretPosition = mention.start + replacement.length;

  return {
    nextContent,
    nextCaretPosition,
  };
}
