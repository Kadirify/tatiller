/**
 * Her yıl aynı güne denk gelen tatiller.
 *
 * Dayanak: 2429 sayılı Ulusal Bayram ve Genel Tatiller Hakkında Kanun.
 * - Madde 1: Ulusal bayram 29 Ekim'dir, 28 Ekim saat 13.00'te başlar.
 * - Madde 2: Genel tatiller. 1 Mayıs 5892 sayılı Kanunla (RG 27.04.2009),
 *   15 Temmuz 6752 sayılı Kanunla (RG 29.10.2016) eklendi.
 *
 * Hafta sonuna denk gelen tatil Türkiye'de başka güne kaydırılmaz.
 */

export type Kategori = 'ulusal' | 'genel' | 'dini' | 'idari';

export interface SabitTatil {
  kod: string;
  ay: number;
  gun: number;
  ad: string;
  adEn: string;
  kategori: Kategori;
  /** Sadece öğleden sonrası tatil olan günler (13.00'ten itibaren). */
  yarimGun?: boolean;
  /** Kanuna giriş yılı. Bu yıldan önce tatil değildi. */
  ilkYil?: number;
}

export const SABIT_TATILLER: readonly SabitTatil[] = [
  {
    kod: 'yilbasi',
    ay: 1,
    gun: 1,
    ad: 'Yılbaşı',
    adEn: "New Year's Day",
    kategori: 'genel',
  },
  {
    kod: 'ulusal-egemenlik',
    ay: 4,
    gun: 23,
    ad: 'Ulusal Egemenlik ve Çocuk Bayramı',
    adEn: "National Sovereignty and Children's Day",
    kategori: 'genel',
  },
  {
    kod: 'emek-ve-dayanisma',
    ay: 5,
    gun: 1,
    ad: 'Emek ve Dayanışma Günü',
    adEn: 'Labour and Solidarity Day',
    kategori: 'genel',
    ilkYil: 2009,
  },
  {
    kod: 'genclik-ve-spor',
    ay: 5,
    gun: 19,
    ad: "Atatürk'ü Anma, Gençlik ve Spor Bayramı",
    adEn: 'Commemoration of Atatürk, Youth and Sports Day',
    kategori: 'genel',
  },
  {
    kod: 'demokrasi-ve-milli-birlik',
    ay: 7,
    gun: 15,
    ad: 'Demokrasi ve Millî Birlik Günü',
    adEn: 'Democracy and National Unity Day',
    kategori: 'genel',
    ilkYil: 2017,
  },
  {
    kod: 'zafer',
    ay: 8,
    gun: 30,
    ad: 'Zafer Bayramı',
    adEn: 'Victory Day',
    kategori: 'genel',
  },
  {
    kod: 'cumhuriyet-arife',
    ay: 10,
    gun: 28,
    ad: 'Cumhuriyet Bayramı Arifesi',
    adEn: 'Republic Day Eve',
    kategori: 'ulusal',
    yarimGun: true,
  },
  {
    kod: 'cumhuriyet',
    ay: 10,
    gun: 29,
    ad: 'Cumhuriyet Bayramı',
    adEn: 'Republic Day',
    kategori: 'ulusal',
  },
];
