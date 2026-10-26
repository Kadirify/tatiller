import { describe, expect, it } from 'vitest';
import { kopruler } from '../src';

function ozet(yil: number, enFazlaIzin?: number) {
  return kopruler(yil, { enFazlaIzin }).map((k) => `${k.baslangic}..${k.bitis} izin=${k.izin} gun=${k.toplamGun}`);
}

describe('kopruler', () => {
  it('2026 için varsayılan (en fazla 2 gün izin)', () => {
    expect(ozet(2026)).toEqual([
      '2026-01-01..2026-01-04 izin=1 gun=4',
      '2026-04-23..2026-04-26 izin=1 gun=4',
      '2026-05-16..2026-05-19 izin=1 gun=4',
      '2026-05-23..2026-05-31 izin=1.5 gun=9',
      '2026-07-11..2026-07-15 izin=2 gun=5',
      '2026-07-15..2026-07-19 izin=2 gun=5',
      '2026-10-29..2026-11-01 izin=1 gun=4',
    ]);
  });

  it('arifeyi yarım izin sayıyor', () => {
    const kurban = kopruler(2026).find((k) => k.baslangic === '2026-05-23')!;
    expect(kurban.izinGunleri).toEqual(['2026-05-25', '2026-05-26']);
    expect(kurban.tatiller).toEqual(['Kurban Bayramı']);
  });

  it('izin sınırı büyüyünce daha uzun tatiller çıkıyor', () => {
    const ramazan = kopruler(2026, { enFazlaIzin: 4 }).find((k) => k.tatiller.includes('Ramazan Bayramı'));
    expect(ramazan).toMatchObject({ baslangic: '2026-03-14', bitis: '2026-03-22', izin: 3.5, toplamGun: 9 });
  });

  it('idari izinler dahil edilince kamu için köprü gerekmiyor', () => {
    // 2024 Ramazan: 8 Nisan idari izin, 9 Nisan sabah idari + öğleden sonra arife
    const ozel = kopruler(2024).find((k) => k.tatiller.includes('Ramazan Bayramı'));
    expect(ozel?.izinGunleri).toEqual(['2024-04-08', '2024-04-09']);
    const kamu = kopruler(2024, { idariIzin: true }).filter((k) => k.tatiller.includes('Ramazan Bayramı'));
    expect(kamu.every((k) => !k.izinGunleri.includes('2024-04-08'))).toBe(true);
  });

  it('desteklenen son yılda komşu yıl yüzünden hata vermiyor', () => {
    expect(() => kopruler(2035)).not.toThrow();
  });

  it('geçersiz izin sınırını reddediyor', () => {
    expect(() => kopruler(2026, { enFazlaIzin: 0 })).toThrow(RangeError);
  });
});
