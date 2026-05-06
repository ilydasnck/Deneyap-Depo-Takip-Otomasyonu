# Deneyap Depo Takip Otomasyonu

React + Vite + Firebase Firestore tabanlı depo takip uygulaması.

## Özellikler

- Raf bazlı ürün listeleme ve arama
- Admin panelinden ürün ekleme, güncelleme, silme
- Firestore ile cihazlar arası ortak veri senkronu
- Firestore devre dışıyken localStorage fallback
- Koyu/açık tema desteği

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

`.env.example` dosyasını kopyalayıp `.env` oluşturun:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

`.env` içindeki temel alanlar:

- `VITE_USE_FIREBASE=true` -> Firestore aktif
- `VITE_USE_FIREBASE=false` -> localStorage modu
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID` vb. -> Firebase ayarları
- `VITE_ADMIN_PASSWORD` -> istemci tarafında kontrol edilir (guvünli gizli saklama için server-side doğrulama önerilir)

### 4) Geliştirme

```bash
npm run dev
```

### 5) Build

```bash
npm run build
```

### 6) Build Önizleme

```bash
npm run preview
```

## Firebase Notları

- Firestore koleksiyonu: `inventory_items`
- Canlı ortamda `.env` degisikligi sonrasi yeniden deploy gereklidir.
- Firestore kuralları doğru ayarlanmadığında okuma/yazma hataları alınabilir.

## Proje Yapisı (Özet)

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

Bu proje ticari kullanımı kısıtlayan bir lisansla yayınlanmıştır.
Detaylar için `LICENSE` dosyasına bakın.
