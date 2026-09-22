import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

test('after the fingerprint the garden opens without a camera step', () => {
    const quest = readFileSync(join(root, 'quest.js'), 'utf8');
    assert.equal(quest.includes('startSmileGate'), false);
    assert.equal(quest.includes('smile'), false);
    assert.match(quest, /onComplete:\s*openGarden/);
});

test('the page no longer asks for a photo', () => {
    const html = readFileSync(join(root, '../index.html'), 'utf8');
    assert.equal(html.includes('smile-gate'), false);
    assert.equal(html.includes('smile-video'), false);
    assert.equal(html.includes('getUserMedia'), false);
    assert.equal(html.includes('1 de 2'), false);
});

test('the lock does not promise a smile next', () => {
    const lock = readFileSync(join(root, 'lock.js'), 'utf8');
    assert.equal(lock.includes('sonrisa'), false);
});
