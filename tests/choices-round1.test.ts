import {test,expect} from 'vitest';import {createHash} from 'node:crypto';import {writeFileSync,mkdirSync} from 'node:fs';
import {EscortRun} from '../src/game/escortRun';import {STRATEGY_CHOICES,ROUND1_CHOICES,round1Cue} from '../src/game/choiceStrategy';import {decision} from './helpers/strategyDecision';import {trace,STEP} from './helpers/choiceTrace';
test('round1 keeps exact combat/encounter config and factual stage cues',()=>{
 expect(ROUND1_CHOICES).toEqual(STRATEGY_CHOICES);const r=new EscortRun(undefined,'choices',ROUND1_CHOICES);expect(round1Cue(r).stage).toBe('ready');r.start();const stages=new Set<string>();for(let i=0;i<3600&&!r.finished;i++){stages.add(round1Cue(r).stage);r.update(STEP);}expect([...stages]).toEqual(expect.arrayContaining(['approach','near','overlap','far','breather']));expect(r.phase).toBe('won');expect(round1Cue(r).text).not.toMatch(/飞袭|破空|摘桃/);r.start();expect(r.battle.energy).toBe(100);expect(r.flight.fruit).toBe(2);expect(r.flight.events).toHaveLength(0);
});
test('same-prefix timing matrix preserves benefits, refusals, failures and non-optimal actions',()=>{
 mkdirSync('reports',{recursive:true});const rows:any[]=[];
 for(const marker of ['near-clear','staff-range','overlap']){
 const point=decision(EscortRun,ROUND1_CHOICES,marker);
 for(const latency of [.5,.8,1.2]){const at=point.cue+latency,group=['stay','fly','cancel','staff'].map(action=>({marker,cue:point.cue,latency,...trace(EscortRun,ROUND1_CHOICES,at,action,45)}));expect(new Set(group.map(x=>x.prefixDigest)).size).toBe(1);for(const row of group)expect(createHash('sha256').update(JSON.stringify(row.before)).digest('hex')).toBe(row.prefixDigest);rows.push(...group);}
 }
 const good=rows.filter(r=>r.marker==='near-clear'&&r.action==='fly');const find=(r:any,a:string)=>rows.find(x=>x.marker===r.marker&&x.latency===r.latency&&x.action===a);
 // Assert representative windows, not that every delay/action is superior.
 expect(good.filter(r=>r.accepted&&r.defeatedAt<find(r,'cancel').defeatedAt&&r.defeatedAt<find(r,'stay').defeatedAt).length).toBeGreaterThanOrEqual(2);
 expect(rows.some(r=>r.marker==='overlap'&&r.action==='fly'&&r.after.tangDamage>find(r,'stay').after.tangDamage)).toBe(true);
 expect(rows.some(r=>r.marker==='staff-range'&&r.action==='staff'&&r.accepted&&r.after.targetDamage>0)).toBe(true);
 const prefix=[{at:decision(EscortRun,ROUND1_CHOICES,'overlap').at,type:'fly',targetId:'archer-1'}];const peach:any[]=[];
 for(const at of [12,24]){const group=['stay','peach'].map(action=>({when:at===12?'risky':'later',...trace(EscortRun,ROUND1_CHOICES,at,action,45,prefix)}));expect(new Set(group.map(r=>r.prefixDigest)).size).toBe(1);peach.push(...group);}
 writeFileSync('reports/strategy-round1-pairs.json',JSON.stringify({sourceSha:process.env.SOURCE_SHA??'local-unpublished',baselineSha:'dac21ec62bb39cff41d939f23159d318175a279f',method:'fixed1/60; identical complete prefix digest per group,45s post-input tick horizon; terminal freezes naturally; NOT browser/player timing evidence; delays are perturbations, not independent random seeds',config:ROUND1_CHOICES,combatParametersChanged:false,rows,peach},null,2));
},180000);
