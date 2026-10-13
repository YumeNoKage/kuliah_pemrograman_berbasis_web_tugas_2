# Tugas Praktik 2 - Pemrograman Berbasis Web (STSI4209)
## Aplikasi SITTA Universitas Terbuka (Sistem Informasi Tiras & Transaksi Bahan Ajar)

Proyek ini dibuat untuk memenuhi **Tugas Praktik 2** mata kuliah **Pemrograman Berbasis Web (STSI4209) Sesi 5 Universitas Terbuka**. Proyek ini mengimplementasikan framework **Vue.js** (Options API CDN) tanpa komponen build tools yang rumit, sesuai dengan struktur proyek dan panduan tugas.

---

## 📁 Struktur Direktori Proyek

Sesuai dengan ketentuan pada lembar soal tugas:
```
/tugas2-vue-ut/
├── index.html                   ← Menampilkan navigasi menu ke stok.html & tracking.html
├── stok.html                    ← Halaman 1: Stok Bahan Ajar (WAJIB)
├── tracking.html                ← Halaman 2: Tracking Delivery Order / DO (WAJIB)
├── css/
│   └── style.css                ← Berisi desain tampilan modern SITTA UT (Vanilla CSS)
├── js/
│   ├── stok-app.js              ← Logika Vue.js untuk stok.html
│   └── tracking-app.js          ← Logika Vue.js untuk tracking.html
├── dataBahanAjar.js             ← File dummy data awal acuan dari modul UT
└── README.md                    ← Dokumentasi teknis proyek
```

---

## 🎯 Implementasi Kriteria Penilaian & Indikator Capaian

### 1. Arsitektur dan Struktur Proyek Vue.js (Bobot: 5 Poin)
- Pemisahan kode antara struktur HTML (`stok.html`, `tracking.html`, `index.html`), visual styling (`css/style.css`), dan logika reaktif (`js/stok-app.js`, `js/tracking-app.js`).
- Penamaan file dan variabel yang jelas, terstruktur, serta dilengkapi komentar penjelas berbahasa Indonesia.

### 2. Data Binding & Directive dan List Rendering (Bobot: 20 Poin)
- **Mustaches (`{{ }}`)**: Menampilkan kode MK, jumlah stok, harga rupiah, nama mahasiswa, tanggal, dll.
- **`v-text`**: Menampilkan nama mata kuliah secara deklaratif pada tabel stok.
- **`v-html`**: Menampilkan catatan bahan ajar (`catatanHTML`) yang mengandung tag HTML seperti `<em>`, `<strong>`, `<u>`.
- **`v-bind` (`:`)**: Mengikat class dinamis (`:class`), style dinamis (`:style`), atribut readonly, dan `:key`.
- **`v-model`**: Two-way data binding pada form filter (select daerah, select kategori, search input, sort select, checkbox re-order) serta form input tambah/edit bahan ajar dan formulir Delivery Order.
- **`v-for`**: Render daftar koleksi bahan ajar, daftar UPBJJ, kategori, opsi paket bahan ajar, dan riwayat timeline perjalanan.

### 3. Penggunaan Conditional Rendering (Bobot: 10 Poin)
- **`v-if` / `v-else-if` / `v-else`**:
  - Penentuan status stok bahan ajar:
    - `v-if="item.qty === 0"`: Status **Kosong** (badge merah & simbol silang)
    - `v-else-if="item.qty < item.safety"`: Status **Menipis** (badge orange & simbol peringatan)
    - `v-else`: Status **Aman** (badge hijau & simbol centang)
  - Fitur **Dependent Options**: Filter kategori baru dimunculkan jika filter UT-Daerah telah dipilih (`v-if="filterUpbjj !== ''"`).
  - Tampilan rincian isi paket bahan ajar yang muncul di bawah `<select>` (`v-if="selectedPaketDetail"`).
  - Modal tambah & edit data (`v-if="showAddModal"`, `v-if="showEditModal"`).
- **`v-show`**:
  - Menampilkan/menyembunyikan alert banner re-order dan toast notifikasi sistem tanpa menghapus DOM node.

