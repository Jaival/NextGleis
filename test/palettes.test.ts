/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { contrastRatio } from '../lib/contrast.ts';
import { PALETTES, PRODUCT, SKINS, STATUS } from '../lib/palettes.ts';

// WCAG AA for small text.
const AA = 4.5;

describe('skin palettes', () => {
  for (const skin of SKINS) {
    for (const mode of ['light', 'dark'] as const) {
      const p = PALETTES[skin][mode];
      const s = STATUS[skin][mode];
      const pairs: [string, string, string][] = [
        ['foreground/background', p.foreground, p.background],
        ['foreground/card', p.foreground, p.card],
        ['foreground/muted', p.foreground, p.muted],
        ['mutedForeground/background', p.mutedForeground, p.background],
        ['mutedForeground/card', p.mutedForeground, p.card],
        ['mutedForeground/muted', p.mutedForeground, p.muted],
        ['primary/background', p.primary, p.background],
        ['primary/card', p.primary, p.card],
        ['primaryForeground/primary', p.primaryForeground, p.primary],
        ['accentForeground/accent', p.accentForeground, p.accent],
        ['headerForeground/header', p.headerForeground, p.header],
        ['signForeground/sign', p.signForeground, p.sign],
        ['highlightForeground/highlight', p.highlightForeground, p.highlight],
        ['onTime/background', s.onTime, p.background],
        ['onTime/card', s.onTime, p.card],
        ['onTime/onTimeSoft', s.onTime, s.onTimeSoft],
        ['delay/background', s.delay, p.background],
        ['delay/card', s.delay, p.card],
        ['delay/delaySoft', s.delay, s.delaySoft],
        ['cancelled/background', s.cancelled, p.background],
        ['cancelled/card', s.cancelled, p.card],
        ['cancelled/cancelledSoft', s.cancelled, s.cancelledSoft],
      ];
      for (const [name, fg, bg] of pairs) {
        it(`${skin} ${mode}: ${name} >= ${AA}`, () => {
          const ratio = contrastRatio(fg, bg);
          assert.ok(ratio >= AA, `${fg} on ${bg} is ${ratio.toFixed(2)}`);
        });
      }
    }

    for (const [kind, { bg, fg }] of Object.entries(PRODUCT[skin])) {
      it(`${skin}: product ${kind} fg/bg >= ${AA}`, () => {
        const ratio = contrastRatio(fg, bg);
        assert.ok(ratio >= AA, `${fg} on ${bg} is ${ratio.toFixed(2)}`);
      });
    }
  }
});
