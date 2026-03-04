import { executeSlashCommand } from '../../services/workspace-service/src/bots/command-runner';

describe('executeSlashCommand', () => {
  it('handles echo', () => {
    expect(executeSlashCommand('/echo hello')).toBe('hello');
  });

  it('handles status', () => {
    expect(executeSlashCommand('/status')).toContain('operational');
  });

  it('handles unknown command', () => {
    expect(executeSlashCommand('/noop')).toContain('Unknown command');
  });
});