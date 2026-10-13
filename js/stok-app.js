/**
 * ====================================================================
 * SITTA - SISTEM INFORMASI TIRAS & TRANSAKSI BAHAN AJAR UNIVERSITAS TERBUKA
 * Tugas Praktik 2 - STSI4209 Pemrograman Berbasis Web
 * File: js/stok-app.js (Logika Vue.js untuk Halaman Stok Bahan Ajar)
 * ====================================================================
 * 
 * Indikator Capaian yang Diimplementasikan:
 * 1. Arsitektur & Struktur Proyek Vue.js
 * 2. Data Binding & Directives:
 *    - mustaches {{ }}, v-text, v-html (untuk catatanHTML)
 *    - v-bind (:), v-model untuk form input, select, checkbox
 *    - v-for dengan key
 * 3. Conditional Rendering: v-if, v-else-if, v-else, v-show
 * 4. Computed Properties: caching filter & sorting, ringkasan statistik
 * 5. Watchers (Minimal 2):
 *    - Watcher 1: Memantau filterUpbjj (reset kategori dependent)
 *    - Watcher 2: Memantau perubahan stok (deep watcher re-order alert)
 * 6. Validasi formulir input tambah dan edit stok
 */

// Data awal dummy bahan ajar SITTA UT sesuai template dataBahanAjar.js
var initialStokData = [
  {
    kode: "EKMA4116",
    judul: "Pengantar Manajemen",
    kategori: "MK Wajib",
    upbjj: "Jakarta",
    lokasiRak: "R1-A3",
    harga: 65000,
    qty: 28,
    safety: 20,
    catatanHTML: "<em>Edisi 2024, cetak ulang</em>"
  },
  {
    kode: "EKMA4115",
    judul: "Pengantar Akuntansi",
    kategori: "MK Wajib",
    upbjj: "Jakarta",
    lokasiRak: "R1-A4",
    harga: 60000,
    qty: 7,
    safety: 15,
    catatanHTML: "<strong>Cover baru</strong>"
  },
  {
    kode: "BIOL4201",
    judul: "Biologi Umum (Praktikum)",
    kategori: "Praktikum",
    upbjj: "Surabaya",
    lokasiRak: "R3-B2",
    harga: 80000,
    qty: 12,
    safety: 10,
    catatanHTML: "Butuh <u>pendingin</u> untuk kit basah"
  },
  {
    kode: "FISIP4001",
    judul: "Dasar-Dasar Sosiologi",
    kategori: "MK Pilihan",
    upbjj: "Makassar",
    lokasiRak: "R2-C1",
    harga: 55000,
    qty: 2,
    safety: 8,
    catatanHTML: "Stok <i>menipis</i>, prioritaskan reorder"
  },
  {
    kode: "PUST4104",
    judul: "Pengantar Ilmu Perpustakaan",
    kategori: "MK Wajib",
    upbjj: "Denpasar",
    lokasiRak: "R4-D1",
    harga: 48000,
    qty: 0,
    safety: 10,
    catatanHTML: "<span style='color:red;'>Habis total di gudang pusat</span>"
  }
];

