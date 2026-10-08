import type { Messages } from './en';

function plural(count: number, one: string, other: string): string {
  return count === 1 ? one : other;
}

// German uses a decimal comma and a space before units.
function decimal(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

export const de: Messages = {
  // Tabs
  'tabs.home': 'Start',
  'tabs.search': 'Suche',
  'tabs.routes': 'Routen',
  'tabs.settings': 'Einstellungen',

  // Shared
  'common.offline': 'Du bist offline',
  'common.pullToRetry': 'Zum Aktualisieren nach unten ziehen und erneut versuchen.',
  'common.cancel': 'Abbrechen',
  'common.minutes': (minutes) => `${minutes} Min.`,
  'common.duration': (hours, minutes) =>
    hours === 0
      ? `${minutes} Min.`
      : minutes === 0
        ? `${hours} Std.`
        : `${hours} Std. ${minutes} Min.`,
  'common.distance': (metres) => (metres < 1000 ? `${metres} m` : `${decimal(metres / 1000)} km`),

  // Home
  'home.subtitle': 'Deine Abfahrten und Routen, nur einen Tipp entfernt',
  'home.stations': 'Haltestellen',
  'home.routes': 'Routen',
  'home.noStations': 'Noch keine Haltestellen',
  'home.noStationsMessage':
    'Such eine Haltestelle und markiere sie mit dem Stern, um ihre Abfahrten direkt zu öffnen.',
  'home.noRoutes': 'Noch keine Routen',
  'home.noRoutesMessage':
    'Such eine Verbindung im Tab „Routen“ und tippe auf den Stern, um sie hier zu speichern.',

  // Nearby
  'nearby.title': 'In der Nähe',
  'nearby.askTitle': 'Haltestellen in deiner Nähe',
  'nearby.askMessage':
    'Erlaube den Standortzugriff, dann zeigt NextGleis die Haltestellen, die du schnell zu Fuß erreichst.',
  'nearby.askButton': 'Standort verwenden',
  'nearby.deniedTitle': 'Standortzugriff ist aus',
  'nearby.deniedMessage':
    'Schalte ihn in den Systemeinstellungen ein, um Haltestellen in deiner Nähe zu sehen.',
  'nearby.openSettings': 'Einstellungen öffnen',
  'nearby.error': 'Haltestellen in deiner Nähe konnten nicht geladen werden.',
  'nearby.retry': 'Erneut versuchen',
  'nearby.empty': 'Keine Haltestelle in Fußnähe.',
  'nearby.itemLabel': (name, distance) => `Abfahrten für ${name} anzeigen, ${distance} entfernt`,

  // Search
  'search.title': 'Suche',
  'search.placeholder': 'Haltestelle, z. B. Frankfurt Hbf',
  'search.label': 'Haltestellensuche',
  'search.clear': 'Suche löschen',
  'search.idleTitle': 'Haltestelle finden',
  'search.idleMessage':
    'Gib mindestens zwei Buchstaben einer Haltestelle ein, um ihre Abfahrten zu sehen.',
  'search.offlineMessage': 'Verbinde dich mit dem Internet, um Haltestellen zu suchen.',
  'search.errorTitle': 'Etwas ist schiefgelaufen',
  'search.errorMessage':
    'Die Ergebnisse konnten nicht geladen werden. Prüf deine Verbindung und versuch es erneut.',
  'search.noMatches': 'Keine Treffer',
  'search.noMatchesMessage': (query) =>
    `Nichts gefunden für „${query}“. Versuch eine andere Schreibweise.`,
  'search.itemLabel': (name) => `Abfahrten für ${name} anzeigen`,

  // Board
  'board.fallbackTitle': 'Haltestelle',
  'board.addFavorite': (name) => `${name} zu Favoriten hinzufügen`,
  'board.removeFavorite': (name) => `${name} aus Favoriten entfernen`,
  'board.showLine': (line) => `Linie ${line} einblenden`,
  'board.hideLine': (line) => `Linie ${line} ausblenden`,
  'board.offlineLoading': 'Verbinde dich mit dem Internet, um die Abfahrten zu laden.',
  'board.offlineStale': 'Die Abfahrten werden aktualisiert, sobald du wieder online bist.',
  'board.offlineStaleArrivals': 'Die Ankünfte werden aktualisiert, sobald du wieder online bist.',
  'board.error': 'Abfahrten konnten nicht geladen werden',
  'board.filteredTitle': 'Alles ausgeblendet',
  'board.filteredMessage': 'Tippe oben auf eine Linie, um ihre Abfahrten wieder einzublenden.',
  'board.emptyTitle': 'Keine Abfahrten',
  'board.emptyMessage': 'In den nächsten Stunden fährt hier nichts ab.',
  'board.emptyMessageArrivals': 'In den nächsten Stunden kommt hier nichts an.',
  'board.disruptions': (count) =>
    `${count} ${plural(count, 'Störungsmeldung', 'Störungsmeldungen')}`,
  'board.showNotices': 'Störungsmeldungen anzeigen',
  'board.hideNotices': 'Störungsmeldungen ausblenden',
  'board.loading': 'Abfahrten werden geladen',
  'board.loadingArrivals': 'Ankünfte werden geladen',
  'board.departures': 'Abfahrten',
  'board.arrivals': 'Ankünfte',
  'board.modeLabel': 'Abfahrten oder Ankünfte',

  // Departures and journeys
  'departure.unknownDirection': 'Richtung unbekannt',
  'departure.unknownOrigin': 'Herkunft unbekannt',
  'departure.unlabelledLine': 'Linie ohne Bezeichnung',
  'departure.platform': (platform) => `Gleis ${platform}`,
  'departure.platformShort': (platform) => `Gl. ${platform}`,
  'departure.platformChanged': (platform, planned) =>
    `Gleiswechsel auf ${platform}, geplant war ${planned}`,
  'departure.to': (direction) => `nach ${direction}`,
  'departure.from': (origin) => `von ${origin}`,
  'departure.departs': (time) => `Abfahrt ${time}`,
  'departure.arrives': (time) => `Ankunft ${time}`,
  'departure.delayedBy': (minutes) => `${minutes} Minuten verspätet`,
  'status.onTime': 'Pünktlich',
  'status.cancelled': 'Fällt aus',
  'status.delayed': (minutes) => `+${minutes} Min.`,

  'service.db': 'DB',
  'service.rail': 'Zug',
  'service.transit': 'Nahverkehr',
  'service.dbDescription': 'Zug der Deutschen Bahn',
  'service.railDescription': 'Zug',
  'service.transitDescription': 'Nahverkehr',

  'journey.direct': 'Direkt',
  'journey.changes': (count) => `${count} ${plural(count, 'Umstieg', 'Umstiege')}`,
  'journey.walk': (minutes, place) =>
    place ? `${minutes} Min. Fußweg nach ${place}` : `${minutes} Min. Fußweg`,
  'journey.change': (place) => (place ? `Umstieg in ${place}` : 'Umstieg'),
  'journey.summary': (departure, arrival) => `Abfahrt ${departure}, Ankunft ${arrival}`,
  'journey.departureDelayed': (minutes) => `Abfahrt ${minutes} Minuten verspätet`,
  'journey.then': ', dann ',
  'journey.hasNotices': 'mit Störungsmeldungen',
  'journey.expandHint': 'Zeigt die einzelnen Abschnitte dieser Verbindung',
  'journey.collapseHint': 'Blendet die Abschnitte dieser Verbindung aus',

  // Routes
  'routes.title': 'Routen',
  'routes.from': 'Von',
  'routes.to': 'Nach',
  'routes.fromPlaceholder': 'Wo startest du?',
  'routes.toPlaceholder': 'Wohin willst du?',
  'routes.fromRole': 'Start',
  'routes.toRole': 'Ziel',
  'routes.swap': 'Start und Ziel tauschen',
  'routes.save': 'Route zu Favoriten hinzufügen',
  'routes.unsave': 'Route aus Favoriten entfernen',
  'routes.searchLabel': (role) => `Haltestelle für ${role} suchen`,
  'routes.chooseStart': 'Start wählen',
  'routes.chooseDestination': 'Ziel wählen',
  'routes.idleMessage': 'Gib mindestens zwei Buchstaben einer Haltestelle ein.',
  'routes.chooseAs': (name, role) => `${name} als ${role} wählen`,
  'routes.endLabel': (title, name) => `${title} ${name}. Zum Ändern tippen.`,
  'routes.chooseEnd': (role) => `${role} wählen`,
  'routes.planTitle': 'Fahrt planen',
  'routes.planMessage':
    'Wähle Start und Ziel, um Verbindungen mit Zug, Bus und Straßenbahn zu sehen.',
  'routes.sameStopTitle': 'Zweimal dieselbe Haltestelle',
  'routes.sameStopMessage': 'Wähle ein anderes Ziel, um eine Route zu finden.',
  'routes.offlineLoading': 'Verbinde dich mit dem Internet, um Routen zu finden.',
  'routes.offlineStale': 'Die Routen werden aktualisiert, sobald du wieder online bist.',
  'routes.error': 'Routen konnten nicht geladen werden',
  'routes.emptyTitle': 'Keine Verbindungen gefunden',
  'routes.emptyMessage':
    'Zwischen diesen Haltestellen fährt bald nichts. Versuch eine Haltestelle in der Nähe.',

  // Favorites
  'favorites.linesHidden': (count) => `${count} ${plural(count, 'Linie', 'Linien')} ausgeblendet`,
  'favorites.openBoard': (name) => `Abfahrten für ${name} öffnen`,
  'favorites.routeLabel': (from, to) => `${from} nach ${to}`,
  'favorites.openRoute': (route) => `Verbindungen von ${route} suchen`,
  'favorites.moveUp': (name) => `${name} nach oben verschieben`,
  'favorites.moveDown': (name) => `${name} nach unten verschieben`,
  'favorites.remove': (name) => `${name} aus Favoriten entfernen`,

  // Settings
  'settings.title': 'Einstellungen',
  'settings.appearance': 'Darstellung',
  'settings.themeSystem': 'System',
  'settings.themeLight': 'Hell',
  'settings.themeDark': 'Dunkel',
  'settings.language': 'Sprache',
  'settings.languageSystem': 'System',
  'settings.dataSources': 'Datenquellen',
  'settings.dataSourcesHafas': (networks) =>
    `Abfahrten und Routen stammen aus den Fahrplanauskünften deutscher Verkehrsverbünde — ${networks} — über die Open-Source-Bibliothek hafas-client. Die Fahrplandaten gehören diesen Verbünden und ihren Verkehrsunternehmen.`,
  'settings.dataSourcesDb':
    'Haltestellen, die in älteren Versionen der App gespeichert wurden, können auf Daten der Deutschen Bahn AG / DB InfraGO AG aus dem Produkt „Timetables“ des DB API Marketplace zurückgreifen, lizenziert unter Creative Commons Namensnennung 4.0 (CC BY 4.0).',
  'settings.license': 'Lizenz CC BY 4.0',
  'settings.dbTerms': 'Nutzungsbedingungen der DB',
  'settings.privacy': 'Datenschutz',
  'settings.privacyText':
    'Du brauchst kein Konto. Favorisierte Haltestellen, Routen und Einstellungen werden nur auf diesem Gerät gespeichert. Wenn du „In der Nähe“ nutzt, wird dein Standort einmalig an den NextGleis-Server gesendet, um Haltestellen zu finden, und nicht gespeichert.',
  'settings.privacyPolicy': 'Datenschutzerklärung',

  // Onboarding
  'onboarding.title': 'Willkommen bei NextGleis',
  'onboarding.subtitle': 'Live-Abfahrten für Bus, Straßenbahn und Bahn in ganz Deutschland.',
  'onboarding.boardsTitle': 'Live-Abfahrten',
  'onboarding.boardsText': 'Verspätungen, Gleiswechsel und Störungen in Echtzeit.',
  'onboarding.filterTitle': 'Nur deine Linien',
  'onboarding.filterText':
    'Blende Linien aus, die du nie nimmst, und markiere deine Haltestellen mit dem Stern.',
  'onboarding.routesTitle': 'Routen',
  'onboarding.routesText': 'Verbindungen von Tür zu Tür, mit jedem Umstieg.',
  'onboarding.locationTitle': 'Starte mit den Haltestellen in deiner Nähe',
  'onboarding.locationText':
    'NextGleis kann dir die Haltestellen in Fußnähe zeigen. Dein Standort wird nur dafür verwendet und nie gespeichert.',
  'onboarding.useLocation': 'Standort verwenden',
  'onboarding.skip': 'Später',

  // Not found
  'notFound.title': 'Nicht gefunden',
  'notFound.heading': 'Diese Seite gibt es nicht',
  'notFound.message': 'Der Link führt zu etwas, das es in NextGleis nicht gibt.',
  'notFound.home': 'Zur Startseite',
};
