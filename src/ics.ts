/**
 * iCalendar (RFC 5545) çıktısı. Google Takvim, Outlook, Apple Takvim içe
 * aktarabiliyor. Bütün etkinlikler "tüm gün" olarak yazılıyor, saat dilimi
 * derdi yok.
 */

import { gunEkle, gunNo } from './tarih';
import { yilinTatilleri } from './tatiller';
import type { Tatil, TatilSecenekleri } from './tipler';

export interface IcsSecenekleri extends TatilSecenekleri {
  /** Bayram günlerini tek etkinlikte birleştir ("Kurban Bayramı", 4 gün). Varsayılan: true */
  bayramlariBirlestir?: boolean;
  /** Etkinlik adlarının dili. Varsayılan: 'tr' */
  dil?: 'tr' | 'en';
  /** Takvim uygulamasında görünecek ad. */
  takvimAdi?: string;
  /** DTSTAMP alanı için zaman. Aynı girdiden aynı dosyayı üretmek isterseniz verin. */
  olusturulma?: Date;
}

interface Etkinlik {
  baslangic: string;
  /** Dahil, son gün. */
  bitis: string;
  ozet: string;
  aciklama?: string;
  uid: string;
  kategori: string;
}

const CRLF = '\r\n';

function kacis(metin: string): string {
  return metin.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function utf8Uzunluk(kod: number): number {
  if (kod < 0x80) return 1;
  if (kod < 0x800) return 2;
  if (kod < 0x10000) return 3;
  return 4;
}

/** RFC 5545 3.1: satırlar 75 baytı geçmemeli, devam satırı bir boşlukla başlar. Çok baytlı karakterler bölünmez. */
function katla(satir: string): string {
  const parcalar: string[] = [];
  let mevcut = '';
  let bayt = 0;
  let sinir = 75;
  for (const karakter of satir) {
    const b = utf8Uzunluk(karakter.codePointAt(0)!);
    if (bayt + b > sinir) {
      parcalar.push(mevcut);
      mevcut = '';
      bayt = 0;
      sinir = 74; // baştaki boşluk da bir bayt
    }
    mevcut += karakter;
    bayt += b;
  }
  parcalar.push(mevcut);
  return parcalar.join(`${CRLF} `);
}

function icsTarih(tarih: string): string {
  return tarih.replace(/-/g, '');
}

function icsZaman(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function yarimNotu(t: Tatil, dil: 'tr' | 'en'): string | undefined {
  if (t.yarimGun === 'ogleden-sonra') return dil === 'tr' ? 'Yarım gün, 13.00\'ten itibaren tatil.' : 'Half day, off from 13:00.';
  if (t.yarimGun === 'ogleden-once') return dil === 'tr' ? 'Yarım gün, sadece sabah.' : 'Half day, morning only.';
  return undefined;
}

function bayramGrubu(t: Tatil): string | undefined {
  const m = /^(ramazan-bayrami|kurban-bayrami)-\d$/.exec(t.kod);
  return m?.[1];
}

function etkinlikler(liste: readonly Tatil[], s: IcsSecenekleri): Etkinlik[] {
  const dil = s.dil ?? 'tr';
  const birlestir = s.bayramlariBirlestir !== false;
  const sonuc: Etkinlik[] = [];
  const birlesenler = new Set<number>();

  for (let i = 0; i < liste.length; i++) {
    if (birlesenler.has(i)) continue;
    const t = liste[i]!;
    const grup = birlestir ? bayramGrubu(t) : undefined;
    const notlar: string[] = [];
    const yarim = yarimNotu(t, dil);
    if (yarim) notlar.push(yarim);
    if (t.tahmini) notlar.push(dil === 'tr' ? 'Tahmini tarih, 1-2 gün sapabilir.' : 'Estimated date, may differ by 1-2 days.');
    if (t.tur === 'idari') notlar.push(dil === 'tr' ? 'Sadece kamu çalışanları için.' : 'Public sector employees only.');

    const kategori = t.tur === 'idari' ? (dil === 'tr' ? 'İdari İzin' : 'Administrative Leave') : dil === 'tr' ? 'Resmi Tatil' : 'Public Holiday';

    if (grup) {
      let bitis = t.tarih;
      // Aynı bayramın ardışık günlerini topla. Araya giren başka tatiller
      // (23 Nisan 2023 gibi) birleşmiyor, kendi etkinliğini alıyor.
      for (let j = i + 1; j < liste.length; j++) {
        const sonraki = liste[j]!;
        if (gunNo(sonraki.tarih) > gunNo(bitis) + 1) break;
        if (bayramGrubu(sonraki) === grup) {
          bitis = sonraki.tarih;
          birlesenler.add(j);
        }
      }
      const ad = dil === 'tr' ? t.ad.replace(/ 1\. Gün$/, '') : t.adEn.replace(/ \(Day 1\)$/, '');
      sonuc.push({
        baslangic: t.tarih,
        bitis,
        ozet: ad,
        aciklama: notlar.join(' ') || undefined,
        uid: `${t.tarih}-${grup}@tatiller`,
        kategori,
      });
      continue;
    }

    sonuc.push({
      baslangic: t.tarih,
      bitis: t.tarih,
      ozet: dil === 'tr' ? t.ad : t.adEn,
      aciklama: notlar.join(' ') || undefined,
      uid: `${t.tarih}-${t.kod}@tatiller`,
      kategori,
    });
  }
  return sonuc;
}

/**
 * Tatilleri .ics takvim dosyası olarak üretir.
 */
export function ics(yillar: number | readonly number[], secenekler: IcsSecenekleri = {}): string {
  const liste = (Array.isArray(yillar) ? [...yillar] : [yillar as number])
    .sort((a, b) => a - b)
    .flatMap((y) => yilinTatilleri(y, secenekler));

  const dil = secenekler.dil ?? 'tr';
  const ad = secenekler.takvimAdi ?? (dil === 'tr' ? 'Türkiye Resmi Tatilleri' : 'Public Holidays in Türkiye');
  const damga = icsZaman(secenekler.olusturulma ?? new Date());

  const satirlar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//tatiller//TR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${kacis(ad)}`,
    'X-WR-TIMEZONE:Europe/Istanbul',
  ];

  for (const e of etkinlikler(liste, secenekler)) {
    satirlar.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${damga}`,
      `DTSTART;VALUE=DATE:${icsTarih(e.baslangic)}`,
      `DTEND;VALUE=DATE:${icsTarih(gunEkle(e.bitis, 1))}`,
      `SUMMARY:${kacis(e.ozet)}`,
    );
    if (e.aciklama) satirlar.push(`DESCRIPTION:${kacis(e.aciklama)}`);
    satirlar.push(`CATEGORIES:${kacis(e.kategori)}`, 'TRANSP:TRANSPARENT', 'END:VEVENT');
  }

  satirlar.push('END:VCALENDAR');
  return satirlar.map(katla).join(CRLF) + CRLF;
}
