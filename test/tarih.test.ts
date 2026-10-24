import { describe, expect, it } from 'vitest';
import { gunEkle, gunHali, gunNo, gunNodanTarih, haftaninGunu } from '../src/tarih';

describe('gunHali', () => {
  it('geçerli metni olduğu gibi döner', () => {
    expect(gunHali('2025-04-23')).toBe('2025-04-23');
  });

  it('artık yılı biliyor', () => {
    expect(gunHali('2024-02-29')).toBe('2024-02-29');
    expect(() => gunHali('2025-02-29')).toThrow(RangeError);
  });

  it('bozuk biçimi reddediyor', () => {
    expect(() => gunHali('23.04.2025')).toThrow(TypeError);
    expect(() => gunHali('2025-4-23')).toThrow(TypeError);
    expect(() => gunHali('2025-13-01')).toThrow(RangeError);
  });

  it('Date nesnesini İstanbul saatine göre güne çeviriyor', () => {
    // UTC'de hâlâ 31 Aralık, İstanbul'da yeni yıl başlamış
    expect(gunHali(new Date('2024-12-31T21:30:00Z'))).toBe('2025-01-01');
    expect(gunHali(new Date('2024-12-31T20:59:59Z'))).toBe('2024-12-31');
  });

  it('geçersiz Date için hata veriyor', () => {
    expect(() => gunHali(new Date('olmayan'))).toThrow(TypeError);
  });

  it('metin ya da Date dışındaki girdiyi reddediyor', () => {
    expect(() => gunHali(20250423 as unknown as string)).toThrow(TypeError);
  });
});

describe('gün aritmetiği', () => {
  it('ay ve yıl sınırlarını geçiyor', () => {
    expect(gunEkle('2024-12-31', 1)).toBe('2025-01-01');
    expect(gunEkle('2024-03-01', -1)).toBe('2024-02-29');
    expect(gunEkle('2025-03-01', -1)).toBe('2025-02-28');
  });

  it('gunNo ve gunNodanTarih birbirinin tersi', () => {
    for (const t of ['1970-01-01', '2000-02-29', '2035-12-31']) {
      expect(gunNodanTarih(gunNo(t))).toBe(t);
    }
  });

  it('haftanın gününü doğru buluyor', () => {
    expect(haftaninGunu('2023-10-29')).toBe(0); // Pazar, Cumhuriyetin 100. yılı
    expect(haftaninGunu('2025-01-01')).toBe(3); // Çarşamba
  });
});
