import { describe, expect, it } from 'vitest';
import { ics } from '../src';

const sabit = new Date('2024-12-21T10:00:00Z');

function etkinlikSayisi(metin: string): number {
  return metin.split('BEGIN:VEVENT').length - 1;
}

function ozetler(metin: string): string[] {
  return metin
    .replace(/\r\n /g, '')
    .split('\r\n')
    .filter((s) => s.startsWith('SUMMARY:'))
    .map((s) => s.slice(8));
}

describe('ics', () => {
  it('geçerli bir takvim iskeleti üretiyor', () => {
    const c = ics(2026, { olusturulma: sabit });
    expect(c.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(c.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(c).toContain('DTSTAMP:20241221T100000Z');
  });

  it('sadece CRLF kullanıyor', () => {
    const c = ics(2026, { olusturulma: sabit });
    expect(c.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
  });

  it('bayramları birleştiriyor', () => {
    const c = ics(2026, { olusturulma: sabit });
    expect(etkinlikSayisi(c)).toBe(12);
    expect(c).toContain('DTSTART;VALUE=DATE:20260527\r\nDTEND;VALUE=DATE:20260531\r\nSUMMARY:Kurban Bayramı');
  });

  it('istenirse her günü ayrı yazıyor', () => {
    expect(etkinlikSayisi(ics(2026, { olusturulma: sabit, bayramlariBirlestir: false }))).toBe(17);
  });

  it('araya giren tatil kendi etkinliğini koruyor (23 Nisan 2023)', () => {
    const c = ics(2023, { olusturulma: sabit });
    const o = ozetler(c);
    expect(o.filter((s) => s === 'Ramazan Bayramı')).toHaveLength(1);
    expect(o).toContain('Ulusal Egemenlik ve Çocuk Bayramı');
    expect(c).toContain('DTSTART;VALUE=DATE:20230421\r\nDTEND;VALUE=DATE:20230424\r\nSUMMARY:Ramazan Bayramı');
  });

  it('İngilizce adlar', () => {
    const o = ozetler(ics(2026, { olusturulma: sabit, dil: 'en' }));
    expect(o).toContain('Eid al-Adha');
    expect(o).toContain('Republic Day Eve');
  });

  it('satırları 75 bayttan uzun bırakmıyor, Türkçe karakterleri bölmüyor', () => {
    const c = ics(2026, { olusturulma: sabit, takvimAdi: 'Şirket İçi Çalışma Takvimi / Öğle Arası Görüşmeleri İçin Ayrılmış Özel Günler' });
    for (const satir of c.split('\r\n')) {
      expect(new TextEncoder().encode(satir).length).toBeLessThanOrEqual(75);
    }
    expect(c.replace(/\r\n /g, '')).toContain('X-WR-CALNAME:Şirket İçi Çalışma Takvimi / Öğle Arası');
  });

  it('virgül ve noktalı virgülü kaçırıyor', () => {
    expect(ics(2026, { olusturulma: sabit, takvimAdi: 'A, B; C' })).toContain('X-WR-CALNAME:A\\, B\\; C');
  });

  it('birden fazla yıl alıyor', () => {
    const c = ics([2027, 2026], { olusturulma: sabit });
    const ilk = c.indexOf('20260101');
    const ikinci = c.indexOf('20270101');
    expect(ilk).toBeGreaterThan(0);
    expect(ikinci).toBeGreaterThan(ilk);
  });

  it('UID değerleri benzersiz', () => {
    const c = ics([2025, 2026, 2027], { olusturulma: sabit, idariIzin: true });
    const uidler = c.split('\r\n').filter((s) => s.startsWith('UID:'));
    expect(new Set(uidler).size).toBe(uidler.length);
  });
});
