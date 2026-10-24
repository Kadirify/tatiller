import { BAYRAM_GUN_SAYISI, KURBAN_BAYRAMI, RAMAZAN_BAYRAMI, VERI_ILK_YIL, VERI_SON_YIL } from './veri/bayramlar';
import { IDARI_IZINLER } from './veri/idari-izinler';
import { SABIT_TATILLER } from './veri/sabit';
import { tahminiBayramlar } from './hicri';
import { GUNLER, bugun, gunEkle, gunHali, haftaninGunu, tarihOlustur, yilOf, type TarihGirdisi } from './tarih';
import type { Bayram, GunBilgisi, Tatil, TatilSecenekleri } from './tipler';

/** Diyanet verisinin kapsadığı yıllar. Bu aralık dışında `tahmini: true` gerekir. */
export const DESTEKLENEN_YILLAR = Object.freeze({ ilk: VERI_ILK_YIL, son: VERI_SON_YIL });

// Tahmini hesap için makul sınırlar. 2429 sayılı Kanun 1981'de yürürlüğe girdi.
const TAHMIN_ILK_YIL = 1982;
const TAHMIN_SON_YIL = 2199;

const BAYRAM_ADLARI = {
  ramazan: { ad: 'Ramazan Bayramı', adEn: 'Eid al-Fitr' },
  kurban: { ad: 'Kurban Bayramı', adEn: 'Eid al-Adha' },
} as const;

function yilKontrol(yil: number, tahmini: boolean): void {
  if (!Number.isInteger(yil)) {
    throw new TypeError(`Yıl tam sayı olmalı, gelen: ${String(yil)}`);
  }
  if (yil >= VERI_ILK_YIL && yil <= VERI_SON_YIL) return;

  if (!tahmini) {
    throw new RangeError(
      `${yil} yılı için Diyanet'in yayımladığı bayram tarihleri yok ` +
        `(veri ${VERI_ILK_YIL}-${VERI_SON_YIL} arası). ` +
        `Yaklaşık sonuç için { tahmini: true } seçeneğini kullanın.`,
    );
  }
  if (yil < TAHMIN_ILK_YIL || yil > TAHMIN_SON_YIL) {
    throw new RangeError(`Tahmini hesap ${TAHMIN_ILK_YIL}-${TAHMIN_SON_YIL} arasını destekliyor, gelen: ${yil}`);
  }
}

function bayramOlustur(tur: 'ramazan' | 'kurban', baslangic: string, tahmini: boolean): Bayram {
  const gunler: string[] = [];
  for (let i = 0; i < BAYRAM_GUN_SAYISI[tur]; i++) gunler.push(gunEkle(baslangic, i));
  return {
    tur,
    ...BAYRAM_ADLARI[tur],
    arife: gunEkle(baslangic, -1),
    baslangic,
    bitis: gunler[gunler.length - 1]!,
    gunler,
    tahmini,
  };
}

/** Arifesi ya da herhangi bir günü verilen yıla düşen bayramlar. */
function yilinBayramlari(yil: number): Bayram[] {
  let adaylar: Bayram[];
  if (yil >= VERI_ILK_YIL && yil <= VERI_SON_YIL) {
    adaylar = [
      ...RAMAZAN_BAYRAMI.map((t) => bayramOlustur('ramazan', t, false)),
      ...KURBAN_BAYRAMI.map((t) => bayramOlustur('kurban', t, false)),
    ];
  } else {
    adaylar = tahminiBayramlar(yil).map((b) => bayramOlustur(b.tur, b.baslangic, true));
  }
  return adaylar
    .filter((b) => yilOf(b.arife) === yil || yilOf(b.bitis) === yil)
    .sort((a, b) => (a.arife < b.arife ? -1 : 1));
}

function bayramTatilleri(b: Bayram): Tatil[] {
  const onEk = b.tur === 'ramazan' ? 'ramazan-bayrami' : 'kurban-bayrami';
  const liste: Tatil[] = [
    {
      tarih: b.arife,
      kod: `${onEk}-arife`,
      ad: `${b.ad} Arifesi`,
      adEn: `${b.adEn} Eve`,
      tur: 'resmi',
      kategori: 'dini',
      yarimGun: 'ogleden-sonra',
      tahmini: b.tahmini,
    },
  ];
  b.gunler.forEach((tarih, i) => {
    liste.push({
      tarih,
      kod: `${onEk}-${i + 1}`,
      ad: `${b.ad} ${i + 1}. Gün`,
      adEn: `${b.adEn} (Day ${i + 1})`,
      tur: 'resmi',
      kategori: 'dini',
      yarimGun: false,
      tahmini: b.tahmini,
    });
  });
  return liste;
}

