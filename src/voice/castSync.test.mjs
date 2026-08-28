import test from 'node:test';
import assert from 'node:assert/strict';
import { checkIsReceiver, broadcastChange } from '../castSync.js';

test('castSync: checkIsReceiver function is exported', (t) => {
  assert.equal(typeof checkIsReceiver, 'function');
});

test('castSync: broadcastChange exists and safely handles when uninitialized', (t) => {
  assert.equal(typeof broadcastChange, 'function');
  assert.doesNotThrow(() => {
    broadcastChange('day', 50);
  });
});
