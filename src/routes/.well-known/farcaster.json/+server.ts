import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = ({ url }) => json({
  miniapp: {
    version: '1',
    name: 'ZAOstock Live Command',
    homeUrl: url.origin,
    iconUrl: `${url.origin}/icon-1024.png`,
    splashImageUrl: `${url.origin}/icon-1024.png`,
    splashBackgroundColor: '#F2E6D3',
    subtitle: 'The festival nervous system',
    description: 'Live event state, WaveWarZ, crew coordination, rehearsal, and recovery for ZAOstock.',
    screenshotUrls: [
      `${url.origin}/screenshot-command.png`,
      `${url.origin}/screenshot-crowd.png`,
      `${url.origin}/screenshot-crew.png`
    ],
    primaryCategory: 'social',
    tags: ['events', 'music', 'community', 'coordination', 'wavewarz'],
    heroImageUrl: `${url.origin}/social-card.png`,
    tagline: 'Break it before the crowd arrives.',
    ogTitle: 'ZAOstock Live Command',
    ogDescription: 'A living command surface for stage, crew, WaveWarZ, and event recovery.',
    ogImageUrl: `${url.origin}/social-card.png`,
    canonicalDomain: url.host
  }
});

