/**
 * Köprü günleri: birkaç gün izin alarak tatili uzatma fırsatları.
 *
 * Takvimi "kapalı bloklar" (hafta sonu + tam gün tatiller) olarak düşünüyoruz.
 * İki blok arasındaki iş günleri az ise, o günlerde izin alınca iki blok
 * birleşip uzun bir tatil oluyor. Arife gibi yarım günler yarım izin sayılıyor.
 */

import { calismaOrani, hazirla, type IsGunuSecenekleri } from './isgunu';
import { gununTatilleri } from './tatiller';
import { gunEkle, gunNo, tarihOlustur, yilOf } from './tarih';

export interface KopruSecenekleri extends IsGunuSecenekleri {
  /** En fazla kaç gün izin alınabilir. Yarım günler 0,5 sayılır. Varsayılan: 2 */
  enFazlaIzin?: number;
}

export interface Kopru {
  izinGunleri: string[];
  /** Gün cinsinden toplam izin (arife yarım gün = 0,5). */
  izin: number;
  baslangic: string;
  bitis: string;
  /** Hafta sonları dahil toplam tatil günü. */
  toplamGun: number;
  tatiller: string[];
}

interface Blok {
  ilk: string;
  son: string;
}

function tabanAd(ad: string): string {
  return ad.replace(/ \d\. Gün$/, '').replace(/ Arifesi$/, '');
}

/**
 * Yılın köprü fırsatları, tarihe göre sıralı.
 */
export function kopruler(yil: number, secenekler: KopruSecenekleri = {}): Kopru[] {
  const enFazla = secenekler.enFazlaIzin ?? 2;
  if (!(enFazla > 0) || enFazla > 10) {
    throw new RangeError(`enFazlaIzin 0 ile 10 arasında olmalı, gelen: ${enFazla}`);
  }
  const k = hazirla(secenekler);

  // Yıl sınırındaki köprüleri de yakalamak için iki hafta pay bırakıyoruz.
  const ilk = gunEkle(tarihOlustur(yil, 1, 1), -14);
  const son = gunEkle(tarihOlustur(yil, 12, 31), 14);

  const oran = new Map<string, number>();
  const bloklar: Blok[] = [];
  for (let t = ilk; t <= son; t = gunEkle(t, 1)) {
    // Komşu yıl desteklenmiyorsa (2036 gibi) o günleri iş günü say, hata verme
    let o: number;
    try {
      o = calismaOrani(t, k);
    } catch (e) {
      if (yilOf(t) !== yil && e instanceof RangeError) o = 1;
      else throw e;
    }
    oran.set(t, o);
    if (o === 0) {
      const sonBlok = bloklar[bloklar.length - 1];
      if (sonBlok && gunEkle(sonBlok.son, 1) === t) sonBlok.son = t;
      else bloklar.push({ ilk: t, son: t });
    }
  }

  const sonuc: Kopru[] = [];
  for (let i = 0; i < bloklar.length; i++) {
    let izin = 0;
    const izinGunleri: string[] = [];
    for (let j = i + 1; j < bloklar.length; j++) {
      // i ile j arasındaki boşluğu izne çevir
      for (let t = gunEkle(bloklar[j - 1]!.son, 1); t < bloklar[j]!.ilk; t = gunEkle(t, 1)) {
        izin += oran.get(t) ?? 1;
        izinGunleri.push(t);
      }
      if (izin > enFazla) break;

      const baslangic = bloklar[i]!.ilk;
      const bitis = bloklar[j]!.son;
      if (yilOf(baslangic) !== yil && yilOf(bitis) !== yil) continue;

      const adlar = new Set<string>();
      for (let t = baslangic; t <= bitis; t = gunEkle(t, 1)) {
        try {
          for (const tt of gununTatilleri(t, k.tatil)) adlar.add(tabanAd(tt.ad));
        } catch {
          // desteklenmeyen komşu yıl
        }
      }
      // Sadece hafta sonlarını birleştiren aralıklar köprü değil
      if (adlar.size === 0) continue;

      sonuc.push({
        izinGunleri: [...izinGunleri],
        izin,
        baslangic,
        bitis,
        toplamGun: gunNo(bitis) - gunNo(baslangic) + 1,
        tatiller: [...adlar],
      });
    }
  }

  return sonuc.sort((a, b) => (a.baslangic === b.baslangic ? a.izin - b.izin : a.baslangic < b.baslangic ? -1 : 1));
}
