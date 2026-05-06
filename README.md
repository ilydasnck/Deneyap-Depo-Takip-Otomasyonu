# Deneyap Depo Takip Otomasyonu

React + Vite + Firebase Firestore tabanlı depo takip uygulaması.

## Ozellikler

- Raf bazli urun listeleme ve arama
- Admin panelinden urun ekleme, guncelleme, silme
- Firestore ile cihazlar arasi ortak veri senkronu
- Firestore devre disiyken localStorage fallback
- Koyu/acik tema destegi

## Teknolojiler

- React 18
- TypeScript
- Vite 6
- Tailwind CSS 4
- Firebase Firestore

## Projeyi Calistirma

### 1) Gereksinimler

- Node.js 18+
- npm

### 2) Kurulum

```bash
npm install
```

### 3) Ortam Degiskenleri

`.env.example` dosyasini kopyalayip `.env` olusturun:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

`.env` icindeki temel alanlar:

- `VITE_USE_FIREBASE=true` -> Firestore aktif
- `VITE_USE_FIREBASE=false` -> localStorage modu
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID` vb. -> Firebase ayarlari
- `VITE_ADMIN_PASSWORD` -> istemci tarafinda kontrol edilir (guvenli gizli saklama icin server-side dogrulama onerilir)

### 4) Gelistirme

```bash
npm run dev
```

### 5) Build

```bash
npm run build
```

### 6) Build Onizleme

```bash
npm run preview
```

## Firebase Notlari

- Firestore koleksiyonu: `inventory_items`
- Canli ortamda `.env` degisikligi sonrasi yeniden deploy gereklidir.
- Firestore kurallari dogru ayarlanmadiginda okuma/yazma hatalari alinabilir.

## Proje Yapisı (Ozet)

```text
src/
  components/
  pages/
  context/
  services/
    firebase/
    inventory/
```

## Lisans

Bu proje ticari kullanimi kisitlayan bir lisansla yayinlanmistir.
Detaylar icin `LICENSE` dosyasina bakin.
