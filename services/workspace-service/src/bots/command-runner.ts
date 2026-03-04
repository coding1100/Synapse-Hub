export function executeSlashCommand(command: string): string {
  const trimmed = command.trim();

  if (trimmed.startsWith('/echo ')) {
    return trimmed.replace('/echo ', '');
  }

  if (trimmed === '/status') {
    return 'SynapseHub bot subsystem is operational.';
  }

  if (trimmed === '/help') {
    return 'Available commands: /echo, /status, /help';
  }

  return `Unknown command: ${trimmed}`;
}