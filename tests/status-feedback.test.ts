import {test,expect} from 'vitest';
import {StatusFeedback} from '../src/game/statusFeedback';
test('arrival before rejection expiry stays deferred until exactly one second',()=>{
 let now=10,text='';const feedback=new StatusFeedback(()=>now,s=>text=s);
 feedback.show('moving');feedback.reject('rejected');now=200;feedback.show('arrived',true);
 for(now of [200,500,1009]){feedback.tick();expect(text).toBe('rejected');}
 now=1010;feedback.tick();expect(text).toBe('arrived');
});
test('arrival after expiry is shown immediately; explicit player input can replace status',()=>{
 let now=0,text='';const feedback=new StatusFeedback(()=>now,s=>text=s);
 feedback.reject('rejected');now=1001;feedback.show('arrived',true);expect(text).toBe('arrived');
 feedback.reject('rejected');feedback.show('selected');expect(text).toBe('selected');
});
test('latest deferred automatic status renders once and repeated rejection restarts one second',()=>{
 let now=0;const rendered:string[]=[];const feedback=new StatusFeedback(()=>now,s=>rendered.push(s));
 feedback.reject('rejected');now=900;feedback.reject('rejected');feedback.show('arrived',true);feedback.show('battle',true);
 now=1899;feedback.tick();expect(rendered).toEqual(['rejected']);now=1900;feedback.tick();feedback.tick();expect(rendered).toEqual(['rejected','battle']);
});

test('rejection expires back to the prior moving status even if arrival is later',()=>{
 let now=0,text='';const feedback=new StatusFeedback(()=>now,s=>text=s);
 feedback.show('moving');feedback.reject('rejected');now=999;feedback.tick();expect(text).toBe('rejected');
 now=1000;feedback.tick();expect(text).toBe('moving');now=1400;feedback.show('arrived',true);expect(text).toBe('arrived');
});
