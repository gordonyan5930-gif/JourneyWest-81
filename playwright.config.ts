import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'tests/browser',workers:1,forbidOnly:!!process.env.CI,retries:0,
 reporter:[['list'],['json',{outputFile:'reports/browser.json'}],['html',{outputFolder:'playwright-report',open:'never'}]],
 projects:[{name:'render-with-video',use:{video:{mode:'on',size:{width:960,height:650}}}},{name:'render-without-video',testMatch:'**/performance.spec.ts',use:{video:'off'}},{name:'render-canvas-no-video',testMatch:'**/performance.spec.ts',metadata:{renderer:'canvas'},use:{video:'off'}}],
 use:{baseURL:'http://127.0.0.1:5173',viewport:{width:1400,height:950},screenshot:'only-on-failure',trace:'retain-on-failure'},
 webServer:{command:'npm run dev',url:'http://127.0.0.1:5173',reuseExistingServer:!process.env.CI}
});
