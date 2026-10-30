import { gununTatilleri, tatilOrani } from './tatiller';
import { gunEkle, gunHali, gunNo, haftaninGunu, tarihOlustur, type TarihGirdisi } from './tarih';
import type { TatilSecenekleri } from './tipler';

export interface IsGunuSecenekleri extends TatilSecenekleri {
  /**
   * Hafta sonu sayılan günler (0 = Pazar ... 6 = Cumartesi).
   * Varsayılan `[6, 0]`. Cumartesi çalışılan bir yer için `[0]`.
   */
  haftaSonu?: readonly number[];
  /**
   * Yarım gün tatiller (arifeler, 28 Ekim) iş günü mü sayılsın?
   * Sabahı çalışıldığı için varsayılan `'isGunu'`.
   */
  yarimGun?: 'isGunu' | 'tatil';
  /** Kuruma özel kapalı günler (örneğin yıl sonu envanter günü). */
  ekTatiller?: readonly TarihGirdisi[];
  /** Normalde tatil olup çalışılan günler (örneğin telafi cumartesisi). Her şeyin önüne geçer. */
  ekIsGunleri?: readonly TarihGirdisi[];
}

/** @internal */
export interface Kurallar {
  haftaSonu: ReadonlySet<number>;
  yarimTatil: boolean;
  ek: ReadonlySet<string>;
  ekIs: ReadonlySet<string>;
  tatil: TatilSecenekleri;
}

/** @internal */
export function hazirla(s: IsGunuSecenekleri): Kurallar {
  const haftaSonu = s.haftaSonu ?? [6, 0];
  for (const g of haftaSonu) {
    if (!Number.isInteger(g) || g < 0 || g > 6) {
      throw new RangeError(`haftaSonu 0 (Pazar) ile 6 (Cumartesi) arasında olmalı, gelen: ${g}`);
    }
  }
  return {
    haftaSonu: new Set(haftaSonu),
    yarimTatil: s.yarimGun === 'tatil',
    ek: new Set((s.ekTatiller ?? []).map(gunHali)),
    ekIs: new Set((s.ekIsGunleri ?? []).map(gunHali)),
    tatil: { idariIzin: s.idariIzin, tahmini: s.tahmini },
  };
}

/** Günün ne kadarı çalışılıyor: 1, 0.5 ya da 0. @internal */
export function calismaOrani(tarih: string, k: Kurallar): 0 | 0.5 | 1 {
  if (k.ekIs.has(tarih)) return 1;
  if (k.ek.has(tarih)) return 0;
  if (k.haftaSonu.has(haftaninGunu(tarih))) return 0;
  const oran = tatilOrani(gununTatilleri(tarih, k.tatil));
  if (oran === 1) return 0;
  if (oran === 0.5) return k.yarimTatil ? 0 : 0.5;
  return 1;
}

function calisilir(tarih: string, k: Kurallar): boolean {
  return calismaOrani(tarih, k) > 0;
}

/**
 * Gün iş günü mü? Hafta sonu ve tam gün tatiller iş günü değildir.
 * Arifeler varsayılan olarak iş günü sayılır (sabahı çalışılıyor).
 */
export function isGunuMu(tarih: TarihGirdisi, secenekler: IsGunuSecenekleri = {}): boolean {
  return calisilir(gunHali(tarih), hazirla(secenekler));
}

/**
 * Tarihe `gun` kadar iş günü ekler. Negatif değer geriye gider.
 * Başlangıç günü sayılmaz: Cuma'ya 1 iş günü eklemek Pazartesi'yi verir.
 * `gun = 0` ise tarihi olduğu gibi döner.
 *
 * @example
 * isGunuEkle('2026-03-18', 2) // '2026-03-23', arada bayram ve hafta sonu var
 */
export function isGunuEkle(tarih: TarihGirdisi, gun: number, secenekler: IsGunuSecenekleri = {}): string {
  if (!Number.isInteger(gun)) throw new TypeError(`Gün sayısı tam sayı olmalı, gelen: ${gun}`);
  const k = hazirla(secenekler);
  let t = gunHali(tarih);
  const adim = gun < 0 ? -1 : 1;
  let kalan = Math.abs(gun);
  // Her şey kapalıysa (örneğin haftaSonu: [0..6]) sonsuz döngüye girmeyelim
  let sinir = kalan * 7 + 3660;
  while (kalan > 0) {
    t = gunEkle(t, adim);
    if (calisilir(t, k)) kalan--;
    if (--sinir < 0) throw new RangeError('İş günü bulunamadı. Seçenekler bütün günleri kapatıyor olabilir.');
  }
  return t;
}

