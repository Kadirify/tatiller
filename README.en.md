# tatiller

Public holidays in Türkiye, Ramadan and Sacrifice feasts, business day math and bridge days.
Based on official Diyanet data, zero dependencies, fully typed.

[Türkçe](README.md)

```js
import { tatiller, isGunuEkle, kopruler } from 'tatiller';

tatiller(2026);                // all holidays of 2026
isGunuEkle('2026-03-18', 5);   // '2026-03-26', skips Eid and the weekend
kopruler(2027);                // take 2 days off, get 9 days of Eid al-Adha
```

The API is in Turkish, because the people who need this the most are Turkish developers.
Every holiday object has an English name (`adEn`) and the CLI and `.ics` export accept `--en` / `dil: 'en'`.

## Why

Turkish holidays are trickier than they look:

- Eid dates move about 11 days every year and come from the Diyanet calendar, which
  sometimes differs by a day from generic Hijri converters.
- Holiday eves (arife) and 28 October are half days, off from 13:00.
- Two holidays can fall on the same day (23 April 2023 was also the third day of Eid al-Fitr).
- 2033 has two Eid al-Fitr holidays.
- The government often adds "administrative leave" days for public employees only.
- Holidays on weekends are not moved to Monday.

## Install

```
npm install tatiller
```

## Cheat sheet

| Function | What it does |
|---|---|
| `tatiller(year)` | All holidays of a year, sorted |
| `bayramlar(year)` | Eid al-Fitr and Eid al-Adha with eve, first and last day |
| `tatilMi(date)` / `tatilBul(date)` | Is it a holiday / which one |
| `gunBilgisi(date)` | Weekday, weekend, holidays, full or half day |
| `sonrakiTatil(date)` / `oncekiTatil(date)` | Next / previous holiday |
| `tatilAraligi(from, to)` | Holidays between two dates |
| `isGunuMu(date)` | Is it a business day |
| `isGunuEkle(date, n)` | Add (or subtract) n business days |
| `isGunuSay(from, to)` | Count business days (start excluded, end included) |
| `isGunleri(from, to)` | List business days |
| `ayOzeti(year, month)` | Business days in a month, half days counted as 0.5 |
| `kopruler(year)` | Days to take off for the longest breaks |
| `ics(years)` | iCalendar file for Google Calendar, Outlook, Apple Calendar |

Dates can be `'YYYY-MM-DD'` strings or `Date` objects. Dates are always interpreted in
the `Europe/Istanbul` time zone, so a server running in UTC gets the right day.

Business day functions accept these options:

```js
{
  haftaSonu: [6, 0],       // weekend days, 0 = Sunday. [0] for a six day week
  yarimGun: 'isGunu',      // half days count as business days ('tatil' to count them as off)
  idariIzin: false,        // include administrative leave (public sector)
  ekTatiller: [],          // extra closed days
  ekIsGunleri: [],         // extra working days (overrides everything)
}
```

## CLI

```
npx tatiller 2026 --en
npx tatiller isgunu 2026-03-18 5
npx tatiller kopru 2027
npx tatiller ics 2026 2027 --en > holidays.ics
```

## Data

- Fixed holidays: Law No. 2429 on National Holidays and General Vacations.
- Eid dates 2010-2035: Diyanet (Presidency of Religious Affairs).
- After 2035: optional estimate with the tabular Hijri calendar (`{ tahmini: true }`),
  marked as `tahmini: true`, may be off by 1-2 days.
- Administrative leave: only days confirmed by at least two sources, from 2024.

Details and sources: [docs/veri.md](docs/veri.md) (Turkish).

## License

MIT
