import { inferChannelType } from './src/lib/iptv/m3uParser';

const testCases = [
  { name: 'TF1 HD', group: 'FR: CHAINE NATIONALE', url: 'http://server.com/live/tf1.m3u8', expected: 'TV' },
  { name: 'NRJ Radio', group: 'FR: RADIO', url: 'http://server.com/live/nrj.mp3', expected: 'RADIO' },
  { name: 'PPV: UFC 300', group: 'EVENTS', url: 'http://server.com/live/ufc.m3u8', expected: 'DIRECT_EVENT' },
  { name: 'Inception (2010)', group: 'VOD: FILMS', url: 'http://server.com/movie/inception.mp4', expected: 'FILM' },
  { name: 'Game of Thrones S01E01', group: 'SERIES', url: 'http://server.com/series/got/1.mkv', expected: 'SERIES' },
  { name: 'Documentaire: Nature', group: 'DOCUMENTAIRES', url: 'http://server.com/movie/nature.mp4', expected: 'DOCUMENTAIRE' },
  { name: 'Mickey Mouse', group: 'DESSIN ANIME', url: 'http://server.com/movie/mickey.mp4', expected: 'DESSIN_ANIME' },
  { name: 'Cartoon Network', group: 'JEUNESSE', url: 'http://server.com/live/cn.m3u8', expected: 'TV' }, 
  { name: 'Spider-Man Animation', group: 'CARTOON', url: 'http://server.com/series/spiderman/1.mp4', expected: 'SERIES' },
];

console.log('--- TEST ISOLATION LOGIC ---');
let passCount = 0;
testCases.forEach(tc => {
  const result = inferChannelType(tc.name, tc.group, tc.url);
  const pass = result === tc.expected;
  if (pass) passCount++;
  console.log(`[${pass ? 'PASS' : 'FAIL'}] Input: "${tc.name}" | Group: "${tc.group}"`);
  console.log(`       Expected: ${tc.expected} | Got: ${result}`);
});

console.log(`--- Result: ${passCount}/${testCases.length} --- `);
if (passCount !== testCases.length) process.exit(1);
