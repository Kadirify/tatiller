import { describe, expect, it } from 'vitest';
import {
  DESTEKLENEN_YILLAR,
  bayramlar,
  gunBilgisi,
  gununTatilleri,
  oncekiTatil,
  sonrakiTatil,
  tatilAraligi,
  tatilBul,
  tatilMi,
  tatiller,
} from '../src';
import { KURBAN_BAYRAMI, RAMAZAN_BAYRAMI } from '../src/veri/bayramlar';
import { tahminiBayramlar } from '../src/hicri';
import { gunNo } from '../src/tarih';

describe('tatiller', () => {
  it('2026 yılının tam listesi', () => {
    const liste = tatiller(2026).map((t) => `${t.tarih} ${t.kod}${t.yarimGun ? ' (yarım)' : ''}`);
    expect(liste).toEqual([
      '2026-01-01 yilbasi',
      '2026-03-19 ramazan-bayrami-arife (yarım)',
      '2026-03-20 ramazan-bayrami-1',
      '2026-03-21 ramazan-bayrami-2',
      '2026-03-22 ramazan-bayrami-3',
      '2026-04-23 ulusal-egemenlik',
      '2026-05-01 emek-ve-dayanisma',
      '2026-05-19 genclik-ve-spor',
      '2026-05-26 kurban-bayrami-arife (yarım)',
      '2026-05-27 kurban-bayrami-1',
      '2026-05-28 kurban-bayrami-2',
      '2026-05-29 kurban-bayrami-3',
      '2026-05-30 kurban-bayrami-4',
      '2026-07-15 demokrasi-ve-milli-birlik',
      '2026-08-30 zafer',
      '2026-10-28 cumhuriyet-arife (yarım)',
      '2026-10-29 cumhuriyet',
    ]);
  });

  it('15 Temmuz 2017 ile başlıyor', () => {
    expect(tatiller(2016).some((t) => t.kod === 'demokrasi-ve-milli-birlik')).toBe(false);
    expect(tatiller(2017).some((t) => t.kod === 'demokrasi-ve-milli-birlik')).toBe(true);
  });

  it('dönen dizi değiştirilse bile önbellek bozulmuyor', () => {
    const a = tatiller(2025);
    a.length = 0;
    expect(tatiller(2025).length).toBeGreaterThan(10);
    expect(Object.isFrozen(tatiller(2025)[0])).toBe(true);
  });

  it('desteklenen aralık dışında açıklayıcı hata veriyor', () => {
    expect(() => tatiller(DESTEKLENEN_YILLAR.son + 1)).toThrow(/tahmini: true/);
    expect(() => tatiller(2009)).toThrow(RangeError);
    expect(() => tatiller(2025.5)).toThrow(TypeError);
  });

  it('her yıl için tam gün sayısı makul', () => {
    for (let y = DESTEKLENEN_YILLAR.ilk; y <= DESTEKLENEN_YILLAR.son; y++) {
      const tam = tatiller(y).filter((t) => !t.yarimGun).length;
      // 6-7 sabit gün + 7 bayram günü, iki Ramazan'lı yıllarda 3 fazla
      expect(tam, String(y)).toBeGreaterThanOrEqual(13);
      expect(tam, String(y)).toBeLessThanOrEqual(17);
    }
  });
});

describe('aynı güne denk gelen tatiller', () => {
  it('23 Nisan 2023 hem Ulusal Egemenlik hem Ramazan Bayramı 3. gün', () => {
    const kodlar = gununTatilleri('2023-04-23').map((t) => t.kod);
    expect(kodlar).toEqual(['ulusal-egemenlik', 'ramazan-bayrami-3']);
  });

  it('19 Mayıs 2027 Kurban Bayramı 4. güne denk geliyor', () => {
    expect(gununTatilleri('2027-05-19').map((t) => t.kod)).toEqual(['genclik-ve-spor', 'kurban-bayrami-4']);
  });

  it('tam gün tatil yarım günün önüne geçiyor', () => {
    // 2029 Kurban arifesi 23 Nisan'a denk geliyor
    expect(tatilBul('2029-04-23')?.kod).toBe('ulusal-egemenlik');
    expect(gunBilgisi('2029-04-23').tatil).toBe('tam');
    // 2033 Ramazan arifesi yılbaşına denk geliyor
    expect(tatilBul('2033-01-01')?.kod).toBe('yilbasi');
  });
});

