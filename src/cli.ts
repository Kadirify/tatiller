import { ayOzeti, isGunuEkle, isGunuMu, isGunuSay, type IsGunuSecenekleri } from './isgunu';
import { ics } from './ics';
import { gunBilgisi, sonrakiTatil, tatiller } from './tatiller';
import { AYLAR, GUNLER, bugun, gunHali, gunNo, haftaninGunu, yilOf } from './tarih';
import type { Tatil } from './tipler';

declare const __SURUM__: string | undefined;

export interface CliSonucu {
  cikti: string;
  kod: number;
}

interface Bayraklar {
  idari: boolean;
  tahmini: boolean;
  json: boolean;
  en: boolean;
  cumartesi: boolean;
  yarimTatil: boolean;
}

const YARDIM = `tatiller - Türkiye resmi tatilleri ve iş günü hesabı

Kullanım:
  tatiller [yıl]                   yılın tatilleri (varsayılan: bu yıl)
  tatiller sonraki [tarih]         sıradaki tatil
  tatiller bugun [tarih]           gün tatil mi, iş günü mü
  tatiller isgunu <tarih> <n>      tarihten n iş günü sonrası (negatifse öncesi)
  tatiller say <tarih> <tarih>     iki tarih arası iş günü sayısı
  tatiller ay <yıl> <ay>           ayın iş günü özeti
  tatiller ics [yıl...]            takvim dosyası (.ics) üretir

Seçenekler:
  --idari          kamu idari izinlerini de say
  --cumartesi      cumartesi iş günü (sadece pazar hafta sonu)
  --yarim-tatil    arife gibi yarım günleri tatil say
  --tahmini        2035 sonrası için tahmini bayram tarihleri
  --json           JSON çıktı
  --en             İngilizce adlar
  -v, --version    sürüm
  -h, --help       bu yardım

Örnekler:
  npx tatiller 2027
  npx tatiller isgunu 2026-03-18 5
  npx tatiller ics 2026 2027 > tatiller.ics`;

function uzunTarih(t: string): string {
  const [y, a, g] = t.split('-').map(Number) as [number, number, number];
  return `${g} ${AYLAR[a - 1]} ${y} ${GUNLER[haftaninGunu(t)]}`;
}

function kisaTarih(t: string): string {
  const [, a, g] = t.split('-').map(Number) as [number, number, number];
  return `${String(g).padStart(2)} ${AYLAR[a - 1]!.padEnd(7)} ${GUNLER[haftaninGunu(t)]!.padEnd(9)}`;
}

function yarimEtiketi(t: Tatil): string {
  if (t.yarimGun === 'ogleden-sonra') return 'yarım gün (13.00)';
  if (t.yarimGun === 'ogleden-once') return 'yarım gün (sabah)';
  return '';
}

function tarihArgumani(deger: string | undefined, ad: string): string {
  if (!deger) throw new HataMesaji(`${ad} eksik. Örnek: 2026-03-18`);
  if (deger === 'bugun' || deger === 'bugün') return bugun();
  try {
    return gunHali(deger);
  } catch (e) {
    throw new HataMesaji((e as Error).message);
  }
}

function sayiArgumani(deger: string | undefined, ad: string): number {
  const n = Number(deger);
  if (deger === undefined || deger === '' || !Number.isInteger(n)) {
    throw new HataMesaji(`${ad} tam sayı olmalı, gelen: ${deger ?? '(boş)'}`);
  }
  return n;
}

class HataMesaji extends Error {}

function tatilListesi(yil: number, b: Bayraklar): string {
  const liste = tatiller(yil, { idariIzin: b.idari, tahmini: b.tahmini });
  if (b.json) return JSON.stringify(liste, null, 2);

  const adGenisligi = Math.max(...liste.map((t) => (b.en ? t.adEn : t.ad).length));
  const satirlar = [`${yil} yılı resmi tatilleri${b.idari ? ' (idari izinler dahil)' : ''}`, ''];
  for (const t of liste) {
    const ad = (b.en ? t.adEn : t.ad).padEnd(adGenisligi);
    const notlar = [yarimEtiketi(t), t.tahmini ? 'tahmini' : ''].filter(Boolean).join(', ');
    satirlar.push(`  ${kisaTarih(t.tarih)}  ${ad}  ${notlar}`.trimEnd());
  }

  const tam = liste.filter((t) => !t.yarimGun && t.tur === 'resmi');
  const yarim = liste.filter((t) => t.yarimGun && t.tur === 'resmi');
  const haftaIci = new Set(tam.filter((t) => ![0, 6].includes(haftaninGunu(t.tarih))).map((t) => t.tarih)).size;
  satirlar.push('', `Toplam ${tam.length} tam gün, ${yarim.length} yarım gün. Hafta içine denk gelen tam gün: ${haftaIci}.`);
  if (liste.some((t) => t.tahmini)) {
    satirlar.push('Tahmini işaretli tarihler Diyanet henüz yayımlamadığı için hesaplandı, 1-2 gün sapabilir.');
  }
  return satirlar.join('\n');
}

function sonraki(tarih: string, b: Bayraklar): string {
  const t = sonrakiTatil(tarih, { idariIzin: b.idari, tahmini: b.tahmini });
  if (!t) return 'Sıradaki tatil bulunamadı.';
  if (b.json) return JSON.stringify(t, null, 2);
  const kalan = gunNo(t.tarih) - gunNo(tarih);
  const yarim = yarimEtiketi(t);
  return `${b.en ? t.adEn : t.ad}: ${uzunTarih(t.tarih)}${yarim ? `, ${yarim}` : ''} (${kalan} gün sonra)`;
}

