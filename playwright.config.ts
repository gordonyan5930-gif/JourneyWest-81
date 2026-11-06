import {acceptanceVideo} from './tests/browser/evidence-capture';
import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'tests/browser',workers:1,forbidOnly:!!process.env.CI,retries:0,
 reporter:[['list'],['json',{outputFile:'reports/browser.json'}],['html',{outputFolder:'playwright-report',open:'never'}]],
 projects:[{name:'strategy-first',testMatch:['**/strategy-choices.spec.ts','**/motion-hud.spec.ts','**/motion-comparison.spec.ts'],use:{video:{mode:acceptanceVideo('motion'),size:{width:1252,height:562}}}},{name:'render-with-video',dependencies:['strategy-first'],testIgnore:['**/movement-roundtrip.spec.ts','**/strategy-choices.spec.ts','**/motion-hud.spec.ts','**/motion-comparison.spec.ts'],use:{video:{mode:acceptanceVideo('experiment'),size:{width:960,height:650}}}},{name:'render-without-video',dependencies:['strategy-first'],testMatch:['**/performance.spec.ts','**/quality-sample.spec.ts','**/quality-experiment.spec.ts'],use:{video:'off'}},{name:'render-canvas-no-video',dependencies:['strategy-first'],testMatch:['**/performance.spec.ts','**/quality-sample.spec.ts','**/quality-experiment.spec.ts','**/movement-roundtrip.spec.ts','**/escort-loop.spec.ts'],metadata:{renderer:'canvas'},use:{video:'off'}}],
 use:{baseURL:'http://127.0.0.1:5173',viewport:{width:1400,height:950},screenshot:'only-on-failure',trace:{mode:'retain-on-failure',screenshots:false,snapshots:true,sources:true}},
 webServer:{command:'npm run dev',url:'http://127.0.0.1:5173',reuseExistingServer:!process.env.CI}
});
