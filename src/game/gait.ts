export const RUN_STRIDE=160;
// Advance on actual ground distance, not wall time. Forest/shallows and slow
// frames must not play the same leg cycle faster than the actor travels.
export function runFrame(distance:number){return Math.floor(((distance%RUN_STRIDE+RUN_STRIDE)%RUN_STRIDE)/RUN_STRIDE*8)%8;}