function secenekler(b: Bayraklar): IsGunuSecenekleri {
  return {
    idariIzin: b.idari,
    tahmini: b.tahmini,
    haftaSonu: b.cumartesi ? [0] : [6, 0],
    yarimGun: b.yarimTatil ? 'tatil' : 'isGunu',
  };
}

function bugunNe(tarih: string, b: Bayraklar): string {
  const g = gunBilgisi(tarih, { idariIzin: b.idari, tahmini: b.tahmini });
  const is = isGunuMu(tarih, secenekler(b));
  if (b.json) return JSON.stringify({ ...g, isGunu: is }, null, 2);
  const parca = [uzunTarih(tarih)];
  if (g.tatiller.length) parca.push(g.tatiller.map((t) => (b.en ? t.adEn : t.ad) + (t.yarimGun ? ` (${yarimEtiketi(t)})` : '')).join(', '));
  parca.push(is ? 'iş günü' : 'iş günü değil');
  return parca.join(' · ');
}

function ayCiktisi(yil: number, ay: number, b: Bayraklar): string {
  const o = ayOzeti(yil, ay, secenekler(b));
  if (b.json) return JSON.stringify(o, null, 2);
  return [
    `${AYLAR[ay - 1]} ${yil}`,
    `  Takvim günü   ${o.takvimGunu}`,
    `  İş günü       ${o.isGunu}${o.yarimIsGunu ? ` (${o.tamIsGunu} tam + ${o.yarimIsGunu} yarım)` : ''}`,
    `  Hafta sonu    ${o.haftaSonu}`,
    `  Tatil         ${o.tatil}`,
  ].join('\n');
}

/**
 * Komut satırı aracının çekirdeği. Ekrana yazmaz, çıktıyı döner; böylece test
 * edilebiliyor.
 */
export function calistir(argv: readonly string[]): CliSonucu {
  const b: Bayraklar = { idari: false, tahmini: false, json: false, en: false, cumartesi: false, yarimTatil: false };
  const konumsal: string[] = [];

  for (const a of argv) {
    switch (a) {
      case '-h':
      case '--help':
      case 'yardim':
        return { cikti: YARDIM, kod: 0 };
      case '-v':
      case '--version':
        return { cikti: typeof __SURUM__ === 'string' ? __SURUM__ : 'geliştirme', kod: 0 };
      case '--idari':
        b.idari = true;
        break;
      case '--tahmini':
        b.tahmini = true;
        break;
      case '--json':
        b.json = true;
        break;
      case '--en':
        b.en = true;
        break;
      case '--cumartesi':
        b.cumartesi = true;
        break;
      case '--yarim-tatil':
        b.yarimTatil = true;
        break;
      default:
        if (a.startsWith('--')) return { cikti: `Bilinmeyen seçenek: ${a}\n\n${YARDIM}`, kod: 2 };
        konumsal.push(a);
    }
  }

  const [komut, ...arg] = konumsal;

  try {
    if (komut === undefined) return { cikti: tatilListesi(yilOf(bugun()), b), kod: 0 };
    if (/^\d{4}$/.test(komut)) return { cikti: tatilListesi(Number(komut), b), kod: 0 };

    switch (komut) {
      case 'sonraki':
        return { cikti: sonraki(arg[0] ? tarihArgumani(arg[0], 'Tarih') : bugun(), b), kod: 0 };
      case 'bugun':
      case 'bugün':
        return { cikti: bugunNe(arg[0] ? tarihArgumani(arg[0], 'Tarih') : bugun(), b), kod: 0 };
      case 'isgunu': {
        const t = tarihArgumani(arg[0], 'Tarih');
        const n = sayiArgumani(arg[1], 'Gün sayısı');
        const sonuc = isGunuEkle(t, n, secenekler(b));
        return { cikti: b.json ? JSON.stringify({ tarih: sonuc }) : `${sonuc} (${uzunTarih(sonuc)})`, kod: 0 };
      }
      case 'say': {
        const n = isGunuSay(tarihArgumani(arg[0], 'Başlangıç'), tarihArgumani(arg[1], 'Bitiş'), secenekler(b));
        return { cikti: b.json ? JSON.stringify({ isGunu: n }) : String(n), kod: 0 };
      }
      case 'ay':
        return { cikti: ayCiktisi(sayiArgumani(arg[0], 'Yıl'), sayiArgumani(arg[1], 'Ay'), b), kod: 0 };
      case 'ics': {
        const yillar = arg.length ? arg.map((y) => sayiArgumani(y, 'Yıl')) : [yilOf(bugun())];
        return { cikti: ics(yillar, { idariIzin: b.idari, tahmini: b.tahmini, dil: b.en ? 'en' : 'tr' }), kod: 0 };
      }
      default:
        return { cikti: `Bilinmeyen komut: ${komut}\n\n${YARDIM}`, kod: 2 };
    }
  } catch (e) {
    if (e instanceof HataMesaji || e instanceof RangeError || e instanceof TypeError) {
      return { cikti: `Hata: ${e.message}`, kod: 1 };
    }
    throw e;
  }
}
