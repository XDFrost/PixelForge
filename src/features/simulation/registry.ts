import {
  EMPTY,
  KEEP,
  MAX_ELEMENTS,
  type CompiledRegistry,
  type ElementDef,
  type Reaction,
  type ReactionRule,
  type UpdateFn,
} from './types';

const clampByte = (v: number): number => (v < 0 ? 0 : v > 255 ? 255 : v) | 0;

/**
 * Compile element definitions and reaction rules into flat lookup tables.
 * Validates ids at startup so typos fail loudly instead of mid-tick.
 */
export function compileRegistry(defs: readonly ElementDef[], rules: readonly ReactionRule[] = []): CompiledRegistry {
  const byId: (ElementDef | undefined)[] = new Array(MAX_ELEMENTS).fill(undefined);
  const behavior = new Uint8Array(MAX_ELEMENTS);
  const density = new Uint8Array(MAX_ELEMENTS);
  const dispersion = new Uint8Array(MAX_ELEMENTS);
  const viscosity = new Float32Array(MAX_ELEMENTS);
  const friction = new Float32Array(MAX_ELEMENTS);
  const riseSkip = new Float32Array(MAX_ELEMENTS);
  const cooling = new Float32Array(MAX_ELEMENTS);
  const lifeEnd = new Uint8Array(MAX_ELEMENTS);
  const conductivity = new Uint16Array(MAX_ELEMENTS);
  const defaultTemp = new Uint8Array(MAX_ELEMENTS);
  const defaultLife = new Uint8Array(MAX_ELEMENTS);
  const hasUpdate = new Uint8Array(MAX_ELEMENTS);
  const updateFns: (UpdateFn | undefined)[] = new Array(MAX_ELEMENTS).fill(undefined);
  const hasTransition = new Uint8Array(MAX_ELEMENTS);
  const transAboveTemp = new Uint8Array(MAX_ELEMENTS).fill(255);
  const transAboveTo = new Uint8Array(MAX_ELEMENTS);
  const transBelowTemp = new Uint8Array(MAX_ELEMENTS); // 0 = never
  const transBelowTo = new Uint8Array(MAX_ELEMENTS);

  for (const def of defs) {
    const { id } = def;
    if (!Number.isInteger(id) || id < 0 || id >= MAX_ELEMENTS) throw new Error(`Element "${def.name}" has invalid id ${id}`);
    if (byId[id]) throw new Error(`Duplicate element id ${id}: "${byId[id]!.name}" and "${def.name}"`);
    if (def.colors.length === 0) throw new Error(`Element "${def.name}" needs at least one colour`);
    const rise = def.riseChance ?? 1;
    if (rise < 0 || rise > 1) throw new Error(`Element "${def.name}" riseChance out of range: ${rise}`);
    const cond = def.conductivity ?? 0;
    if (cond < 0 || cond > 256) throw new Error(`Element "${def.name}" conductivity out of range: ${cond}`);
    const fric = def.friction ?? 0;
    if (fric < 0 || fric > 1) throw new Error(`Element "${def.name}" friction out of range: ${fric}`);

    byId[id] = def;
    behavior[id] = def.behavior;
    density[id] = clampByte(def.density);
    dispersion[id] = clampByte(def.dispersion ?? 0);
    viscosity[id] = def.viscosity ?? 0;
    friction[id] = fric;
    riseSkip[id] = 1 - rise;
    cooling[id] = Math.max(0, def.cooling ?? 0);
    lifeEnd[id] = def.lifeEnd ?? EMPTY;
    conductivity[id] = cond;
    defaultTemp[id] = clampByte(def.defaultTemp ?? 20);
    defaultLife[id] = clampByte(def.defaultLife ?? 0);
    if (def.update) {
      hasUpdate[id] = 1;
      updateFns[id] = def.update;
    }
    if (def.transitions) {
      const { above, below } = def.transitions;
      if (above) {
        hasTransition[id] = 1;
        transAboveTemp[id] = clampByte(above[0]);
        transAboveTo[id] = above[1];
      }
      if (below) {
        hasTransition[id] = 1;
        transBelowTemp[id] = clampByte(below[0]);
        transBelowTo[id] = below[1];
      }
    }
  }
  if (byId[EMPTY] === undefined) {
    throw new Error('Registry must define the EMPTY element (id 0)');
  }

  const assertKnown = (id: number, what: string): void => {
    if (id === KEEP) return;
    if (!byId[id]) throw new Error(`Unknown element id ${id} referenced by ${what}`);
  };

  // Cross-references can only be validated once every def is registered.
  for (const def of defs) {
    assertKnown(lifeEnd[def.id], `"${def.name}".lifeEnd`);
    if (def.transitions?.above) assertKnown(def.transitions.above[1], `"${def.name}".transitions.above`);
    if (def.transitions?.below) assertKnown(def.transitions.below[1], `"${def.name}".transitions.below`);
  }

  const reactions: (Reaction | undefined)[] = new Array(MAX_ELEMENTS * MAX_ELEMENTS).fill(undefined);
  const reactive = new Uint8Array(MAX_ELEMENTS);
  for (const rule of rules) {
    const { a, b, reaction } = rule;
    assertKnown(a, 'reaction.a');
    assertKnown(b, 'reaction.b');
    assertKnown(reaction.aBecomes, 'reaction.aBecomes');
    assertKnown(reaction.bBecomes, 'reaction.bBecomes');
    if (reaction.probability < 0 || reaction.probability > 1) {
      throw new Error(`Reaction ${a}+${b} has probability out of range: ${reaction.probability}`);
    }
    for (const [k, v] of [["aChance", reaction.aChance], ["bChance", reaction.bChance]] as const) {
      if (v !== undefined && (v < 0 || v > 1)) throw new Error(`Reaction ${a}+${b} has ${k} out of range: ${v}`);
    }
    reactions[a * MAX_ELEMENTS + b] = reaction;
    reactive[a] = 1;
    if (rule.mirror !== false) {
      reactive[b] = 1;
      reactions[b * MAX_ELEMENTS + a] = {
        aBecomes: reaction.bBecomes,
        bBecomes: reaction.aBecomes,
        probability: reaction.probability,
        aLife: reaction.bLife,
        bLife: reaction.aLife,
        aChance: reaction.bChance,
        bChance: reaction.aChance,
      };
    }
  }

  return {
    defs: byId,
    behavior,
    density,
    dispersion,
    viscosity,
    friction,
    riseSkip,
    cooling,
    lifeEnd,
    conductivity,
    defaultTemp,
    defaultLife,
    hasUpdate,
    updateFns,
    hasTransition,
    transAboveTemp,
    transAboveTo,
    transBelowTemp,
    transBelowTo,
    reactive,
    reactions,
  };
}