### 4. Penggunaan Computed Properties & Methods (Bobot: 10 Poin)
- **Computed Properties (Optimasi Caching Vue.js)**:
  - `filteredAndSortedStok`: Menyaring data stok berdasarkan UT-Daerah, kategori dependent, pencarian kode/judul, dan filter re-order, serta mengurutkannya. Memenuhi syarat tugas: *"semua filter tidak perlu recompute kembali"*.
  - `generatedDONumber`: Otomatis menghasilkan nomor DO baru berformat `DO[Tahun]-[Sequence]` (contoh: `DO2025-001`, `DO2025-002`, dst.).
  - `selectedPaketDetail`: Mengambil detail paket yang dipilih secara reaktif.
  - Ringkasan statistik persediaan (total judul, aman, menipis, kosong, perlu re-order).
- **Methods**:
  - `simpanBahanAjarBaru()`, `simpanEditStok()`, `hapusBahanAjar()`.
  - `resetFilter()`, `resetDataKeAwal()`.
  - `tambahDeliveryOrder()`, `tambahCheckpoint()`, `updateStatusDO()`.
  - Format helper: `formatRupiah()`, `formatTanggalIndo()`.

### 5. Watchers Data (Minimal 2 Watcher) (Bobot: 10 Poin)
- **Pada `stok-app.js`**:
  - **Watcher 1 (`filterUpbjj`)**: Memantau perubahan filter UT-Daerah. Saat daerah berganti, filter kategori dependent otomatis di-reset ke string kosong `""` dan memunculkan toast info.
  - **Watcher 2 (`stok` dengan `deep: true`)**: Memantau perubahan data stok secara mendalam. Jika ada item yang habis atau menipis, memicu pembaruan status log sistem dan notifikasi reorder.
  - **Watcher 3 (`filterHanyaKritis`)**: Memantau toggle filter re-order.
- **Pada `tracking-app.js`**:
  - **Watcher 1 (`formDO.paket`)**: Memantau perubahan paket yang dipilih. Saat paket berganti, otomatis mengupdate `formDO.totalHarga` dari `paket.harga`.
  - **Watcher 2 (`formDO.nim`)**: Memantau input NIM mahasiswa, otomatis membersihkan karakter non-angka dan memvalidasi panjang 9 digit.
  - **Watcher 3 (`searchQuery`)**: Memantau pencarian DO secara real-time.

### 6. Formulir Input dan Validasi Input Sederhana (Bobot: 20 Poin)
- Validasi form tambah bahan ajar:
  - Cek kelengkapan kode MK, keunikan kode MK (tidak boleh duplikat).
  - Cek panjang nama mata kuliah minimal 3 karakter.
  - Validasi angka positif untuk harga satuan, stok awal, dan safety stock.
- Validasi form Delivery Order (DO):
  - Validasi panjang NIM mahasiswa (minimal 9 digit numerik).
  - Validasi nama lengkap.
  - Validasi tanggal kirim (mendukung pemilihan hari ini menggunakan fungsi local date).

### 7. Kreativitas & Antarmuka Pengguna (Bobot: 10 Poin)
- Desain antarmuka bersih bertema Universitas Terbuka (warna biru navy SITTA `#0f3d7c` dan aksen gold/kuning `#f59e0b`).
- Card statistik, indikator status yang jelas, responsive table, modal popup halus, serta toast feedback.

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi ini menggunakan Vue.js versi CDN tanpa memerlukan instalasi Node.js/NPM yang rumit.

1. Buka folder proyek di browser:
   - Klik ganda pada file `index.html`, **ATAU**
   - Jalankan local server (misal menggunakan Live Server pada VS Code atau PowerShell):
     ```powershell
     python -m http.server 8000
     # Lalu buka http://localhost:8000 di browser
     ```
2. Anda akan langsung dapat berpindah antara **Beranda**, **Stok Bahan Ajar**, dan **Tracking DO**.

---

## 📝 Catatan Penting
- Data dummy awal diinisialisasi berdasarkan template `dataBahanAjar.js`.
- Apabila Anda ingin mengembalikan data ke kondisi awal setelah melakukan pengujian penambahan atau pengeditan data, klik tombol **"Reset Template"** di bagian atas halaman.