/** Verilen günden (hariç) sonraki ilk iş günü. */
export function sonrakiIsGunu(tarih: TarihGirdisi, secenekler: IsGunuSecenekleri = {}): string {
  return isGunuEkle(tarih, 1, secenekler);
}

/** Verilen günden (hariç) önceki son iş günü. */
export function oncekiIsGunu(tarih: TarihGirdisi, secenekler: IsGunuSecenekleri = {}): string {
  return isGunuEkle(tarih, -1, secenekler);
}

/**
 * İki tarih arasındaki iş günü sayısı. Başlangıç hariç, bitiş dahil;
 * böylece `isGunuSay(a, isGunuEkle(a, n)) === n` her zaman doğru.
 * Bitiş başlangıçtan önceyse sonuç negatif olur.
 */
export function isGunuSay(baslangic: TarihGirdisi, bitis: TarihGirdisi, secenekler: IsGunuSecenekleri = {}): number {
  const k = hazirla(secenekler);
  const a = gunHali(baslangic);
  const b = gunHali(bitis);
  if (a === b) return 0;
  const ters = b < a;
  const [ilk, son] = ters ? [b, a] : [a, b];
  let sayi = 0;
  for (let t = gunEkle(ilk, 1); t <= son; t = gunEkle(t, 1)) {
    if (calisilir(t, k)) sayi++;
  }
  // Tersse aralık (b, a] değil [b, a) olmalı ki ekle/say birbirinin tersi kalsın
  if (ters) {
    if (calisilir(son, k)) sayi--;
    if (calisilir(ilk, k)) sayi++;
  }
  return ters ? -sayi : sayi;
}

/** İki tarih arasındaki (ikisi de dahil) iş günlerinin listesi. */
export function isGunleri(baslangic: TarihGirdisi, bitis: TarihGirdisi, secenekler: IsGunuSecenekleri = {}): string[] {
  const k = hazirla(secenekler);
  let a = gunHali(baslangic);
  let b = gunHali(bitis);
  if (a > b) [a, b] = [b, a];
  const sonuc: string[] = [];
  for (let t = a; t <= b; t = gunEkle(t, 1)) {
    if (calisilir(t, k)) sonuc.push(t);
  }
  return sonuc;
}

export interface AyOzeti {
  yil: number;
  ay: number;
  takvimGunu: number;
  tamIsGunu: number;
  /** Yarım çalışılan gün sayısı (arifeler, 28 Ekim). */
  yarimIsGunu: number;
  /** tamIsGunu + yarimIsGunu / 2. Bordro ve puantaj hesabı için. */
  isGunu: number;
  /** Hafta içine denk gelen tam gün tatil sayısı. */
  tatil: number;
  haftaSonu: number;
}

/** Bir ayın çalışma özeti, bordro ve puantaj için. */
export function ayOzeti(yil: number, ay: number, secenekler: IsGunuSecenekleri = {}): AyOzeti {
  if (!Number.isInteger(ay) || ay < 1 || ay > 12) throw new RangeError(`Ay 1-12 arasında olmalı, gelen: ${ay}`);
  const k = hazirla(secenekler);
  const ilk = tarihOlustur(yil, ay, 1);
  const son = ay === 12 ? tarihOlustur(yil + 1, 1, 1) : tarihOlustur(yil, ay + 1, 1);
  const ozet: AyOzeti = {
    yil,
    ay,
    takvimGunu: gunNo(son) - gunNo(ilk),
    tamIsGunu: 0,
    yarimIsGunu: 0,
    isGunu: 0,
    tatil: 0,
    haftaSonu: 0,
  };
  for (let t = ilk; t < son; t = gunEkle(t, 1)) {
    const oran = calismaOrani(t, k);
    if (oran === 1) ozet.tamIsGunu++;
    else if (oran === 0.5) ozet.yarimIsGunu++;
    else if (k.haftaSonu.has(haftaninGunu(t)) && !k.ekIs.has(t)) ozet.haftaSonu++;
    else ozet.tatil++;
  }
  ozet.isGunu = ozet.tamIsGunu + ozet.yarimIsGunu / 2;
  return ozet;
}
