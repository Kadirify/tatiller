# tatiller

[![CI](https://github.com/Kadirify/tatiller/actions/workflows/ci.yml/badge.svg)](https://github.com/Kadirify/tatiller/actions/workflows/ci.yml)
![bağımlılık yok](https://img.shields.io/badge/ba%C4%9F%C4%B1ml%C4%B1l%C4%B1k-yok-brightgreen)
[![lisans](https://img.shields.io/badge/lisans-MIT-blue)](LICENSE)

Türkiye resmi tatilleri, Ramazan ve Kurban bayramları, iş günü hesabı ve köprü günleri.
Diyanet verisiyle, bağımlılık olmadan, TypeScript tipleriyle.

```js
import { tatiller, isGunuEkle, kopruler } from 'tatiller';

tatiller(2026);                    // yılın bütün tatilleri
isGunuEkle('2026-03-18', 5);       // '2026-03-26'  (bayram ve hafta sonu atlandı)
kopruler(2027)[3];                 // 2 gün izinle 9 gün Kurban Bayramı tatili
```

Türkiye'de tatil hesabı göründüğünden zor. Bayramlar her yıl 11 gün kayıyor ve tarihleri
hesapla değil Diyanet'in takvimiyle belli oluyor. Arifeler yarım gün. 23 Nisan 2023 gibi
bazen iki tatil aynı güne düşüyor. 2033'te iki tane Ramazan Bayramı var. Kamuya ayrıca
idari izin veriliyor ama özel sektöre verilmiyor. Bu paket bunların hepsini doğru yapmak için var.

## Kurulum

```
npm install tatiller
```

Node 20 ve üstü, tarayıcı, Deno, Bun. ESM ve CommonJS ikisi de çalışıyor.

## İçindekiler

- [Tatil listesi](#tatil-listesi)
- [Bir gün hakkında](#bir-gün-hakkında)
- [İş günü hesabı](#i̇ş-günü-hesabı)
- [Ay özeti (bordro, puantaj)](#ay-özeti)
- [Köprü günleri](#köprü-günleri)
- [Takvime aktarma (.ics)](#takvime-aktarma)
- [Komut satırı](#komut-satırı)
- [Veri ve doğruluk](#veri-ve-doğruluk)
- [Sık sorulanlar](#sık-sorulanlar)

## Tatil listesi

```js
import { tatiller, bayramlar, sonrakiTatil } from 'tatiller';

tatiller(2026);
// [
//   { tarih: '2026-01-01', kod: 'yilbasi', ad: 'Yılbaşı', ... },
//   { tarih: '2026-03-19', kod: 'ramazan-bayrami-arife', ad: 'Ramazan Bayramı Arifesi', yarimGun: 'ogleden-sonra', ... },
//   { tarih: '2026-03-20', kod: 'ramazan-bayrami-1', ad: 'Ramazan Bayramı 1. Gün', ... },
//   ...
// ]

bayramlar(2027);
// [
//   { tur: 'ramazan', arife: '2027-03-08', baslangic: '2027-03-09', bitis: '2027-03-11', gunler: [...] },
//   { tur: 'kurban',  arife: '2027-05-15', baslangic: '2027-05-16', bitis: '2027-05-19', gunler: [...] },
// ]

sonrakiTatil();                                    // bugünden sonraki ilk tatil
sonrakiTatil('2026-10-27', { filtre: (t) => !t.yarimGun }); // 29 Ekim, arifeyi atlayarak
```

Her tatil şu biçimde:

| Alan | Örnek | Açıklama |
|---|---|---|
| `tarih` | `'2026-10-29'` | Her zaman `YYYY-AA-GG` |
| `kod` | `'cumhuriyet'` | Değişmeyen kısa ad, karşılaştırma için bunu kullanın |
| `ad` / `adEn` | `'Cumhuriyet Bayramı'` / `'Republic Day'` | |
| `tur` | `'resmi'` | `resmi` herkes için, `idari` sadece kamu için |
| `kategori` | `'ulusal'` | `ulusal`, `genel`, `dini`, `idari` (2429 sayılı Kanun'daki ayrım) |
| `yarimGun` | `false` | `'ogleden-sonra'` arifelerde ve 28 Ekim'de, `'ogleden-once'` bazı idari izinlerde |
| `tahmini` | `false` | Diyanet'in yayımlamadığı yıllar için hesapla bulunan bayram günü |

Diğerleri:

- `tatilAraligi(baslangic, bitis)`: iki tarih arasındaki tatiller, yıl sınırını aşabilir
- `oncekiTatil(tarih)`: verilen günden önceki son tatil
- `DESTEKLENEN_YILLAR`: `{ ilk: 2010, son: 2035 }`

## Bir gün hakkında

```js
import { tatilMi, tatilBul, gunBilgisi } from 'tatiller';

tatilMi('2026-03-19');      // true, arife yarım gün de olsa tatil
tatilBul('2026-10-29');     // { kod: 'cumhuriyet', ad: 'Cumhuriyet Bayramı', ... }

gunBilgisi('2026-05-26');
// {
//   tarih: '2026-05-26',
//   gunAdi: 'Salı',
//   haftaSonu: false,
//   tatiller: [{ kod: 'kurban-bayrami-arife', yarimGun: 'ogleden-sonra', ... }],
//   tatil: 'yarim'
// }
```

Tarih olarak `'2026-05-26'` gibi metin ya da `Date` verebilirsiniz. `Date` her zaman
**İstanbul saatine göre** güne çevriliyor. Sunucunuz UTC'de çalışıyorsa gece 23.30'daki bir
`new Date()` yanlış güne düşmez.

Aynı güne iki tatil denk gelirse (23 Nisan 2023 hem Ulusal Egemenlik hem Ramazan Bayramı'nın
3. günü) `tatilBul` en önemlisini, `gununTatilleri` hepsini döner.

## İş günü hesabı

```js
import { isGunuMu, isGunuEkle, isGunuSay, isGunleri } from 'tatiller';

isGunuMu('2026-03-20');              // false, bayram
isGunuEkle('2026-03-18', 5);         // '2026-03-26'
isGunuEkle('2026-03-23', -1);        // '2026-03-19'
isGunuSay('2026-05-01', '2026-05-31'); // 16
isGunleri('2026-05-25', '2026-06-01'); // ['2026-05-25', '2026-05-26', '2026-06-01']
```

`isGunuEkle` başlangıç gününü saymaz, Cuma'ya 1 iş günü eklemek Pazartesi'yi verir.
`isGunuSay` da aynı mantıkla başlangıcı hariç, bitişi dahil sayar; böylece
`isGunuSay(a, isGunuEkle(a, n)) === n` her zaman doğrudur.

Her yerin çalışma düzeni farklı, o yüzden hepsi aynı seçenekleri alıyor:

```js
isGunuEkle('2026-03-18', 5, {
  haftaSonu: [0],              // sadece Pazar tatil, Cumartesi çalışılıyor (varsayılan [6, 0])
  yarimGun: 'tatil',           // arifeleri tamamen tatil say (varsayılan 'isGunu', sabahı çalışılıyor)
  idariIzin: true,             // kamu kurumu: idari izinleri de say
  ekTatiller: ['2026-12-31'],  // şirkete özel kapalı günler
  ekIsGunleri: ['2026-03-21'], // telafi için çalışılan cumartesi
});
```

Kargo teslim tarihi, iade süresi, SLA, ihale süreleri, vade hesabı gibi işler için yeterli.
Hukuki süre hesabında (tebligat, itiraz süresi) son günün tatile denk gelmesi gibi özel
kurallar var, onları kendi kodunuzda ele almanız gerekir.

## Ay özeti

```js
import { ayOzeti } from 'tatiller';

ayOzeti(2026, 5);
// {
//   yil: 2026, ay: 5, takvimGunu: 31,
//   tamIsGunu: 15, yarimIsGunu: 1, isGunu: 15.5,
//   tatil: 5, haftaSonu: 10
// }
```

`isGunu` yarım günleri 0,5 sayıyor. Bordro, puantaj ve fazla mesai hesabında aylık çalışma
günü için kullanılabilir. Seçenekler iş günü fonksiyonlarıyla aynı.

## Köprü günleri

Hangi günlerde izin alırsanız tatili uzatabileceğinizi söyler.

```js
import { kopruler } from 'tatiller';

kopruler(2027);
// [
//   { izinGunleri: ['2027-03-08'], izin: 0.5, baslangic: '2027-03-06', bitis: '2027-03-11', toplamGun: 6, tatiller: ['Ramazan Bayramı'] },
//   ...
//   { izinGunleri: ['2027-05-20', '2027-05-21'], izin: 2, baslangic: '2027-05-15', bitis: '2027-05-23', toplamGun: 9,
//     tatiller: ['Kurban Bayramı', "Atatürk'ü Anma, Gençlik ve Spor Bayramı"] },
//   ...
// ]

kopruler(2027, { enFazlaIzin: 4 }); // 4 güne kadar izin
```

Arife gibi yarım günler yarım izin sayılıyor. İş günü seçeneklerinin hepsi burada da geçerli,
Cumartesi çalışılan bir yer için `{ haftaSonu: [0] }` verirseniz ona göre hesaplar.

## Takvime aktarma

```js
import { writeFileSync } from 'node:fs';
import { ics } from 'tatiller';

writeFileSync('tatiller.ics', ics([2026, 2027]));
```

Dosyayı Google Takvim (Ayarlar, İçe aktar), Outlook ya da Apple Takvim'e açabilirsiniz.
Bayram günleri tek etkinlik olarak yazılıyor (`bayramlariBirlestir: false` ile ayrı ayrı),
arifelerin açıklamasında yarım gün olduğu yazıyor. `dil: 'en'` ile İngilizce adlar.

## Komut satırı

Kurmadan da kullanılabilir:

```
$ npx tatiller 2026

2026 yılı resmi tatilleri

   1 Ocak    Perşembe   Yılbaşı
  19 Mart    Perşembe   Ramazan Bayramı Arifesi                  yarım gün (13.00)
  20 Mart    Cuma       Ramazan Bayramı 1. Gün
  ...
  29 Ekim    Perşembe   Cumhuriyet Bayramı

Toplam 14 tam gün, 3 yarım gün. Hafta içine denk gelen tam gün: 10.
```

```
npx tatiller sonraki                  # sıradaki tatil
npx tatiller bugun                    # bugün tatil mi, iş günü mü
npx tatiller isgunu 2026-03-18 5      # 5 iş günü sonrası
npx tatiller say 2026-05-01 2026-05-31
npx tatiller ay 2026 5                # ayın iş günü özeti
npx tatiller kopru 2027 4             # en fazla 4 gün izinle köprüler
npx tatiller ics 2026 2027 > tatiller.ics
```

Seçenekler: `--idari`, `--cumartesi`, `--yarim-tatil`, `--tahmini`, `--json`, `--en`.
Ayrıntı için `npx tatiller --help`.

## Veri ve doğruluk

**Sabit tatiller** 2429 sayılı Ulusal Bayram ve Genel Tatiller Hakkında Kanun'a göre.
1 Mayıs 2009'dan, 15 Temmuz 2017'den itibaren listeye giriyor.

**Bayram tarihleri** 2010-2035 arası Diyanet İşleri Başkanlığı'nın yayımladığı dini günler
listesinden. Tarihleri hesapla bulmuyoruz, çünkü Türkiye'nin kullandığı takvim kriteri ile
internetteki genel hicri takvim formülleri bazı yıllarda bir gün farklı sonuç veriyor.

**2035 sonrası** için Diyanet'in yayımladığı bir liste yok. Bu yıllar varsayılan olarak hata
veriyor; `{ tahmini: true }` verirseniz bayramlar tablosal hicri takvimle hesaplanıyor ve
`tahmini: true` olarak işaretleniyor. Testlerde bu hesabın Diyanet tarihlerinden en fazla
2 gün saptığını kontrol ediyoruz.

**İdari izinler** kanunla değil, her seferinde Cumhurbaşkanlığı kararıyla veriliyor ve sadece
kamu çalışanlarını bağlıyor. Varsayılan olarak hesaba katılmıyor, `{ idariIzin: true }` ile
açılıyor. Yalnızca en az iki kaynaktan doğrulayabildiklerim listede, 2024'ten itibaren.

Kaynakların tamamı ve veriyi güncelleme adımları: [docs/veri.md](docs/veri.md)

## Sık sorulanlar

**Hafta sonuna denk gelen tatil Pazartesi'ye kayıyor mu?**
Hayır. Türkiye'de kayma yok, hafta sonuna düşen tatil o yıl yanmış oluyor.

**Arife tatil mi?**
Arifeler ve 28 Ekim saat 13.00'ten itibaren tatil. `tatilMi` bu günler için `true` döner,
`isGunuMu` ise sabahı çalışıldığı için varsayılan olarak `true` döner. Arifeyi tamamen tatil
saymak isterseniz `{ yarimGun: 'tatil' }`.

**"9 günlük bayram tatili" neden çıkmıyor?**
O ekstra günler idari izin, sadece kamu için. `{ idariIzin: true }` ile görürsünüz.

**Dini günler (kandiller, Aşure) var mı?**
Hayır, bu paket sadece tatil olan günlerle ilgileniyor.

**Veri ne zaman güncellenir?**
Bayram tarihleri 2035'e kadar sabit, değişmez. Yeni idari izin kararları çıktıkça eklenir.
Kaçırdığım bir karar görürseniz kaynağıyla issue açın.

## Katkı

```
npm install
npm test
npm run build
```

Veri değişikliği yapıyorsanız kaynağı PR açıklamasına ekleyin. Testler bayram tablosundaki
yazım hatalarını yakalamak için tarihler arasındaki gün farklarını da kontrol ediyor.

## Lisans

MIT
