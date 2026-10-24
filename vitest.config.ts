import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // Tarih hesaplarının sunucunun saat diliminden etkilenmediğini görmek için
    // testleri bilerek İstanbul dışında bir dilimde çalıştırıyoruz.
    env: { TZ: 'America/Los_Angeles' },
  },
});
