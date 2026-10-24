import { describe, expect, it } from 'vitest';
import { KURBAN_BAYRAMI, RAMAZAN_BAYRAMI, VERI_ILK_YIL, VERI_SON_YIL } from '../src/veri/bayramlar';
import { SABIT_TATILLER } from '../src/veri/sabit';
import { gunHali, gunNo, yilOf } from '../src/tarih';

// Tablo elle girildiği için yazım hatalarını yakalamak adına
// takvimin kendi kurallarını kontrol ediyoruz.
describe('bayram tablosu', () => {
  it('bütün tarihler geçerli ve sıralı', () => {
    for (const liste of [RAMAZAN_BAYRAMI, KURBAN_BAYRAMI]) {
      for (const t of liste) expect(gunHali(t)).toBe(t);
      const sirali = [...liste].sort();
      expect(liste).toEqual(sirali);
    }
  });

  it('art arda iki bayram arası bir hicri yıl (353-356 gün)', () => {
    for (const liste of [RAMAZAN_BAYRAMI, KURBAN_BAYRAMI]) {
      for (let i = 1; i < liste.length; i++) {
        const fark = gunNo(liste[i]!) - gunNo(liste[i - 1]!);
        expect(fark, `${liste[i - 1]} -> ${liste[i]}`).toBeGreaterThanOrEqual(353);
        expect(fark, `${liste[i - 1]} -> ${liste[i]}`).toBeLessThanOrEqual(356);
      }
    }
  });

  it('Ramazan Bayramı ile Kurban Bayramı arası 67-69 gün', () => {
    // 1 Şevval ile 10 Zilhicce arası: Şevval + Zilkade (29 ya da 30'ar gün) + 9 gün
    for (const kurban of KURBAN_BAYRAMI) {
      const once = RAMAZAN_BAYRAMI.filter((r) => r < kurban).at(-1);
      if (!once) continue;
      const fark = gunNo(kurban) - gunNo(once);
      expect(fark, `${once} -> ${kurban}`).toBeGreaterThanOrEqual(67);
      expect(fark, `${once} -> ${kurban}`).toBeLessThanOrEqual(69);
    }
  });

  it('desteklenen her yılı kapsıyor', () => {
    for (let y = VERI_ILK_YIL; y <= VERI_SON_YIL; y++) {
      expect(RAMAZAN_BAYRAMI.some((t) => yilOf(t) === y), `Ramazan ${y}`).toBe(true);
      expect(KURBAN_BAYRAMI.some((t) => yilOf(t) === y), `Kurban ${y}`).toBe(true);
    }
  });

  it('2033 yılında iki Ramazan Bayramı var', () => {
    expect(RAMAZAN_BAYRAMI.filter((t) => yilOf(t) === 2033)).toEqual(['2033-01-02', '2033-12-23']);
  });

  it('Diyanet listesiyle birebir: 2026', () => {
    expect(RAMAZAN_BAYRAMI).toContain('2026-03-20');
    expect(KURBAN_BAYRAMI).toContain('2026-05-27');
  });
});

describe('sabit tatiller', () => {
  it('kodlar benzersiz', () => {
    const kodlar = SABIT_TATILLER.map((t) => t.kod);
    expect(new Set(kodlar).size).toBe(kodlar.length);
  });

  it('yarım gün sadece 28 Ekim', () => {
    expect(SABIT_TATILLER.filter((t) => t.yarimGun).map((t) => t.kod)).toEqual(['cumhuriyet-arife']);
  });
});
