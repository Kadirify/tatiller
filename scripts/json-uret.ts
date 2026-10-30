/**
 * npm kullanmayanlar için hazır dosyalar üretir: yıllık JSON, CSV, ICS ve
 * her gün değişen bugun.json. GitHub Actions bunları her gece `json` dalına
 * koyuyor, oradan raw.githubusercontent.com ya da jsDelivr ile okunuyor.
 *
 *   npm run json -- cikti
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  DESTEKLENEN_YILLAR,
  ayOzeti,
  bayramlar,
  bugun,
  gunBilgisi,
  ics,
  isGunuMu,
  kopruler,
  sonrakiTatil,
  tatiller,
  type Tatil,
} from '../src';
import { GUNLER, gunNo, haftaninGunu, yilOf } from '../src/tarih';

const REPO = 'Kadirify/tatiller';
const DAL = 'json';
export const RAW = `https://raw.githubusercontent.com/${REPO}/${DAL}`;
export const CDN = `https://cdn.jsdelivr.net/gh/${REPO}@${DAL}`;

const KAYNAKLAR = {
  sabit: '2429 sayılı Ulusal Bayram ve Genel Tatiller Hakkında Kanun',
  bayram: 'Diyanet İşleri Başkanlığı, Dini Günler Listesi',
  idari: 'Cumhurbaşkanlığı genelge ve yazıları (en az iki kaynakla doğrulanmış)',
  belge: `https://github.com/${REPO}/blob/main/docs/veri.md`,
};

function surum(): string {
  const yol = resolve(dirname(fileURLToPath(import.meta.url)), '../package.json');
  return (JSON.parse(readFileSync(yol, 'utf8')) as { version: string }).version;
}

function json(veri: unknown): string {
  return `${JSON.stringify(veri, null, 2)}\n`;
}

function gunlu(t: Tatil) {
  return { ...t, gunAdi: GUNLER[haftaninGunu(t.tarih)] };
}

function csvHucre(deger: string): string {
  return /[",\n]/.test(deger) ? `"${deger.replace(/"/g, '""')}"` : deger;
}

function csv(liste: readonly Tatil[]): string {
  const satirlar = [['tarih', 'gun', 'ad', 'ad_en', 'tur', 'kategori', 'yarim_gun', 'tahmini']];
  for (const t of liste) {
    satirlar.push([
      t.tarih,
      GUNLER[haftaninGunu(t.tarih)]!,
      t.ad,
      t.adEn,
      t.tur,
      t.kategori,
      t.yarimGun === false ? '' : t.yarimGun,
      t.tahmini ? 'evet' : '',
    ]);
  }
  return `${satirlar.map((s) => s.map(csvHucre).join(',')).join('\n')}\n`;
}

function yilDosyasi(yil: number, guncelleme: string) {
  const resmi = tatiller(yil);
  const hepsi = tatiller(yil, { idariIzin: true });
  const tam = resmi.filter((t) => !t.yarimGun);
  const aylar = Array.from({ length: 12 }, (_, i) => ayOzeti(yil, i + 1));
  return {
    yil,
    guncelleme,
    tatiller: resmi.map(gunlu),
    idariIzinler: hepsi.filter((t) => t.tur === 'idari').map(gunlu),
    bayramlar: bayramlar(yil),
    ozet: {
      tamGun: tam.length,
      yarimGun: resmi.length - tam.length,
      haftaIcineDenkGelen: new Set(tam.filter((t) => ![0, 6].includes(haftaninGunu(t.tarih))).map((t) => t.tarih)).size,
      isGunu: aylar.reduce((top, a) => top + a.isGunu, 0),
    },
    aylar,
    kopruler: kopruler(yil),
  };
}

function bugunDosyasi(tarih: string) {
  const g = gunBilgisi(tarih);
  const kamu = gunBilgisi(tarih, { idariIzin: true });
  const sonraki = sonrakiTatil(tarih);
  const sonrakiTam = sonrakiTatil(tarih, { filtre: (t) => !t.yarimGun });
  const kalan = (t?: Tatil) => (t ? { ...gunlu(t), kalanGun: gunNo(t.tarih) - gunNo(tarih) } : null);
  return {
    tarih: g.tarih,
    gunAdi: g.gunAdi,
    haftaSonu: g.haftaSonu,
    tatil: g.tatil,
    tatiller: g.tatiller,
    isGunu: isGunuMu(tarih),
    kamu: { tatil: kamu.tatil, isGunu: isGunuMu(tarih, { idariIzin: true }), tatiller: kamu.tatiller },
    sonrakiTatil: kalan(sonraki),
    sonrakiTamGunTatil: kalan(sonrakiTam),
    guncelleme: tarih,
  };
}

function dalReadme(tarih: string, ilk: number, son: number): string {
  return `# tatiller / json

Bu dal otomatik üretiliyor, elle değiştirmeyin. Kaynak kod ve açıklama:
https://github.com/${REPO}

Son güncelleme: ${tarih}

| Dosya | İçerik |
|---|---|
| \`bugun.json\` | Bugün tatil mi, iş günü mü, sıradaki tatil. Her gece yenilenir |
| \`YYYY.json\` | Yılın tatilleri, idari izinler, bayramlar, aylık iş günü, köprüler (${ilk}-${son}) |
| \`YYYY.csv\` | Yılın tatilleri, tablo olarak |
| \`YYYY.ics\` | Yılın takvim dosyası |
| \`tatiller.json\` | ${ilk}-${son} arası bütün resmi tatiller tek listede |
| \`tatiller.ics\` | Takvim aboneliği: geçen yıl, bu yıl ve sonraki üç yıl |
| \`tatiller-en.ics\` | Aynısı, İngilizce adlarla |
| \`index.json\` | Bu dosyaların listesi ve adresleri |

Adresler:

\`\`\`
${RAW}/2026.json
${CDN}/2026.json
\`\`\`
`;
}

/**
 * Üretilecek bütün dosyalar: yol -> içerik.
 * Dosya sistemine dokunmuyor, test edilebilsin diye ayrı.
 */
