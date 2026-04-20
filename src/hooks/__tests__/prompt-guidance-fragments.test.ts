import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../../../');

function read(path: string): string {
  return readFileSync(join(repoRoot, path), 'utf-8');
}

function extract(text: string, startMarker: string, endMarker: string): string {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `missing start marker ${startMarker}`);
  assert.notEqual(end, -1, `missing end marker ${endMarker}`);
  return text.slice(start + startMarker.length, end).trim();
}

describe('prompt-guidance fragments stay synced with generated surfaces', () => {
  it('eliminates stale minimum-effort wording from shared fragment docs', () => {
    for (const file of [
      'docs/prompt-guidance-fragments/executor-shared.md',
      'docs/prompt-guidance-fragments/planner-shared.md',
      'docs/prompt-guidance-fragments/verifier-shared.md',
    ]) {
      const content = read(file);
      assert.doesNotMatch(content, /compact, information-dense/i);
      assert.doesNotMatch(content, /concise and evidence-dense/i);
      assert.match(content, /quality-first/i);
    }
  });

  it('syncs root/template AGENTS shared guidance blocks', () => {
    const operating = read('docs/prompt-guidance-fragments/core-operating-principles.md').trim();
    const verifySeq = read('docs/prompt-guidance-fragments/core-verification-and-sequencing.md').trim();

    for (const file of ['AGENTS.md', 'templates/AGENTS.md']) {
      const content = read(file);
      assert.equal(
        extract(content, '<!-- OMX:GUIDANCE:OPERATING:START -->', '<!-- OMX:GUIDANCE:OPERATING:END -->'),
        operating,
      );
      assert.equal(
        extract(content, '<!-- OMX:GUIDANCE:VERIFYSEQ:START -->', '<!-- OMX:GUIDANCE:VERIFYSEQ:END -->'),
        verifySeq,
      );
    }
  });

  it('syncs executor guidance fragments', () => {
    const content = read('prompts/executor.md');
    assert.equal(
      extract(content, '<!-- OMX:GUIDANCE:EXECUTOR:CONSTRAINTS:START -->', '<!-- OMX:GUIDANCE:EXECUTOR:CONSTRAINTS:END -->'),
      read('docs/prompt-guidance-fragments/executor-constraints.md').trim(),
    );
    assert.equal(
      extract(content, '<!-- OMX:GUIDANCE:EXECUTOR:OUTPUT:START -->', '<!-- OMX:GUIDANCE:EXECUTOR:OUTPUT:END -->'),
      read('docs/prompt-guidance-fragments/executor-output.md').trim(),
    );
  });

  it('syncs planner guidance fragments', () => {
    const content = read('prompts/planner.md');
    assert.equal(
      extract(content, '<!-- OMX:GUIDANCE:PLANNER:CONSTRAINTS:START -->', '<!-- OMX:GUIDANCE:PLANNER:CONSTRAINTS:END -->'),
      read('docs/prompt-guidance-fragments/planner-constraints.md').trim(),
    );
    assert.equal(
      extract(content, '<!-- OMX:GUIDANCE:PLANNER:INVESTIGATION:START -->', '<!-- OMX:GUIDANCE:PLANNER:INVESTIGATION:END -->'),
      read('docs/prompt-guidance-fragments/planner-investigation.md').trim(),
    );
    assert.equal(
      extract(content, '<!-- OMX:GUIDANCE:PLANNER:OUTPUT:START -->', '<!-- OMX:GUIDANCE:PLANNER:OUTPUT:END -->'),
      read('docs/prompt-guidance-fragments/planner-output.md').trim(),
    );
  });

  it('syncs verifier guidance fragments', () => {
    const content = read('prompts/verifier.md');
    assert.equal(
      extract(content, '<!-- OMX:GUIDANCE:VERIFIER:CONSTRAINTS:START -->', '<!-- OMX:GUIDANCE:VERIFIER:CONSTRAINTS:END -->'),
      read('docs/prompt-guidance-fragments/verifier-constraints.md').trim(),
    );
    assert.equal(
      extract(content, '<!-- OMX:GUIDANCE:VERIFIER:INVESTIGATION:START -->', '<!-- OMX:GUIDANCE:VERIFIER:INVESTIGATION:END -->'),
      read('docs/prompt-guidance-fragments/verifier-investigation.md').trim(),
    );
    assert.match(
      content,
      /Default final-output shape: quality-first and evidence-dense; think one more step before replying, and include as much detail as needed to justify the verdict without padding\./,
    );
    assert.doesNotMatch(content, /Default final-output shape: concise and evidence-dense/i);
  });
});