const IDARI_ADLAR = {
  ramazan: ['Ramazan Bayramı', 'Eid al-Fitr'],
  kurban: ['Kurban Bayramı', 'Eid al-Adha'],
  cumhuriyet: ['Cumhuriyet Bayramı', 'Republic Day'],
  yilbasi: ['Yılbaşı', "New Year's Day"],
  diger: ['', ''],
} as const;

function idariTatiller(yil: number): Tatil[] {
  return IDARI_IZINLER.filter((i) => yilOf(i.tarih) === yil).map((i): Tatil => {
    const [tr, en] = IDARI_ADLAR[i.neden];
    return {
      tarih: i.tarih,
      kod: 'idari-izin',
      ad: tr ? `İdari İzin (${tr})` : 'İdari İzin',
      adEn: en ? `Administrative Leave (${en})` : 'Administrative Leave',
      tur: 'idari',
      kategori: 'idari',
      yarimGun: i.yarimGun,
      tahmini: false,
    };
  });
}

// Aynı gün için önce tam gün resmi tatil, sonra yarım gün, en son idari izin.
function onem(t: Tatil): number {
  return (t.tur === 'resmi' ? 0 : 2) + (t.yarimGun ? 1 : 0);
}

function sirala(a: Tatil, b: Tatil): number {
  if (a.tarih !== b.tarih) return a.tarih < b.tarih ? -1 : 1;
  return onem(a) - onem(b);
}

const onbellek = new Map<string, readonly Tatil[]>();

/** @internal */
export function yilinTatilleri(yil: number, s: TatilSecenekleri): readonly Tatil[] {
  const idari = s.idariIzin === true;
  yilKontrol(yil, s.tahmini === true);

  const anahtar = `${yil}|${idari ? 1 : 0}`;
  const kayitli = onbellek.get(anahtar);
  if (kayitli) return kayitli;

  const liste: Tatil[] = [];

  for (const sabit of SABIT_TATILLER) {
    if (sabit.ilkYil !== undefined && yil < sabit.ilkYil) continue;
    liste.push({
      tarih: tarihOlustur(yil, sabit.ay, sabit.gun),
      kod: sabit.kod,
      ad: sabit.ad,
      adEn: sabit.adEn,
      tur: 'resmi',
      kategori: sabit.kategori,
      yarimGun: sabit.yarimGun ? 'ogleden-sonra' : false,
      tahmini: false,
    });
  }

  for (const b of yilinBayramlari(yil)) {
    for (const t of bayramTatilleri(b)) {
      if (yilOf(t.tarih) === yil) liste.push(t);
    }
  }

  if (idari) liste.push(...idariTatiller(yil));

  liste.sort(sirala);
  const sonuc = Object.freeze(liste.map((t) => Object.freeze(t)));
  onbellek.set(anahtar, sonuc);
  return sonuc;
}

/**
 * Bir yılın bütün tatilleri, tarihe göre sıralı.
 *
 * @example
 * tatiller(2026).filter(t => !t.yarimGun).length // tam gün tatil sayısı
 */
export function tatiller(yil: number, secenekler: TatilSecenekleri = {}): Tatil[] {
  return [...yilinTatilleri(yil, secenekler)];
}

/** İki tarih arasındaki (ikisi de dahil) tatiller. */
export function tatilAraligi(
  baslangic: TarihGirdisi,
  bitis: TarihGirdisi,
  secenekler: TatilSecenekleri = {},
): Tatil[] {
  let ilk = gunHali(baslangic);
  let son = gunHali(bitis);
  if (ilk > son) [ilk, son] = [son, ilk];
  const sonuc: Tatil[] = [];
  for (let y = yilOf(ilk); y <= yilOf(son); y++) {
    for (const t of yilinTatilleri(y, secenekler)) {
      if (t.tarih >= ilk && t.tarih <= son) sonuc.push(t);
    }
  }
  return sonuc;
}

