import { describe, expect, it } from 'vitest';
import {
  ayOzeti,
  isGunleri,
  isGunuEkle,
  isGunuMu,
  isGunuSay,
  oncekiIsGunu,
  sonrakiIsGunu,
} from '../src';

describe('isGunuMu', () => {
  it('hafta içi normal gün', () => {
    expect(isGunuMu('2026-03-18')).toBe(true);
  });

  it('hafta sonu ve bayram değil', () => {
    expect(isGunuMu('2026-03-14')).toBe(false); // Cumartesi
    expect(isGunuMu('2026-03-20')).toBe(false); // Ramazan Bayramı 1. gün
  });

  it('arife varsayılan olarak iş günü, istenirse tatil', () => {
    expect(isGunuMu('2026-03-19')).toBe(true);
    expect(isGunuMu('2026-03-19', { yarimGun: 'tatil' })).toBe(false);
  });

  it('Cumartesi çalışılan yerler', () => {
    expect(isGunuMu('2026-03-14', { haftaSonu: [0] })).toBe(true);
    // ama bayram cumartesiye denk geldiyse yine tatil
    expect(isGunuMu('2026-03-21', { haftaSonu: [0] })).toBe(false);
  });

  it('ek tatil ve telafi günü', () => {
    expect(isGunuMu('2026-12-31', { ekTatiller: ['2026-12-31'] })).toBe(false);
    expect(isGunuMu('2026-03-21', { ekIsGunleri: ['2026-03-21'] })).toBe(true);
  });

  it('idari izin sadece istenirse', () => {
    expect(isGunuMu('2024-04-08')).toBe(true);
    expect(isGunuMu('2024-04-08', { idariIzin: true })).toBe(false);
  });

  it('geçersiz hafta sonu tanımını reddediyor', () => {
    expect(() => isGunuMu('2026-03-18', { haftaSonu: [7] })).toThrow(RangeError);
  });
});

describe('isGunuEkle', () => {
  it('bayram ve hafta sonunu atlıyor', () => {
    expect(isGunuEkle('2026-03-18', 1)).toBe('2026-03-19');
    expect(isGunuEkle('2026-03-19', 1)).toBe('2026-03-23');
    expect(isGunuEkle('2026-03-18', 2)).toBe('2026-03-23');
  });

  it('negatif değerle geriye gidiyor', () => {
    expect(isGunuEkle('2026-03-23', -1)).toBe('2026-03-19');
    expect(oncekiIsGunu('2026-03-23')).toBe('2026-03-19');
  });

  it('sıfır gün tarihi değiştirmiyor', () => {
    expect(isGunuEkle('2026-03-21', 0)).toBe('2026-03-21');
  });

  it('Kurban Bayramı 9 günlük kamu tatilinde idari izinleri atlıyor', () => {
    // 2024: 15 Haziran Cumartesi arife, 16-19 bayram, 20-21 idari izin
    expect(sonrakiIsGunu('2024-06-14')).toBe('2024-06-20');
    expect(sonrakiIsGunu('2024-06-14', { idariIzin: true })).toBe('2024-06-24');
  });

  it('yıl sınırını geçiyor', () => {
    expect(isGunuEkle('2025-12-31', 1)).toBe('2026-01-02');
  });

  it('bütün günler kapalıysa sonsuz döngüye girmiyor', () => {
    expect(() => isGunuEkle('2026-01-01', 1, { haftaSonu: [0, 1, 2, 3, 4, 5, 6] })).toThrow(RangeError);
  });

  it('tam sayı olmayan gün sayısını reddediyor', () => {
    expect(() => isGunuEkle('2026-01-01', 1.5)).toThrow(TypeError);
  });
});

describe('isGunuSay', () => {
  it('başlangıç hariç, bitiş dahil', () => {
    expect(isGunuSay('2026-03-16', '2026-03-20')).toBe(3); // 17, 18, 19 (20 bayram)
    expect(isGunuSay('2026-03-16', '2026-03-16')).toBe(0);
  });

  it('isGunuEkle ile tutarlı, iki yönde de', () => {
    const a = '2026-05-20';
    for (const n of [-15, -3, -1, 1, 4, 10, 30]) {
      expect(isGunuSay(a, isGunuEkle(a, n)), `n=${n}`).toBe(n);
    }
  });
});

describe('isGunleri', () => {
  it('aralıktaki iş günlerini listeliyor', () => {
    expect(isGunleri('2026-05-25', '2026-06-01')).toEqual(['2026-05-25', '2026-05-26', '2026-06-01']);
  });
});

describe('ayOzeti', () => {
  it('Mart 2026', () => {
    const o = ayOzeti(2026, 3);
    expect(o).toMatchObject({
      takvimGunu: 31,
      haftaSonu: 9,
      tatil: 1, // 20 Mart Cuma; 21-22 hafta sonuna düşüyor
      yarimIsGunu: 1, // 19 Mart arife
      tamIsGunu: 20,
      isGunu: 20.5,
    });
  });

  it('Aralık ayı yıl sınırında doğru gün sayısı veriyor', () => {
    expect(ayOzeti(2026, 12).takvimGunu).toBe(31);
    expect(ayOzeti(2024, 2).takvimGunu).toBe(29);
  });

  it('geçersiz ayı reddediyor', () => {
    expect(() => ayOzeti(2026, 13)).toThrow(RangeError);
  });
});
