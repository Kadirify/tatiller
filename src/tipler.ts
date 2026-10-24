import type { Kategori } from './veri/sabit';

export type { Kategori };

/**
 * - `false`: tam gün tatil
 * - `'ogleden-sonra'`: 13.00'ten itibaren tatil (arifeler, 28 Ekim)
 * - `'ogleden-once'`: sadece sabah tatil (bazı idari izinler)
 */
export type YarimGun = false | 'ogleden-sonra' | 'ogleden-once';

export interface Tatil {
  /** YYYY-AA-GG */
  tarih: string;
  /** Değişmeyen kısa kod, örneğin `kurban-bayrami-2`. Karşılaştırma için bunu kullanın. */
  kod: string;
  ad: string;
  adEn: string;
  /** `resmi`: kanunla belirlenmiş, herkes için. `idari`: sadece kamu çalışanları için. */
  tur: 'resmi' | 'idari';
  kategori: Kategori;
  yarimGun: YarimGun;
  /**
   * Diyanet'in henüz yayımlamadığı yıllar için hesapla bulunmuş bayram günü.
   * Gerçek tarihten 1-2 gün sapabilir.
   */
  tahmini: boolean;
}

export interface Bayram {
  tur: 'ramazan' | 'kurban';
  ad: string;
  adEn: string;
  /** Arife günü, öğleden sonra tatil. */
  arife: string;
  /** Bayramın ilk günü. */
  baslangic: string;
  /** Bayramın son günü. */
  bitis: string;
  /** İlk günden son güne bütün bayram günleri (arife hariç). */
  gunler: string[];
  tahmini: boolean;
}

export interface TatilSecenekleri {
  /**
   * Kamu çalışanlarına verilen idari izinleri de dahil et.
   * Özel sektörü bağlamaz. Varsayılan: false
   */
  idariIzin?: boolean;
  /**
   * Diyanet verisinin olmadığı yıllar için bayramları hesapla tahmin et.
   * Kapalıysa bu yıllarda RangeError fırlatılır. Varsayılan: false
   */
  tahmini?: boolean;
}

export interface GunBilgisi {
  tarih: string;
  /** "Pazartesi", "Salı" ... */
  gunAdi: string;
  haftaSonu: boolean;
  /** O güne denk gelen bütün tatiller (aynı güne birden fazla tatil düşebilir). */
  tatiller: Tatil[];
  /**
   * Günün ne kadarının tatil olduğu: `tam`, `yarim` ya da `yok`.
   * Hafta sonu bu alanı etkilemez, ona `haftaSonu` ile bakın.
   */
  tatil: 'tam' | 'yarim' | 'yok';
}
