/**
 * Kamu çalışanlarına verilen idari izinler.
 *
 * Bunlar kanunla belirlenmiyor, her seferinde Cumhurbaşkanlığı genelgesi ya da
 * yazısıyla veriliyor ve genelde bayramı hafta sonuna bağlamak için kullanılıyor.
 * Özel sektörü bağlamaz.
 *
 * Sadece en az iki ayrı kaynaktan doğrulayabildiklerimi ekliyorum.
 * Eksik ya da yanlış gördüğünüz bir gün varsa kaynağıyla birlikte issue açın.
 */

export interface IdariIzin {
  tarih: string;
  yarimGun: false | 'ogleden-once';
  /** Hangi tatile bağlandığı. */
  neden: 'ramazan' | 'kurban' | 'cumhuriyet' | 'yilbasi' | 'diger';
}

export const IDARI_IZINLER: readonly IdariIzin[] = [
  // 2024 Ramazan Bayramı: Cumhurbaşkanlığı İdari İşler Başkanlığı yazısı, 9 günlük tatil
  { tarih: '2024-04-08', yarimGun: false, neden: 'ramazan' },
  { tarih: '2024-04-09', yarimGun: 'ogleden-once', neden: 'ramazan' },
  // 2024 Kurban Bayramı: bayram sonrası iki gün, 9 günlük tatil
  { tarih: '2024-06-20', yarimGun: false, neden: 'kurban' },
  { tarih: '2024-06-21', yarimGun: false, neden: 'kurban' },
];
