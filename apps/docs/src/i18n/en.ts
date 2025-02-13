export default {
  locale: 'en-US',
  lastUpdated: {
    prefix: 'Updated',
    today: 'today',
    yesterday: 'yesterday',
    days: ({ days }) => `${days} days ago`,
    months: ({ months }) => `${months} months ago`,
    years: ({ years }) => `${years} years ago`,
    recently: 'recently',
    avatarAlt: ({ author }) => `${author}'s avatar`,
    byLine: ({ author }) => `by ${author}`,
  },
  suggestions: {
    count: ({ count }) => `${count} suggestion${count === 1 ? '' : 's'}`,
    none: 'No suggestions',
    byLine: ({ author }) => `by ${author}`,
  },
  status: {
    verified: 'Code verified',
  },
};
