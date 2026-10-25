import { describe, expect, it } from 'vitest';
import { calistir } from '../src/cli';

describe('cli', () => {
  it('yılın tatillerini listeliyor', () => {
    const { cikti, kod } = calistir(['2026']);
    expect(kod).toBe(0);
    expect(cikti).toContain('2026 yılı resmi tatilleri');
    expect(cikti).toMatch(/20 Mart\s+Cuma\s+Ramazan Bayramı 1\. Gün/);
    expect(cikti).toContain('yarım gün (13.00)');
    expect(cikti).toContain('Toplam 14 tam gün, 3 yarım gün.');
  });

  it('JSON çıktı', () => {
    const liste = JSON.parse(calistir(['2026', '--json']).cikti);
    expect(liste).toHaveLength(17);
    expect(liste[0]).toMatchObject({ tarih: '2026-01-01', kod: 'yilbasi' });
  });

  it('sonraki tatil', () => {
    expect(calistir(['sonraki', '2026-10-20']).cikti).toBe(
      'Cumhuriyet Bayramı Arifesi: 28 Ekim 2026 Çarşamba, yarım gün (13.00) (8 gün sonra)',
    );
  });

  it('gün sorgusu', () => {
    expect(calistir(['bugun', '2026-03-19']).cikti).toBe(
      '19 Mart 2026 Perşembe · Ramazan Bayramı Arifesi (yarım gün (13.00)) · iş günü',
    );
    expect(calistir(['bugun', '2026-03-19', '--yarim-tatil']).cikti).toMatch(/iş günü değil$/);
  });

  it('iş günü ekleme ve sayma', () => {
    expect(calistir(['isgunu', '2026-03-18', '2']).cikti).toBe('2026-03-23 (23 Mart 2026 Pazartesi)');
    expect(calistir(['say', '2026-03-16', '2026-03-20']).cikti).toBe('3');
  });

  it('ay özeti', () => {
    expect(calistir(['ay', '2026', '3']).cikti).toContain('İş günü       20.5 (20 tam + 1 yarım)');
  });

  it('ics çıktısı', () => {
    expect(calistir(['ics', '2026']).cikti).toMatch(/^BEGIN:VCALENDAR\r\n/);
  });

  it('hatalı girdide açıklayıcı mesaj ve sıfırdan farklı kod', () => {
    expect(calistir(['isgunu', '18.03.2026', '2'])).toMatchObject({ kod: 1 });
    expect(calistir(['isgunu', '2026-03-18', 'iki']).cikti).toContain('tam sayı');
    expect(calistir(['2050']).cikti).toContain('tahmini');
    expect(calistir(['uc'])).toMatchObject({ kod: 2 });
    expect(calistir(['--bilinmeyen'])).toMatchObject({ kod: 2 });
  });

  it('yardım', () => {
    expect(calistir(['--help']).cikti).toContain('Kullanım:');
  });
});
