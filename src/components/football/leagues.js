// ESPN hidden API league slugs — keyless & CORS-friendly.
// Endpoint: https://site.api.espn.com/apis/site/v2/sports/soccer/{slug}/scoreboard
// `cup: true` marks tournaments with a knockout stage — the Table view adds a
// bracket (Round of 32 … Final) below the group/league standings for these.
export const leagues = [
  { slug: 'fifa.world',      name: 'FIFA World Cup',      short: 'World Cup',   emoji: '🏆', cup: true },
  { slug: 'uefa.champions',  name: 'Champions League',    short: 'UCL',         emoji: '⭐', cup: true },
  { slug: 'eng.1',           name: 'Premier League',      short: 'EPL',         emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { slug: 'esp.1',           name: 'LaLiga',              short: 'LaLiga',      emoji: '🇪🇸' },
  { slug: 'ita.1',           name: 'Serie A',             short: 'Serie A',     emoji: '🇮🇹' },
  { slug: 'ger.1',           name: 'Bundesliga',          short: 'Bundesliga',  emoji: '🇩🇪' },
  { slug: 'fra.1',           name: 'Ligue 1',             short: 'Ligue 1',     emoji: '🇫🇷' },
  { slug: 'por.1',           name: 'Primeira Liga',       short: 'Portugal',    emoji: '🇵🇹' },
  { slug: 'ned.1',           name: 'Eredivisie',          short: 'Eredivisie',  emoji: '🇳🇱' },
  { slug: 'usa.1',           name: 'MLS',                 short: 'MLS',         emoji: '🇺🇸' },
]
