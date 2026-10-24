/**
 * Takvim günü işlemleri.
 *
 * Kütüphanenin içinde tarihler her zaman "YYYY-AA-GG" biçiminde metin olarak
 * dolaşır. Date nesnesi sadece dışarıdan girdi olarak kabul edilir ve hemen
 * İstanbul saatine göre takvim gününe çevrilir. Böylece sunucu UTC'de de
 * çalışsa, kullanıcı başka ülkede de olsa "hangi gün" sorusunun cevabı değişmez.
 */

export type TarihGirdisi = string | Date;

const GUN_MS = 86_400_000;
const ISO_GUN = /^(\d{4})-(\d{2})-(\d{2})$/;

let istanbulBicimi: Intl.DateTimeFormat | undefined;

function istanbul(): Intl.DateTimeFormat {
  istanbulBicimi ??= new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return istanbulBicimi;
}

function iki(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function parcala(tarih: string): [number, number, number] {
  const m = ISO_GUN.exec(tarih);
  if (!m) {
    throw new TypeError(`Geçersiz tarih: "${tarih}". YYYY-AA-GG biçiminde olmalı, örneğin 2025-04-23.`);
  }
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/**
 * Girdiyi "YYYY-AA-GG" biçimine çevirir.
 * Date nesneleri İstanbul saatine göre yorumlanır.
 */
export function gunHali(girdi: TarihGirdisi): string {
  if (typeof girdi === 'string') {
    const [y, a, g] = parcala(girdi);
    const d = new Date(Date.UTC(y, a - 1, g));
    if (d.getUTCFullYear() !== y || d.getUTCMonth() !== a - 1 || d.getUTCDate() !== g) {
      throw new RangeError(`Takvimde böyle bir gün yok: ${girdi}`);
    }
    return girdi;
  }

  if (girdi instanceof Date) {
    if (Number.isNaN(girdi.getTime())) {
      throw new TypeError('Geçersiz Date nesnesi (Invalid Date).');
    }
    let y = '';
    let a = '';
    let g = '';
    for (const p of istanbul().formatToParts(girdi)) {
      if (p.type === 'year') y = p.value;
      else if (p.type === 'month') a = p.value;
      else if (p.type === 'day') g = p.value;
    }
    return `${y}-${a}-${g}`;
  }

  throw new TypeError(`Tarih metin ("2025-04-23") ya da Date olmalı, gelen: ${typeof girdi}`);
}

/** 1970-01-01'den bu yana geçen gün sayısı. Karşılaştırma ve aritmetik için. */
export function gunNo(tarih: string): number {
  const [y, a, g] = parcala(tarih);
  return Date.UTC(y, a - 1, g) / GUN_MS;
}

export function gunNodanTarih(no: number): string {
  const d = new Date(no * GUN_MS);
  return `${d.getUTCFullYear()}-${iki(d.getUTCMonth() + 1)}-${iki(d.getUTCDate())}`;
}

export function gunEkle(tarih: string, gun: number): string {
  return gunNodanTarih(gunNo(tarih) + gun);
}

/** 0 = Pazar, 1 = Pazartesi ... 6 = Cumartesi (Date.getDay ile aynı). */
export function haftaninGunu(tarih: string): number {
  return new Date(gunNo(tarih) * GUN_MS).getUTCDay();
}

export function yilOf(tarih: string): number {
  return Number(tarih.slice(0, 4));
}

/** İstanbul saatine göre bugün. */
export function bugun(): string {
  return gunHali(new Date());
}

export function tarihOlustur(yil: number, ay: number, gun: number): string {
  return `${yil}-${iki(ay)}-${iki(gun)}`;
}

export const AYLAR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
] as const;

export const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'] as const;
