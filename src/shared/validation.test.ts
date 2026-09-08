import { describe, expect, it } from 'vitest';
import { validateBody, validateName, validateSignature } from './validation';

describe('validateName', () => {
  it('rejects a name under 2 characters after trimming', () => {
    expect(validateName(' ع ')).toBe('booth.errors.nameShort');
  });

  it('accepts a normal Arabic name', () => {
    expect(validateName('عبدالله المطيري')).toBeNull();
  });

  it('rejects a name over the configured max', () => {
    expect(validateName('a'.repeat(41))).toBe('booth.errors.nameLong');
  });
});

describe('validateBody', () => {
  it('rejects a body under 10 characters', () => {
    expect(validateBody('قصير')).toBe('booth.errors.bodyShort');
  });

  it('rejects a body over 180 characters', () => {
    expect(validateBody('ب'.repeat(181))).toBe('booth.errors.bodyLong');
  });

  it('accepts a mixed-script body within limits', () => {
    expect(validateBody('كل عام ووطني بخير — proud to be at SATORP!')).toBeNull();
  });
});

describe('validateSignature', () => {
  it('rejects an empty pad', () => {
    expect(validateSignature(0, true)).toBe('booth.errors.signature');
  });

  it('rejects a stray tap under 20 points', () => {
    expect(validateSignature(6, false)).toBe('booth.errors.signature');
  });

  it('accepts a real signature', () => {
    expect(validateSignature(140, false)).toBeNull();
  });
});
