import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_VOICE_TIER,
  VOICE_MODELS,
  VOICE_TIERS,
  resolveVoiceModel,
  isKnownVoiceTier,
  mostExpensiveVoiceModel,
  resolveVoiceModelById,
  normalizeCostLimits,
  serializeCostLimits,
  splitUsageTokens,
  estimateUsageCostUsd,
  formatCostUsd,
  createVoiceCostTracker,
} from './voiceCost.js';

test('voiceCost: resolveVoiceModel handles valid and invalid tiers', () => {
  assert.equal(resolveVoiceModel('standard').id, 'gpt-realtime-2');
  assert.equal(resolveVoiceModel('mini').id, 'gpt-realtime-2.1-mini');
  assert.equal(resolveVoiceModel('STANDARD').tier, 'standard');
  assert.equal(resolveVoiceModel('unknown-tier').tier, DEFAULT_VOICE_TIER);
  assert.equal(resolveVoiceModel(null).tier, DEFAULT_VOICE_TIER);
  assert.equal(resolveVoiceModel(undefined).tier, DEFAULT_VOICE_TIER);
});

test('voiceCost: isKnownVoiceTier checks validity', () => {
  assert.equal(isKnownVoiceTier('standard'), true);
  assert.equal(isKnownVoiceTier('mini'), true);
  assert.equal(isKnownVoiceTier('MINI'), true);
  assert.equal(isKnownVoiceTier('fake'), false);
  assert.equal(isKnownVoiceTier(null), false);
});

test('voiceCost: resolveVoiceModelById maps known and unknown IDs', () => {
  const std = resolveVoiceModelById('gpt-realtime-2');
  assert.equal(std.tier, 'standard');
  assert.equal(std.recognized, true);

  const mini = resolveVoiceModelById('gpt-realtime-2.1-mini');
  assert.equal(mini.tier, 'mini');
  assert.equal(mini.recognized, true);

  const unknown = resolveVoiceModelById('gpt-realtime-future');
  assert.equal(unknown.recognized, false);
  assert.equal(unknown.id, 'gpt-realtime-future');
});

test('voiceCost: normalizeCostLimits and serializeCostLimits', () => {
  const norm = normalizeCostLimits({ warnUsd: 1.5, capUsd: 3.0 });
  assert.equal(norm.warnUsd, 1.5);
  assert.equal(norm.capUsd, 3.0);

  const def = normalizeCostLimits(null);
  assert.equal(def.warnUsd, 2);
  assert.equal(def.capUsd, 5);

  const off = normalizeCostLimits({ warnUsd: 'off', capUsd: 'off' });
  assert.equal(off.warnUsd, Infinity);
  assert.equal(off.capUsd, Infinity);

  const ser = serializeCostLimits(off);
  assert.equal(ser.warnUsd, 'off');
  assert.equal(ser.capUsd, 'off');
});

test('voiceCost: estimateUsageCostUsd and formatCostUsd', () => {
  const rates = VOICE_MODELS.standard.rates;
  const usage = {
    input_tokens: 1000,
    output_tokens: 500,
    input_token_details: { text_tokens: 500, audio_tokens: 500 },
    output_token_details: { text_tokens: 200, audio_tokens: 300 },
  };
  const cost = estimateUsageCostUsd(usage, rates);
  assert.ok(cost > 0);
  assert.equal(formatCostUsd(0), '~$0.00');
  assert.equal(formatCostUsd(0.004), '~$0.01');
  assert.equal(formatCostUsd(0.42), '~$0.42');
});

test('voiceCost: createVoiceCostTracker latches warnings and caps', () => {
  const tracker = createVoiceCostTracker({
    tier: 'standard',
    limits: { warnUsd: 0.05, capUsd: 0.10 },
  });

  const usage1 = {
    input_tokens: 2000,
    output_tokens: 1000,
    input_token_details: { audio_tokens: 2000 },
    output_token_details: { audio_tokens: 1000 },
  };

  const state1 = tracker.record(usage1);
  assert.ok(state1.totalUsd > 0);

  // Big usage to breach limits
  const bigUsage = {
    input_tokens: 5000,
    output_tokens: 3000,
    input_token_details: { audio_tokens: 5000 },
    output_token_details: { audio_tokens: 3000 },
  };
  const state2 = tracker.record(bigUsage);
  assert.ok(state2.totalUsd >= 0.10);
  assert.equal(state2.capReached, true);
  assert.equal(state2.level, 'cap');
});
