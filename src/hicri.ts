/**
 * Tablosal (aritmetik) hicri takvim.
 *
 * Diyanet'in tarihleri astronomik hesaba dayanıyor, bu formül ise 30 yıllık
 * sabit bir döngü kullanıyor. Bu yüzden sonuç gerçek tarihten 1-2 gün
 * sapabilir. Sadece Diyanet'in henüz yayımlamadığı yıllar için, kullanıcı
 * açıkça istediğinde (`tahmini: true`) kullanılıyor.
 */

import { gunNodanTarih, yilOf } from './tarih';

// 1 Muharrem 1 = Julian günü 1948439 (MS 16 Temmuz 622)
const HICRI_BASLANGIC = 1948439;
// 1970-01-01 öğlen = Julian günü 2440588
const UNIX_BASLANGIC = 2440588;

function julianGunu(yil: number, ay: number, gun: number): number {
  return (
    gun +
    Math.ceil(29.5 * (ay - 1)) +
    (yil - 1) * 354 +
    Math.floor((3 + 11 * yil) / 30) +
    HICRI_BASLANGIC -
    1
  );
}

export function hicridenMiladiye(yil: number, ay: number, gun: number): string {
  return gunNodanTarih(julianGunu(yil, ay, gun) - UNIX_BASLANGIC);
}

export interface TahminiBayram {
  tur: 'ramazan' | 'kurban';
  baslangic: string;
}

/** Verilen miladi yıl ve komşu yıllara düşen bayramların tahmini ilk günleri. */
export function tahminiBayramlar(yil: number): TahminiBayram[] {
  const ortaHicriYil = Math.floor(((yil - 622) * 33) / 32);
  const sonuc: TahminiBayram[] = [];
  for (let h = ortaHicriYil - 2; h <= ortaHicriYil + 2; h++) {
    sonuc.push({ tur: 'ramazan', baslangic: hicridenMiladiye(h, 10, 1) });
    sonuc.push({ tur: 'kurban', baslangic: hicridenMiladiye(h, 12, 10) });
  }
  return sonuc
    .filter((b) => Math.abs(yilOf(b.baslangic) - yil) <= 1)
    .sort((a, b) => (a.baslangic < b.baslangic ? -1 : 1));
}