/** O güne denk gelen bütün tatiller. Çoğu gün boş dizi döner. */
export function gununTatilleri(tarih: TarihGirdisi, secenekler: TatilSecenekleri = {}): Tatil[] {
  const t = gunHali(tarih);
  return yilinTatilleri(yilOf(t), secenekler).filter((x) => x.tarih === t);
}

/**
 * O günün tatili, yoksa `undefined`.
 * Aynı güne birden fazla tatil düşerse en önemlisi döner (tam gün resmi tatil önce).
 */
export function tatilBul(tarih: TarihGirdisi, secenekler: TatilSecenekleri = {}): Tatil | undefined {
  return gununTatilleri(tarih, secenekler)[0];
}

/**
 * Gün resmi tatil mi? Yarım günler (arifeler, 28 Ekim) de `true` döner.
 * Hafta sonları tatil sayılmaz; çalışma günü sorusu için `isGunuMu` kullanın.
 */
export function tatilMi(tarih: TarihGirdisi, secenekler: TatilSecenekleri = {}): boolean {
  return gununTatilleri(tarih, secenekler).length > 0;
}

/**
 * Günün ne kadarı tatil: 0, 0.5 ya da 1.
 * Sabah idari izin ile öğleden sonra arife aynı güne düşerse bütün gün tatildir.
 * @internal
 */
export function tatilOrani(gunun: readonly Tatil[]): 0 | 0.5 | 1 {
  let sabah = false;
  let ogleden = false;
  for (const t of gunun) {
    if (t.yarimGun === false) return 1;
    if (t.yarimGun === 'ogleden-once') sabah = true;
    if (t.yarimGun === 'ogleden-sonra') ogleden = true;
  }
  if (sabah && ogleden) return 1;
  return sabah || ogleden ? 0.5 : 0;
}

/** Bir gün hakkında bilinmesi gerekenler. Tarih verilmezse bugün. */
export function gunBilgisi(tarih: TarihGirdisi = bugun(), secenekler: TatilSecenekleri = {}): GunBilgisi {
  const t = gunHali(tarih);
  const hg = haftaninGunu(t);
  const gunun = gununTatilleri(t, secenekler);
  const oran = tatilOrani(gunun);
  return {
    tarih: t,
    gunAdi: GUNLER[hg]!,
    haftaSonu: hg === 0 || hg === 6,
    tatiller: gunun,
    tatil: oran === 1 ? 'tam' : oran === 0.5 ? 'yarim' : 'yok',
  };
}

/** Yıla düşen Ramazan ve Kurban bayramları (arifesi dahil, yıl sınırını aşanlar da gelir). */
export function bayramlar(yil: number, secenekler: Pick<TatilSecenekleri, 'tahmini'> = {}): Bayram[] {
  yilKontrol(yil, secenekler.tahmini === true);
  return yilinBayramlari(yil).map((b) => ({ ...b, gunler: [...b.gunler] }));
}

export interface SiradakiSecenekleri extends TatilSecenekleri {
  /** Sadece bu koşulu sağlayan tatiller, örneğin `t => !t.yarimGun`. */
  filtre?: (t: Tatil) => boolean;
}

function siradaki(tarih: string, yon: 1 | -1, s: SiradakiSecenekleri): Tatil | undefined {
  const filtre = s.filtre ?? (() => true);
  const baslangicYili = yilOf(tarih);
  // Her yıl tatil var, iki yıl bakmak yeter; filtre çok darsa biraz daha bakıyoruz.
  for (let i = 0; i < 5; i++) {
    const liste = yilinTatilleri(baslangicYili + i * yon, s);
    const sirali = yon === 1 ? liste : [...liste].reverse();
    const bulunan = sirali.find((t) => (yon === 1 ? t.tarih > tarih : t.tarih < tarih) && filtre(t));
    if (bulunan) return bulunan;
  }
  return undefined;
}

/** Verilen tarihten (hariç) sonraki ilk tatil. Tarih verilmezse bugünden sonraki. */
export function sonrakiTatil(tarih: TarihGirdisi = bugun(), secenekler: SiradakiSecenekleri = {}): Tatil | undefined {
  return siradaki(gunHali(tarih), 1, secenekler);
}

/** Verilen tarihten (hariç) önceki son tatil. */
export function oncekiTatil(tarih: TarihGirdisi = bugun(), secenekler: SiradakiSecenekleri = {}): Tatil | undefined {
  return siradaki(gunHali(tarih), -1, secenekler);
}
