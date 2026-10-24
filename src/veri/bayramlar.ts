/**
 * Ramazan ve Kurban bayramlarının birinci günleri, Türkiye için.
 *
 * Kaynak:
 * - 2022-2035: Diyanet İşleri Başkanlığı, "Dini Günler Listesi"
 *   https://vakithesaplama.diyanet.gov.tr/dinigunler.php?yil=2025
 * - 2010-2021: Diyanet takvimi (Basın Yayın ve Enformasyon Genel Müdürlüğü
 *   tablosu ile karşılaştırıldı)
 *
 * Arife ve diğer bayram günleri buradan türetiliyor: arife bir gün önce,
 * Ramazan Bayramı 3 gün, Kurban Bayramı 4 gün.
 *
 * Bayramlar her yıl yaklaşık 11 gün geriye kayıyor, o yüzden bazı yıllarda
 * aynı bayram iki kere geliyor (2033'te iki Ramazan Bayramı var). Tabloyu yıla
 * göre değil, sırayla tutuyoruz.
 */

export const VERI_ILK_YIL = 2010;
export const VERI_SON_YIL = 2035;

export const RAMAZAN_BAYRAMI: readonly string[] = [
  '2010-09-09',
  '2011-08-30',
  '2012-08-19',
  '2013-08-08',
  '2014-07-28',
  '2015-07-17',
  '2016-07-05',
  '2017-06-25',
  '2018-06-15',
  '2019-06-04',
  '2020-05-24',
  '2021-05-13',
  '2022-05-02',
  '2023-04-21',
  '2024-04-10',
  '2025-03-30',
  '2026-03-20',
  '2027-03-09',
  '2028-02-26',
  '2029-02-14',
  '2030-02-04',
  '2031-01-24',
  '2032-01-14',
  '2033-01-02',
  '2033-12-23',
  '2034-12-12',
  '2035-12-01',
];

export const KURBAN_BAYRAMI: readonly string[] = [
  '2010-11-16',
  '2011-11-06',
  '2012-10-25',
  '2013-10-15',
  '2014-10-04',
  '2015-09-24',
  '2016-09-12',
  '2017-09-01',
  '2018-08-21',
  '2019-08-11',
  '2020-07-31',
  '2021-07-20',
  '2022-07-09',
  '2023-06-28',
  '2024-06-16',
  '2025-06-06',
  '2026-05-27',
  '2027-05-16',
  '2028-05-05',
  '2029-04-24',
  '2030-04-13',
  '2031-04-02',
  '2032-03-22',
  '2033-03-11',
  '2034-03-01',
  '2035-02-18',
];

export const BAYRAM_GUN_SAYISI = { ramazan: 3, kurban: 4 } as const;
