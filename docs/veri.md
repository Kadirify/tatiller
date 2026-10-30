# Veri kaynakları

Paketteki her tarihin nereden geldiği ve nasıl güncelleneceği.

## Sabit tatiller

[`src/veri/sabit.ts`](../src/veri/sabit.ts)

Dayanak 2429 sayılı Ulusal Bayram ve Genel Tatiller Hakkında Kanun (RG 19.03.1981, sayı 17284).

| Tatil | Kanundaki yeri | Not |
|---|---|---|
| 28 Ekim 13.00 - 29 Ekim | Madde 1, ulusal bayram | Tek "ulusal bayram" bu, `kategori: 'ulusal'` |
| 1 Ocak | Madde 2 | |
| 23 Nisan | Madde 2 | |
| 1 Mayıs | Madde 2 | 5892 sayılı Kanun, RG 27.04.2009 |
| 19 Mayıs | Madde 2 | |
| 15 Temmuz | Madde 2 | 6752 sayılı Kanun, RG 29.10.2016. İlk kez 2017'de tatil |
| 30 Ağustos | Madde 2 | |
| Ramazan Bayramı | Madde 2 | Arife 13.00'ten itibaren + 3 gün |
| Kurban Bayramı | Madde 2 | Arife 13.00'ten itibaren + 4 gün |

Hafta sonuna denk gelen tatil başka güne kaydırılmıyor, kanunda böyle bir hüküm yok.

## Bayram tarihleri

[`src/veri/bayramlar.ts`](../src/veri/bayramlar.ts)

Sadece her bayramın **ilk günü** tutuluyor. Arife ve diğer günler koddan türetiliyor.

- **2022-2035:** Diyanet İşleri Başkanlığı, Dini Günler Listesi.
  2022-2026 için `https://vakithesaplama.diyanet.gov.tr/dinigunler.php?yil=YYYY`,
  2027 ve sonrası için aynı sitedeki yıllık "Dini Günler Listesi" sayfaları.
- **2010-2021:** Diyanet takvimi. Basın Yayın ve Enformasyon Genel Müdürlüğü'nün yayımladığı
  1900-2027 bayram tablosu ve o yılların resmi tatil duyurularıyla karşılaştırıldı.

Diyanet 2016'dan beri İstanbul'da yapılan Uluslararası Hicri Takvim Birliği Kongresi
kararlarına göre hesaplıyor. Bu yüzden bazı yıllarda Suudi Arabistan'daki ya da
internetteki genel hicri takvim çeviricilerinin verdiği tarihten bir gün farklı. Paket
tarihi hesaplamıyor, Diyanet'in yayımladığını kullanıyor.

### Tablo nasıl kontrol ediliyor

Tarihler elle girildiği için [`test/veri.test.ts`](../test/veri.test.ts) şunlara bakıyor:

- Art arda iki Ramazan (ya da iki Kurban) bayramı arası 353-356 gün olmalı (bir hicri yıl).
- Ramazan Bayramı ile ardından gelen Kurban Bayramı arası 67-69 gün olmalı
  (Şevval + Zilkade + 9 gün).
- 2010-2035 arasındaki her yılda en az bir Ramazan ve bir Kurban bayramı olmalı.

Yanlış bir rakam yazılırsa bu kontrollerden biri neredeyse kesin kırılıyor.

### Diyanet yeni yıl yayımlarsa

1. Diyanet'in ilgili yıl sayfasından "Ramazan Bayramı 1. Gün" ve "Kurban Bayramı 1. Gün"
   tarihlerini alın.
2. `RAMAZAN_BAYRAMI` ve `KURBAN_BAYRAMI` dizilerinin sonuna ekleyin (sıralı kalmalı).
3. `VERI_SON_YIL` değerini güncelleyin.
4. `npm test` çalıştırın.

## Tahmini bayramlar

[`src/hicri.ts`](../src/hicri.ts)

Diyanet'in listesi 2035'te bitiyor. Sonrası için tablosal (aritmetik) hicri takvim
kullanılıyor: 30 yıllık döngüde 11 artık yıl. Astronomik değil, o yüzden gerçek tarihten
sapabilir. Testte 2010-2035 arasındaki bütün bayramlar için sapmanın en fazla 2 gün olduğu
kontrol ediliyor.

Bu hesap sadece `{ tahmini: true }` verildiğinde devreye giriyor ve sonuçlar
`tahmini: true` olarak işaretleniyor.

## İdari izinler

[`src/veri/idari-izinler.ts`](../src/veri/idari-izinler.ts)

İdari izinler 657 sayılı Kanun'a tabi kamu personeli için, Cumhurbaşkanlığı genelgesi ya da
yazısıyla veriliyor. Resmi Gazete'de her zaman yayımlanmıyor, çoğu zaman sadece kurumlara
yazı olarak gidiyor. Bu yüzden kaynak olarak Cumhurbaşkanlığı açıklamaları ve en az iki ayrı
haber kaynağı kullanıyorum. Tek kaynaktan duyduğum ya da kaynakların çeliştiği günleri
eklemiyorum.

| Tarih | Gün | Bağlı olduğu tatil |
|---|---|---|
| 2024-04-08 | Tam | Ramazan Bayramı |
| 2024-04-09 | Sabah | Ramazan Bayramı (öğleden sonrası zaten arife) |
| 2024-06-20 | Tam | Kurban Bayramı |
| 2024-06-21 | Tam | Kurban Bayramı |
| 2025-04-02 | Tam | Ramazan Bayramı |
| 2025-04-03 | Tam | Ramazan Bayramı |
| 2025-04-04 | Tam | Ramazan Bayramı |
| 2026-05-25 | Tam | Kurban Bayramı |
| 2026-05-26 | Sabah | Kurban Bayramı (öğleden sonrası zaten arife) |

İdari izin verilmeyen bayramlar (soruluyor diye not ediyorum):

- 2025 Kurban Bayramı: sadece 5 Haziran öğleden sonrası (zaten arife), ek gün verilmedi.
- 2026 Ramazan Bayramı: 9 güne uzatılacağı konuşuldu ama karar çıkmadı.

Yeni karar eklerken PR açıklamasına kaynak linklerini koyun.

## Otomatik yayın (json dalı)

[`.github/workflows/json.yml`](../.github/workflows/json.yml) her push'ta ve her gece 00.05'te
(İstanbul) [`scripts/json-uret.ts`](../scripts/json-uret.ts) betiğini çalıştırıp çıktıyı `json`
dalına koyuyor. Dal her seferinde tek commit olarak yeniden yazılıyor, geçmiş tutulmuyor;
dosyalar zaten koddan üretildiği için gerek yok.

Yerelde aynı çıktıyı görmek için:

```
npm run json -- json-cikti
```

GitHub, 60 gün boyunca hiç commit gelmeyen herkese açık repolarda zamanlanmış iş akışlarını
kapatıyor. Böyle olursa Actions sekmesinden "JSON" iş akışını yeniden etkinleştirmek yeterli.