var app = new Vue({
  el: '#app',
  data: {
    // 1. Data Referensi Master dari SITTA
    upbjjList: ["Jakarta", "Surabaya", "Makassar", "Padang", "Denpasar"],
    kategoriList: ["MK Wajib", "MK Pilihan", "Praktikum", "Problem-Based"],
    
    // 2. Data Stok Bahan Ajar
    stok: [],
    
    // 3. State Filter & Sorting
    filterUpbjj: '',             // Filter UT-Daerah
    filterKategori: '',          // Filter Kategori (Dependent pada UT-Daerah)
    filterHanyaKritis: false,    // Filter stok < safety atau qty == 0 (Re-order alert)
    searchKeyword: '',           // Pencarian judul / kode MK
    sortBy: 'judul_asc',         // Sort: judul_asc, judul_desc, stock_asc, stock_desc, harga_asc, harga_desc
    
    // 4. State Modal Tambah Bahan Ajar Baru
    showAddModal: false,
    formTambah: {
      kode: '',
      judul: '',
      kategori: '',
      upbjj: '',
      lokasiRak: '',
      harga: null,
      qty: null,
      safety: null,
      catatanHTML: ''
    },
    errorTambah: {},             // Menyimpan pesan validasi form tambah
    
    // 5. State Modal Edit Bahan Ajar
    showEditModal: false,
    formEdit: {
      index: -1,
      kode: '',
      judul: '',
      kategori: '',
      upbjj: '',
      lokasiRak: '',
      harga: null,
      qty: null,
      safety: null,
      catatanHTML: ''
    },
    errorEdit: {},               // Menyimpan pesan validasi form edit
    
    // 6. UI Toast Notifikasi
    toast: {
      show: false,
      message: '',
      type: 'info' // success, warning, danger
    },
    
    // 7. Watcher Logging & Status Info
    watcherLog: ''
  },

  // ====================================================================
  // COMPUTED PROPERTIES (Mengoptimasi filter & sort dengan mekanisme cache Vue)
  // Syarat tugas: "Terapkan fitur di vue.js di mana di semua filter tidak perlu recompute kembali"
  // Computed property di Vue secara otomatis di-cache berdasarkan dependensi reaktifnya.
  // ====================================================================
  computed: {
    /**
     * Menyaring dan mengurutkan stok secara reaktif dan otomatis di-cache oleh Vue.
     */
    filteredAndSortedStok: function () {
      var self = this;
      var hasil = self.stok.filter(function (item) {
        // Filter 1: UT-Daerah
        if (self.filterUpbjj && item.upbjj !== self.filterUpbjj) {
          return false;
        }

        // Filter 2: Kategori (hanya berlaku jika filter UT-Daerah terpilih atau ditentukan)
        if (self.filterKategori && item.kategori !== self.filterKategori) {
          return false;
        }

        // Filter 3: Hanya stok kritis (qty < safety atau qty === 0) untuk re-order
        if (self.filterHanyaKritis) {
          if (item.qty >= item.safety) {
            return false;
          }
        }

        // Filter 4: Search Keyword (Kode atau Judul)
        if (self.searchKeyword.trim() !== '') {
          var query = self.searchKeyword.toLowerCase();
          var matchKode = item.kode.toLowerCase().includes(query);
          var matchJudul = item.judul.toLowerCase().includes(query);
          if (!matchKode && !matchJudul) {
            return false;
          }
        }

        return true;
      });

      // Proses Pengurutan (Sorting)
      hasil.sort(function (a, b) {
        if (self.sortBy === 'judul_asc') {
          return a.judul.localeCompare(b.judul);
        } else if (self.sortBy === 'judul_desc') {
          return b.judul.localeCompare(a.judul);
        } else if (self.sortBy === 'stock_asc') {
          return a.qty - b.qty;
        } else if (self.sortBy === 'stock_desc') {
          return b.qty - a.qty;
        } else if (self.sortBy === 'harga_asc') {
          return a.harga - b.harga;
        } else if (self.sortBy === 'harga_desc') {
          return b.harga - a.harga;
        }
        return 0;
      });

      return hasil;
    },

    /**
     * Kategori yang tersedia berdasarkan UT-Daerah yang dipilih
     * Menghasilkan dependent option dinamis
     */
    kategoriTersediaDiUpbjj: function () {
      if (!this.filterUpbjj) {
        return this.kategoriList;
      }
      var self = this;
      var kategoriSet = {};
      this.stok.forEach(function (item) {
        if (item.upbjj === self.filterUpbjj) {
          kategoriSet[item.kategori] = true;
        }
      });
      var keys = Object.keys(kategoriSet);
      return keys.length > 0 ? keys : this.kategoriList;
    },

    /**
     * Ringkasan Statistik Stok untuk Kartu Dashboard
     */
    totalBahanAjar: function () {
      return this.stok.length;
    },
    jumlahAman: function () {
      return this.stok.filter(function (i) { return i.qty >= i.safety; }).length;
    },
    jumlahMenipis: function () {
      return this.stok.filter(function (i) { return i.qty > 0 && i.qty < i.safety; }).length;
    },
    jumlahKosong: function () {
      return this.stok.filter(function (i) { return i.qty === 0; }).length;
    },
    jumlahPerluReorder: function () {
      return this.stok.filter(function (i) { return i.qty < i.safety; }).length;
    }
  },

  // ====================================================================
  // WATCHERS (Pemantau perubahan data - Minimal 2 Watcher sesuai Soal)
  // ====================================================================
  watch: {
    /**
     * WATCHER 1: Memantau pilihan filter UT-Daerah (filterUpbjj)
     * Ketika filter UT-Daerah berubah, sistem secara otomatis mereset
     * filterKategori karena filter kategori bersifat dependent terhadap UT-Daerah.
     */
    filterUpbjj: function (newVal, oldVal) {
      if (newVal !== oldVal) {
        this.filterKategori = ''; // Reset dependent category filter
        if (newVal) {
          this.triggerToast('Filter diterapkan untuk UT-Daerah: ' + newVal + '. Kategori telah disesuaikan.', 'info');
        } else {
          this.triggerToast('Menampilkan seluruh UT-Daerah.', 'info');
        }
      }
    },

    /**
     * WATCHER 2: Memantau perubahan array stok secara mendalam (deep: true)
     * Memantau jika ada perubahan kuantitas stok bahan ajar,
     * dan memberikan notifikasi peringatan jika ada item yang habis atau menipis.
     */
    stok: {
      handler: function (newStok) {
        // Simpan perubahan ke LocalStorage
        localStorage.setItem('sitta_stok_data', JSON.stringify(newStok));
        
        // Cek item kritis
        var kosong = newStok.filter(function (s) { return s.qty === 0; }).length;
        var menipis = newStok.filter(function (s) { return s.qty > 0 && s.qty < s.safety; }).length;
        
        if (kosong > 0) {
          this.watcherLog = 'Peringatan: Terdapat ' + kosong + ' bahan ajar dalam status KOSONG!';
        } else if (menipis > 0) {
          this.watcherLog = 'Perhatian: Terdapat ' + menipis + ' bahan ajar dalam status MENIPIS.';
        } else {
          this.watcherLog = 'Semua stok bahan ajar dalam kondisi aman.';
        }
      },
      deep: true
    },

    /**
     * WATCHER 3 (Tambahan): Memantau checkbox filterHanyaKritis
     */
    filterHanyaKritis: function (val) {
      if (val) {
        this.triggerToast('Mode Re-order aktif: Menampilkan hanya stok menipis dan kosong.', 'warning');
      }
    }
  },

  // ====================================================================
  // METHODS (Fungsi interaksi dan manipulasi data)
  // ====================================================================
  methods: {
    // Format mata uang Rupiah
    formatRupiah: function (angka) {
      if (angka === null || angka === undefined) return 'Rp 0';
      return 'Rp ' + Number(angka).toLocaleString('id-ID');
    },

    // Reset seluruh filter ke keadaan awal
    resetFilter: function () {
      this.filterUpbjj = '';
      this.filterKategori = '';
      this.filterHanyaKritis = false;
      this.searchKeyword = '';
      this.sortBy = 'judul_asc';
      this.triggerToast('Semua filter berhasil di-reset.', 'info');
    },

    // Buka Modal Tambah Bahan Ajar
    openAddModal: function () {
      this.formTambah = {
        kode: '',
        judul: '',
        kategori: '',
        upbjj: '',
        lokasiRak: '',
        harga: 50000,
        qty: 10,
        safety: 10,
        catatanHTML: ''
      };
      this.errorTambah = {};
      this.showAddModal = true;
    },

    // Validasi Form Tambah Sederhana
    validateTambah: function () {
      this.errorTambah = {};
      var f = this.formTambah;

      if (!f.kode || f.kode.trim() === '') {
        this.errorTambah.kode = 'Kode mata kuliah wajib diisi!';
      } else {
        // Cek apakah kode sudah digunakan
        var exists = this.stok.some(function (item) {
          return item.kode.toLowerCase() === f.kode.trim().toLowerCase();
        });
        if (exists) {
          this.errorTambah.kode = 'Kode mata kuliah sudah ada dalam daftar!';
        }
      }

      if (!f.judul || f.judul.trim().length < 3) {
        this.errorTambah.judul = 'Nama mata kuliah minimal 3 karakter!';
      }
      if (!f.kategori) {
        this.errorTambah.kategori = 'Pilih kategori mata kuliah!';
      }
      if (!f.upbjj) {
        this.errorTambah.upbjj = 'Pilih UT-Daerah!';
      }
      if (!f.lokasiRak || f.lokasiRak.trim() === '') {
        this.errorTambah.lokasiRak = 'Lokasi rak wajib diisi (contoh: R1-A1)!';
      }
      if (f.harga === null || f.harga <= 0) {
        this.errorTambah.harga = 'Harga harus berupa angka lebih dari 0!';
      }
      if (f.qty === null || f.qty < 0) {
        this.errorTambah.qty = 'Jumlah stok tidak boleh kurang dari 0!';
      }
      if (f.safety === null || f.safety < 0) {
        this.errorTambah.safety = 'Safety stock tidak boleh kurang dari 0!';
      }

      return Object.keys(this.errorTambah).length === 0;
    },

    // Simpan Data Bahan Ajar Baru
    simpanBahanAjarBaru: function () {
      if (!this.validateTambah()) {
        return;
      }

      var itemBaru = {
        kode: this.formTambah.kode.trim().toUpperCase(),
        judul: this.formTambah.judul.trim(),
        kategori: this.formTambah.kategori,
        upbjj: this.formTambah.upbjj,
        lokasiRak: this.formTambah.lokasiRak.trim(),
        harga: Number(this.formTambah.harga),
        qty: Number(this.formTambah.qty),
        safety: Number(this.formTambah.safety),
        catatanHTML: this.formTambah.catatanHTML.trim() || '<em>Tidak ada catatan</em>'
      };

      this.stok.push(itemBaru);
      this.showAddModal = false;
      this.triggerToast('Bahan ajar ' + itemBaru.kode + ' berhasil ditambahkan!', 'success');
    },

    // Buka Modal Edit
    openEditModal: function (item) {
      var index = this.stok.indexOf(item);
      this.formEdit = {
        index: index,
        kode: item.kode,
        judul: item.judul,
        kategori: item.kategori,
        upbjj: item.upbjj,
        lokasiRak: item.lokasiRak,
        harga: item.harga,
        qty: item.qty,
        safety: item.safety,
        catatanHTML: item.catatanHTML
      };
      this.errorEdit = {};
      this.showEditModal = true;
    },

    // Validasi Form Edit Sederhana
    validateEdit: function () {
      this.errorEdit = {};
      var f = this.formEdit;

      if (!f.judul || f.judul.trim().length < 3) {
        this.errorEdit.judul = 'Nama mata kuliah minimal 3 karakter!';
      }
      if (!f.lokasiRak || f.lokasiRak.trim() === '') {
        this.errorEdit.lokasiRak = 'Lokasi rak wajib diisi!';
      }
      if (f.harga === null || f.harga <= 0) {
        this.errorEdit.harga = 'Harga harus lebih dari 0!';
      }
      if (f.qty === null || f.qty < 0) {
        this.errorEdit.qty = 'Jumlah stok tidak boleh kurang dari 0!';
      }
      if (f.safety === null || f.safety < 0) {
        this.errorEdit.safety = 'Safety stock tidak boleh kurang dari 0!';
      }

      return Object.keys(this.errorEdit).length === 0;
    },

    // Simpan Perubahan Edit Stok
    simpanEditStok: function () {
      if (!this.validateEdit()) {
        return;
      }

      var idx = this.formEdit.index;
      if (idx >= 0 && idx < this.stok.length) {
        // Update data pada array menggunakan Vue.set untuk reaktivitas sempurna
        var updatedItem = {
          kode: this.formEdit.kode,
          judul: this.formEdit.judul.trim(),
          kategori: this.formEdit.kategori,
          upbjj: this.formEdit.upbjj,
          lokasiRak: this.formEdit.lokasiRak.trim(),
          harga: Number(this.formEdit.harga),
          qty: Number(this.formEdit.qty),
          safety: Number(this.formEdit.safety),
          catatanHTML: this.formEdit.catatanHTML.trim() || '<em>-</em>'
        };

        Vue.set(this.stok, idx, updatedItem);
        this.showEditModal = false;
        this.triggerToast('Data stok ' + updatedItem.kode + ' berhasil diperbarui!', 'success');
      }
    },

    // Hapus Bahan Ajar
    hapusBahanAjar: function (item) {
      if (confirm('Apakah Anda yakin ingin menghapus bahan ajar "' + item.judul + '" (' + item.kode + ')?')) {
        var idx = this.stok.indexOf(item);
        if (idx !== -1) {
          this.stok.splice(idx, 1);
          this.triggerToast('Bahan ajar ' + item.kode + ' berhasil dihapus.', 'warning');
        }
      }
    },

    // Reset ke data awal dummy
    resetDataKeAwal: function () {
      if (confirm('Kembalikan seluruh daftar stok ke data awal template tugas?')) {
        this.stok = JSON.parse(JSON.stringify(initialStokData));
        localStorage.removeItem('sitta_stok_data');
        this.triggerToast('Data stok berhasil dikembalikan ke template awal.', 'info');
      }
    },

    // Pemicu Toast Notifikasi
    triggerToast: function (message, type) {
      var self = this;
      this.toast.message = message;
      this.toast.type = type || 'info';
      this.toast.show = true;
      setTimeout(function () {
        self.toast.show = false;
      }, 3500);
    }
  },

  // ====================================================================
  // LIFECYCLE HOOK: MOUNTED
  // ====================================================================
  mounted: function () {
    // Muat data dari localStorage jika ada, atau gunakan initialStokData
    var saved = localStorage.getItem('sitta_stok_data');
    if (saved) {
      try {
        this.stok = JSON.parse(saved);
      } catch (e) {
        this.stok = JSON.parse(JSON.stringify(initialStokData));
      }
    } else {
      this.stok = JSON.parse(JSON.stringify(initialStokData));
    }
  }
});