export function dosyalar(tarih: string = bugun()): Map<string, string> {
  const { ilk, son } = DESTEKLENEN_YILLAR;
  const sonuc = new Map<string, string>();
  const olusturulma = new Date(`${tarih}T00:00:00+03:00`);

  const butun: ReturnType<typeof gunlu>[] = [];
  for (let y = ilk; y <= son; y++) {
    const resmi = tatiller(y);
    butun.push(...resmi.map(gunlu));
    sonuc.set(`${y}.json`, json(yilDosyasi(y, tarih)));
    sonuc.set(`${y}.csv`, csv(resmi));
    sonuc.set(`${y}.ics`, ics(y, { olusturulma }));
  }
  sonuc.set('tatiller.json', json(butun));

  const buYil = yilOf(tarih);
  const abonelik: number[] = [];
  for (let y = buYil - 1; y <= buYil + 3; y++) if (y >= ilk && y <= son) abonelik.push(y);
  sonuc.set('tatiller.ics', ics(abonelik, { olusturulma }));
  sonuc.set('tatiller-en.ics', ics(abonelik, { olusturulma, dil: 'en' }));

  sonuc.set('bugun.json', json(bugunDosyasi(tarih)));

  sonuc.set(
    'index.json',
    json({
      ad: 'tatiller',
      surum: surum(),
      guncelleme: tarih,
      yillar: { ilk, son },
      adres: { raw: RAW, cdn: CDN },
      dosyalar: {
        bugun: `${RAW}/bugun.json`,
        yil: `${RAW}/{yil}.json`,
        csv: `${RAW}/{yil}.csv`,
        ics: `${RAW}/{yil}.ics`,
        hepsi: `${RAW}/tatiller.json`,
        takvimAboneligi: `${RAW}/tatiller.ics`,
      },
      kaynaklar: KAYNAKLAR,
    }),
  );

  sonuc.set('README.md', dalReadme(tarih, ilk, son));
  return sonuc;
}

function yaz(klasor: string, tarih?: string): number {
  const hedef = resolve(klasor);
  rmSync(hedef, { recursive: true, force: true });
  const liste = dosyalar(tarih);
  for (const [yol, icerik] of liste) {
    const tam = join(hedef, yol);
    mkdirSync(dirname(tam), { recursive: true });
    writeFileSync(tam, icerik);
  }
  return liste.size;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [klasor = 'json-cikti', tarih] = process.argv.slice(2);
  const sayi = yaz(klasor, tarih);
  console.log(`${sayi} dosya yazıldı: ${resolve(klasor)}`);
}
