// English strings. The German catalog (de.ts) is typed against this one, so a
// key added here without a translation fails the typecheck.
//
// Strings that take values are functions; everything else is plain text.

function plural(count: number, one: string, other: string): string {
  return count === 1 ? one : other;
}

export const en = {
  // Tabs
  'tabs.home': 'Home',
  'tabs.search': 'Search',
  'tabs.routes': 'Routes',
  'tabs.settings': 'Settings',

  // Shared
  'common.offline': "You're offline",
  'common.pullToRetry': 'Pull down to refresh and try again.',
  'common.cancel': 'Cancel',
  'common.minutes': (minutes: number) => `${minutes} min`,
  'common.duration': (hours: number, minutes: number) =>
    hours === 0 ? `${minutes} min` : minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`,
  'common.distance': (metres: number) =>
    metres < 1000 ? `${metres} m` : `${(metres / 1000).toFixed(1)} km`,

  // Home
  'home.subtitle': 'Your boards and routes, one tap away',
  'home.stations': 'Stations',
  'home.routes': 'Routes',
  'home.noStations': 'No stations yet',
  'home.noStationsMessage': 'Search for a stop and star it to get one-tap access to its board.',
  'home.noRoutes': 'No routes yet',
  'home.noRoutesMessage': 'Find a route in the Routes tab and tap the star to save it here.',

  // Nearby
  'nearby.title': 'Nearby',
  'nearby.askTitle': 'See the stops around you',
  'nearby.askMessage': 'Allow location access and NextGleis lists the stops within a short walk.',
  'nearby.askButton': 'Use my location',
  'nearby.deniedTitle': 'Location access is off',
  'nearby.deniedMessage': 'Turn it on in your system settings to see the stops near you.',
  'nearby.openSettings': 'Open settings',
  'nearby.error': 'Could not find stops near you.',
  'nearby.retry': 'Try again',
  'nearby.empty': 'No stops within a short walk.',
  'nearby.itemLabel': (name: string, distance: string) =>
    `View departures for ${name}, ${distance} away`,

  // Search
  'search.title': 'Search',
  'search.placeholder': 'Stop or station, e.g. Frankfurt Hbf',
  'search.label': 'Stop or station search',
  'search.clear': 'Clear search',
  'search.idleTitle': 'Find a stop',
  'search.idleMessage':
    'Type at least two letters of a stop or station name to see its departures.',
  'search.offlineMessage': 'Connect to the internet to search for stops.',
  'search.errorTitle': 'Something went wrong',
  'search.errorMessage': 'Could not load results. Check your connection and try again.',
  'search.noMatches': 'No matches',
  'search.noMatchesMessage': (query: string) =>
    `Nothing matched "${query}". Try a different spelling.`,
  'search.itemLabel': (name: string) => `View departures for ${name}`,

  // Board
  'board.fallbackTitle': 'Station',
  'board.addFavorite': (name: string) => `Add ${name} to favorites`,
  'board.removeFavorite': (name: string) => `Remove ${name} from favorites`,
  'board.showLine': (line: string) => `Show line ${line}`,
  'board.hideLine': (line: string) => `Hide line ${line}`,
  'board.offlineLoading': 'Connect to the internet to load this board.',
  'board.offlineStale': "Departures will update once you're back online.",
  'board.offlineStaleArrivals': "Arrivals will update once you're back online.",
  'board.error': 'Could not load this board',
  'board.filteredTitle': 'Everything is filtered out',
  'board.filteredMessage': 'Tap a line above to bring its departures back.',
  'board.emptyTitle': 'Nothing scheduled',
  'board.emptyMessage': 'No departures from this stop in the next couple of hours.',
  'board.emptyMessageArrivals': 'No arrivals at this stop in the next couple of hours.',
  'board.disruptions': (count: number) =>
    `${count} ${plural(count, 'disruption notice', 'disruption notices')}`,
  'board.showNotices': 'Show disruption notices',
  'board.hideNotices': 'Hide disruption notices',
  'board.loading': 'Loading departures',
  'board.loadingArrivals': 'Loading arrivals',
  'board.departures': 'Departures',
  'board.arrivals': 'Arrivals',
  'board.modeLabel': 'Departures or arrivals',

  // Departures and journeys
  'departure.unknownDirection': 'Unknown direction',
  'departure.unknownOrigin': 'Unknown origin',
  'departure.unlabelledLine': 'Unlabelled line',
  'departure.platform': (platform: string) => `Platform ${platform}`,
  'departure.platformShort': (platform: string) => `Pl. ${platform}`,
  'departure.platformChanged': (platform: string, planned: string) =>
    `platform changed to ${platform}, was ${planned}`,
  'departure.to': (direction: string) => `to ${direction}`,
  'departure.from': (origin: string) => `from ${origin}`,
  'departure.departs': (time: string) => `departs ${time}`,
  'departure.arrives': (time: string) => `arrives ${time}`,
  'departure.delayedBy': (minutes: number) => `delayed ${minutes} minutes`,
  'status.onTime': 'On time',
  'status.cancelled': 'Cancelled',
  'status.delayed': (minutes: number) => `+${minutes} min`,

  'service.db': 'DB',
  'service.rail': 'Train',
  'service.transit': 'Local',
  'service.dbDescription': 'Deutsche Bahn train',
  'service.railDescription': 'train',
  'service.transitDescription': 'local public transport',

  'journey.direct': 'Direct',
  'journey.changes': (count: number) => `${count} ${plural(count, 'change', 'changes')}`,
  'journey.walk': (minutes: number, place: string | null) =>
    place ? `Walk ${minutes} min to ${place}` : `Walk ${minutes} min`,
  'journey.change': (place: string | null) => (place ? `Change to ${place}` : 'Change'),
  'journey.summary': (departure: string, arrival: string) =>
    `Departs ${departure}, arrives ${arrival}`,
  'journey.departureDelayed': (minutes: number) => `departure delayed ${minutes} minutes`,
  'journey.then': ', then ',
  'journey.hasNotices': 'has disruption notices',
  'journey.expandHint': 'Shows each leg of this connection',
  'journey.collapseHint': 'Hides the legs of this connection',

  // Routes
  'routes.title': 'Routes',
  'routes.from': 'From',
  'routes.to': 'To',
  'routes.fromPlaceholder': 'Where are you starting?',
  'routes.toPlaceholder': 'Where are you going?',
  'routes.fromRole': 'start',
  'routes.toRole': 'destination',
  'routes.swap': 'Swap start and destination',
  'routes.save': 'Save route to favorites',
  'routes.unsave': 'Remove route from favorites',
  'routes.searchLabel': (role: string) => `Search for the ${role} stop`,
  'routes.chooseStart': 'Choose a start',
  'routes.chooseDestination': 'Choose a destination',
  'routes.idleMessage': 'Type at least two letters of a stop or station name.',
  'routes.chooseAs': (name: string, role: string) => `Choose ${name} as ${role}`,
  'routes.endLabel': (title: string, name: string) => `${title} ${name}. Tap to change.`,
  'routes.chooseEnd': (role: string) => `Choose ${role}`,
  'routes.planTitle': 'Plan a trip',
  'routes.planMessage':
    "Choose where you start and where you're going to see connections by train, bus, and tram.",
  'routes.sameStopTitle': 'Same stop twice',
  'routes.sameStopMessage': 'Pick a different destination to find a route.',
  'routes.offlineLoading': 'Connect to the internet to find routes.',
  'routes.offlineStale': "Routes will update once you're back online.",
  'routes.error': 'Could not find routes',
  'routes.emptyTitle': 'No connections found',
  'routes.emptyMessage': 'Nothing runs between these stops soon. Try a stop nearby.',

  // Favorites
  'favorites.linesHidden': (count: number) => `${count} ${plural(count, 'line', 'lines')} hidden`,
  'favorites.openBoard': (name: string) => `Open departure board for ${name}`,
  'favorites.routeLabel': (from: string, to: string) => `${from} to ${to}`,
  'favorites.openRoute': (route: string) => `Find routes from ${route}`,
  'favorites.moveUp': (name: string) => `Move ${name} up`,
  'favorites.moveDown': (name: string) => `Move ${name} down`,
  'favorites.remove': (name: string) => `Remove ${name} from favorites`,

  // Settings
  'settings.title': 'Settings',
  'settings.appearance': 'Appearance',
  'settings.themeSystem': 'System',
  'settings.themeLight': 'Light',
  'settings.themeDark': 'Dark',
  'settings.language': 'Language',
  'settings.languageSystem': 'System',
  'settings.dataSources': 'Data sources',
  'settings.dataSourcesHafas': (networks: string) =>
    `Departures and routes come from the journey planners of German transport networks — ${networks} — through the open-source hafas-client library. The timetable data belongs to those networks and their operators.`,
  'settings.dataSourcesDb':
    'Stations saved in earlier versions of the app may fall back to data from Deutsche Bahn AG / DB InfraGO AG via the DB API Marketplace "Timetables" product, licensed under Creative Commons Attribution 4.0 (CC BY 4.0).',
  'settings.license': 'CC BY 4.0 license',
  'settings.dbTerms': 'DB terms of use',
  'settings.privacy': 'Privacy',
  'settings.privacyText':
    'No account is required. Favorite stations, favorite routes, and preferences are stored only on this device. If you use "Nearby", your location is sent to the NextGleis server once to find stops and is not stored.',
  'settings.privacyPolicy': 'Privacy policy',

  // Onboarding
  'onboarding.title': 'Welcome to NextGleis',
  'onboarding.subtitle': 'Live departures for buses, trams and trains across Germany.',
  'onboarding.boardsTitle': 'Live boards',
  'onboarding.boardsText': 'Delays, platform changes and disruptions as they happen.',
  'onboarding.filterTitle': 'Only your lines',
  'onboarding.filterText': 'Hide the lines you never take and star the stops you use.',
  'onboarding.routesTitle': 'Routes',
  'onboarding.routesText': 'Connections from door to door, with every change.',
  'onboarding.locationTitle': 'Start with the stops near you',
  'onboarding.locationText':
    'NextGleis can show the stops within a short walk. Your location is only used for that and is never stored.',
  'onboarding.useLocation': 'Use my location',
  'onboarding.skip': 'Not now',

  // Not found
  'notFound.title': 'Not found',
  'notFound.heading': "This screen doesn't exist",
  'notFound.message': "The link you followed points somewhere NextGleis doesn't have.",
  'notFound.home': 'Go to the home screen',
};

export type Messages = typeof en;
