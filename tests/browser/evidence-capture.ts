import type {Page} from '@playwright/test';
// Successful historical movies are not re-collected. All logical assertions run.
export function acceptanceVideo(scope='historical'):'on'|'off'{return process.env.CAPTURE_FULL_EVIDENCE==='true'&&['motion','strategy','experiment'].includes(scope)?'on':'off';}
export async function reviewScreenshot(page:Page,options:Parameters<Page['screenshot']>[0]){if(process.env.CAPTURE_FULL_EVIDENCE==='true'&&/reports\/(motion-|strategy-|movement-|ranged-counter-|ranged-unprotected-)/.test(String(options?.path??'')))return page.screenshot(options);}
