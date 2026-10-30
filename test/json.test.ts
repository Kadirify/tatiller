import { describe, expect, it } from 'vitest';
import { dosyalar } from '../scripts/json-uret';

const d = dosyalar('2026-10-30');

describe('json dalı dosyaları', () => {
  it('her yıl için json, csv ve ics var', () => {
    for (let y = 2010; y <= 2035; y++) {
      expect(d.has(`${y}.json`), String(y)).toBe(true);
      expect(d.has(`${y}.csv`), String(y)).toBe(true);
      expect(d.has(`${y}.ics`), String(y)).toBe(true);
    }
    for (const f of ['tatiller.json', 'tatiller.ics', 'tatiller-en.ics', 'bugun.json', 'index.json', 'README.md']) {
      expect(d.has(f), f).toBe(true);
    }
  });

  it('bütün json dosyaları geçerli', () => {
    for (const [yol, icerik] of d) {
      if (yol.endsWith('.json')) expect(() => JSON.parse(icerik), yol).not.toThrow();
    }
  });

  it('yıl dosyası', () => {
    const y = JSON.parse(d.get('2026.json')!);
    expect(y.yil).toBe(2026);
    expect(y.tatiller).toHaveLength(17);
    expect(y.tatiller[0]).toMatchObject({ tarih: '2026-01-01', gunAdi: 'Perşembe' });
    expect(y.idariIzinler.map((t: { tarih: string }) => t.tarih)).toEqual(['2026-05-25', '2026-05-26']);
    expect(y.aylar).toHaveLength(12);
    expect(y.ozet).toMatchObject({ tamGun: 14, yarimGun: 3, haftaIcineDenkGelen: 10 });
    expect(y.kopruler.length).toBeGreaterThan(0);
  });

  it('bugun.json', () => {
    const b = JSON.parse(d.get('bugun.json')!);
    expect(b).toMatchObject({ tarih: '2026-10-30', gunAdi: 'Cuma', tatil: 'yok', isGunu: true });
    expect(b.sonrakiTatil).toMatchObject({ tarih: '2027-01-01', kalanGun: 63 });
  });

  it('bayram gününde bugun.json', () => {
    const b = JSON.parse(dosyalar('2026-05-26').get('bugun.json')!);
    expect(b.tatil).toBe('yarim');
    expect(b.kamu.tatil).toBe('tam');
    expect(b.kamu.isGunu).toBe(false);
  });

  it('csv başlığı ve Türkçe karakterler', () => {
    const satirlar = d.get('2026.csv')!.trim().split('\n');
    expect(satirlar[0]).toBe('tarih,gun,ad,ad_en,tur,kategori,yarim_gun,tahmini');
    expect(satirlar).toContain('2026-08-30,Pazar,Zafer Bayramı,Victory Day,resmi,genel,,');
    expect(satirlar.length).toBe(18);
  });

  it('abonelik takvimi geçen yıldan üç yıl sonrasına', () => {
    const c = d.get('tatiller.ics')!;
    expect(c).toContain('DTSTART;VALUE=DATE:20250101');
    expect(c).toContain('DTSTART;VALUE=DATE:20290101');
    expect(c).not.toContain('DTSTART;VALUE=DATE:20300101');
  });

  it('aynı gün için aynı çıktı (gereksiz commit olmasın)', () => {
    const tekrar = dosyalar('2026-10-30');
    for (const [yol, icerik] of d) expect(tekrar.get(yol), yol).toBe(icerik);
  });
});