describe('bayramlar', () => {
  it('2033 yılında iki Ramazan Bayramı', () => {
    const ramazan = bayramlar(2033).filter((b) => b.tur === 'ramazan');
    expect(ramazan.map((b) => [b.arife, b.baslangic, b.bitis])).toEqual([
      ['2033-01-01', '2033-01-02', '2033-01-04'],
      ['2033-12-22', '2033-12-23', '2033-12-25'],
    ]);
  });

  it('Kurban Bayramı dört gün sürüyor', () => {
    const k = bayramlar(2025).find((b) => b.tur === 'kurban')!;
    expect(k.gunler).toEqual(['2025-06-06', '2025-06-07', '2025-06-08', '2025-06-09']);
    expect(k.arife).toBe('2025-06-05');
  });
});

describe('idari izinler', () => {
  it('varsayılan olarak dahil değil', () => {
    expect(tatilMi('2024-04-08')).toBe(false);
    expect(tatilMi('2024-04-08', { idariIzin: true })).toBe(true);
  });

  it('sabah idari izin ile öğleden sonra arife birleşince tam gün', () => {
    expect(gunBilgisi('2024-04-09').tatil).toBe('yarim');
    expect(gunBilgisi('2024-04-09', { idariIzin: true }).tatil).toBe('tam');
  });

  it('resmi tatil idari iznin önünde sıralanıyor', () => {
    const gun = gununTatilleri('2024-04-09', { idariIzin: true });
    expect(gun.map((t) => t.tur)).toEqual(['resmi', 'idari']);
  });
});

describe('gunBilgisi', () => {
  it('hafta sonunu ve tatili ayrı ayrı söylüyor', () => {
    expect(gunBilgisi('2026-03-21')).toMatchObject({ gunAdi: 'Cumartesi', haftaSonu: true, tatil: 'tam' });
    expect(gunBilgisi('2026-03-19')).toMatchObject({ gunAdi: 'Perşembe', haftaSonu: false, tatil: 'yarim' });
    expect(gunBilgisi('2026-03-18').tatil).toBe('yok');
  });

  it('Date nesnesini İstanbul saatine göre değerlendiriyor', () => {
    // UTC'de 28 Ekim 21:30, İstanbul'da 29 Ekim 00:30
    expect(tatilBul(new Date('2025-10-28T21:30:00Z'))?.kod).toBe('cumhuriyet');
    expect(tatilBul(new Date('2025-10-28T20:30:00Z'))?.kod).toBe('cumhuriyet-arife');
  });
});

describe('sonrakiTatil / oncekiTatil', () => {
  it('verilen günü saymıyor', () => {
    expect(sonrakiTatil('2026-10-29')?.tarih).toBe('2027-01-01');
    expect(oncekiTatil('2026-01-01')?.tarih).toBe('2025-10-29');
  });

  it('filtre ile tam gün olanı buluyor', () => {
    expect(sonrakiTatil('2026-10-27')?.kod).toBe('cumhuriyet-arife');
    expect(sonrakiTatil('2026-10-27', { filtre: (t) => !t.yarimGun })?.kod).toBe('cumhuriyet');
  });
});

describe('tatilAraligi', () => {
  it('yıl sınırını aşıyor ve ters sırayı düzeltiyor', () => {
    const a = tatilAraligi('2025-12-01', '2026-01-31').map((t) => t.tarih);
    expect(a).toEqual(['2026-01-01']);
    expect(tatilAraligi('2026-01-31', '2025-12-01').map((t) => t.tarih)).toEqual(a);
  });
});

describe('tahmini hesap', () => {
  it('tablosal hesap Diyanet tarihlerinden en fazla 2 gün sapıyor', () => {
    for (const [tur, liste] of [['ramazan', RAMAZAN_BAYRAMI], ['kurban', KURBAN_BAYRAMI]] as const) {
      for (const gercek of liste) {
        const yil = Number(gercek.slice(0, 4));
        const adaylar = tahminiBayramlar(yil).filter((b) => b.tur === tur);
        const enYakin = Math.min(...adaylar.map((b) => Math.abs(gunNo(b.baslangic) - gunNo(gercek))));
        expect(enYakin, `${tur} ${gercek}`).toBeLessThanOrEqual(2);
      }
    }
  });

  it('veri dışındaki yıllarda tahmini işaretli sonuç veriyor', () => {
    const liste = tatiller(2040, { tahmini: true });
    const dini = liste.filter((t) => t.kategori === 'dini');
    expect(dini.length).toBe(9);
    expect(dini.every((t) => t.tahmini)).toBe(true);
    expect(liste.filter((t) => t.kategori !== 'dini').every((t) => !t.tahmini)).toBe(true);
  });

  it('veri içindeki yıllarda tahmini seçeneği sonucu değiştirmiyor', () => {
    expect(tatiller(2026, { tahmini: true })).toEqual(tatiller(2026));
  });
});
