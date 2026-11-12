# Google Play Data safety — answers for NextGleis

Draft for the Play Console form (roadmap 0.5). The developer is responsible
for the final answers; re-check after any change to what the app sends.
Source for the `expo-observe` rows:
https://docs.expo.dev/eas/observe/reference/store-privacy-declarations/

## Data collection and security

| Question | Answer |
| --- | --- |
| Does the app collect or share any of the required user data types? | Yes |
| Is all collected data encrypted in transit? | Yes (HTTPS only) |
| Can users request deletion? | No account or stored user record exists; diagnostics are deleted by Expo after 90–120 days. Answer per Google's current wording. |

## Data types

| Data type | Why | Collected / shared | Ephemeral | Required / optional | Purpose |
| --- | --- | --- | --- | --- | --- |
| App info and performance → Crash logs | `expo-observe` error reports | Collected | No | Optional (Settings → Privacy switch) | Analytics |
| App info and performance → Diagnostics | `expo-observe` startup timings | Collected | No | Optional | Analytics |
| Device or other IDs | `expo-observe` random installation ID | Collected | No | Optional | Analytics |
| Location → Approximate location | (1) country derived from IP by Expo; (2) position rounded to ~100 m sent to the NextGleis backend for "Nearby", not stored | Collected | (1) No; (2) Yes | Optional | (1) Analytics; (2) App functionality |

Not collected: name, email, contacts, precise location, search history,
app interactions (the navigation integration and custom events are off).

"Collected", not "shared": Expo acts as a service provider.
