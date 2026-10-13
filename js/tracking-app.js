/**
 * ====================================================================
 * SITTA - SISTEM INFORMASI TIRAS & TRANSAKSI BAHAN AJAR UNIVERSITAS TERBUKA
 * Tugas Praktik 2 - STSI4209 Pemrograman Berbasis Web
 * File: js/tracking-app.js (Logika Vue.js untuk Halaman Tracking DO)
 * ====================================================================
 * 
 * Indikator Capaian yang Diimplementasikan:
 * 1. Arsitektur & Struktur Proyek Vue.js
 * 2. Data Binding & Directives:
 *    - mustaches {{ }}, v-text, v-html
 *    - v-bind (:), v-model untuk form input DO, select paket, tanggal kirim
 *    - v-for untuk daftar DO, rincian buku paket, riwayat perjalanan timeline
 * 3. Conditional Rendering:
 *    - v-if: detail isi paket di bawah <select>, timeline perjalanan aktif
 *    - v-show: notifikasi toast dan pencarian
 * 4. Computed Properties:
 *    - nextDONumber: auto-generate nomor DO (DO + Tahun + '-' + Sequence)
 *    - selectedPaketDetail: mengambil rincian paket buku dan harga otomatis
 *    - filteredTrackingList: pencarian live DO berdasarkan Nomor DO, NIM, Nama
 * 5. Watchers (Minimal 2):
 *    - Watcher 1: Memantau formDO.paket (update otomatis total harga dan detail paket)
 *    - Watcher 2: Memantau formDO.nim (validasi angka dan format digit NIM)
 *    - Watcher 3: Memantau searchQuery (pencarian real-time dengan feedback notifikasi)
 * 6. Validasi formulir input Delivery Order
 */

// Data acuan dari dataBahanAjar.js
var initialTrackingData = {
  "DO2025-001": {
    nim: "123456789",
    nama: "Rina Wulandari",
    status: "Dalam Perjalanan",
    ekspedisi: "JNE Regular (3-5 hari)",
    tanggalKirim: "2025-08-25",
    paket: "PAKET-UT-001",
    total: 120000,
    perjalanan: [
      { waktu: "2025-08-25 10:12:20", keterangan: "Penerimaan di Loket: UT TANGSEL (Pusat Distribusi)" },
      { waktu: "2025-08-25 14:07:56", keterangan: "Tiba di Hub Sortir: JAKSEL" },
      { waktu: "2025-08-26 08:44:01", keterangan: "Diteruskan ke Kantor Ekspedisi Tujuan" }
    ]
  },
  "DO2025-002": {
    nim: "041234567",
    nama: "Budi Santoso",
    status: "Terkirim",
    ekspedisi: "JNE Ekspres (1-2 hari)",
    tanggalKirim: "2025-08-20",
    paket: "PAKET-UT-002",
    total: 140000,
    perjalanan: [
      { waktu: "2025-08-20 09:15:00", keterangan: "Penerimaan di Loket: UT Surabaya" },
      { waktu: "2025-08-20 18:30:22", keterangan: "Tiba di Gateway Logistik Surabaya" },
      { waktu: "2025-08-21 11:20:45", keterangan: "Kurir mengantar paket ke alamat penerima" },
      { waktu: "2025-08-21 14:05:10", keterangan: "Paket telah diterima oleh yang bersangkutan (Budi)" }
    ]
  }
};

var app = new Vue({
  el: '#app',
  data: {
    // 1. Data Referensi Master dari SITTA (sesuai template dataBahanAjar.js)
    pengirimanList: [
      { kode: "REG", nama: "JNE Regular (3-5 hari)" },
      { kode: "EXP", nama: "JNE Ekspres (1-2 hari)" }
    ],
    
    paket: [
      { 
        kode: "PAKET-UT-001", 
        nama: "PAKET IPS Dasar", 
        isi: ["EKMA4116 - Pengantar Manajemen", "EKMA4115 - Pengantar Akuntansi"], 
        harga: 120000 
      },
      { 
        kode: "PAKET-UT-002", 
        nama: "PAKET IPA Dasar", 
        isi: ["BIOL4201 - Biologi Umum (Praktikum)", "FISIP4001 - Dasar-Dasar Sosiologi"], 
        harga: 140000 
      }
    ],

    // 2. Data Tracking Delivery Order (Object of Objects sesuai format dataBahanAjar.js)
    tracking: {},

    // 3. Form Input Delivery Order Baru
    formDO: {
      nomorDO: '',
      nim: '',
      nama: '',
      ekspedisi: 'JNE Regular (3-5 hari)',
      paket: '',
      tanggalKirim: '',
      totalHarga: 0
    },
    errorDO: {}, // Error validasi input

    // 4. State Detail Tracking yang sedang aktif dibuka
    activeDOKey: 'DO2025-001',

    // 5. Pencarian & Filter
    searchQuery: '',

    // 6. Form Tambah Checkpoint Status Tracking (Interaktif)
    newCheckpoint: '',

    // 7. Toast UI Feedback
    toast: {
      show: false,
      message: '',
      type: 'info'
    }
  },

  // ====================================================================
  // COMPUTED PROPERTIES
  // ====================================================================
  computed: {
    /**
     * Otomatis men-generate Nomor DO baru sesuai ketentuan tugas:
     * - DO
     * - Tahun Berjalan (contoh 2025 atau 2026)
     * - Sequence Number: DO2025-001, DO2025-002, DO2025-003, dst.
     */
    generatedDONumber: function () {
      var currentYear = new Date().getFullYear(); // Tahun berjalan
      var keys = Object.keys(this.tracking);
      var maxSeq = 0;

      keys.forEach(function (key) {
        // Ekstrak sequence number dari format DOYYYY-XXX
        var parts = key.split('-');
        if (parts.length === 2) {
          var num = parseInt(parts[1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      });

      var nextSeq = maxSeq + 1;
      var padNumber = nextSeq < 10 ? '00' + nextSeq : (nextSeq < 100 ? '0' + nextSeq : nextSeq);
      return 'DO' + currentYear + '-' + padNumber;
    },

    /**
     * Mengambil detail paket yang sedang dipilih pada elemen <select>
     * Sesuai ketentuan: Setelah memilih paket, muncul detail isi paket di bawah <select>
     */
    selectedPaketDetail: function () {
      var self = this;
      if (!this.formDO.paket) return null;
      return this.paket.find(function (p) {
        return p.kode === self.formDO.paket;
      }) || null;
    },

    /**
     * Konversi object tracking ke dalam bentuk array yang bisa difilter & diurutkan
     */
    trackingArrayList: function () {
      var list = [];
      for (var noDO in this.tracking) {
        if (this.tracking.hasOwnProperty(noDO)) {
          var item = JSON.parse(JSON.stringify(this.tracking[noDO]));
          item.nomorDO = noDO;
          list.push(item);
        }
      }
      // Urutkan dari yang terbaru (reverse)
      list.reverse();
      return list;
    },

    /**
     * Filter daftar tracking berdasarkan keyword pencarian (Nomor DO, NIM, atau Nama)
     */
    filteredTrackingList: function () {
      var self = this;
      if (!this.searchQuery.trim()) {
        return this.trackingArrayList;
      }
      var q = this.searchQuery.toLowerCase().trim();
      return this.trackingArrayList.filter(function (item) {
        var matchDO = item.nomorDO.toLowerCase().includes(q);
        var matchNIM = item.nim.toLowerCase().includes(q);
        var matchNama = item.nama.toLowerCase().includes(q);
        return matchDO || matchNIM || matchNama;
      });
    },

    /**
     * Data DO yang sedang dipilih untuk ditampilkan detail perjalanannya
     */
    activeTrackingDetail: function () {
      if (!this.activeDOKey || !this.tracking[this.activeDOKey]) {
        // Ambil data pertama jika key tidak ditemukan
        var keys = Object.keys(this.tracking);
        if (keys.length > 0) {
          return Object.assign({ nomorDO: keys[0] }, this.tracking[keys[0]]);
        }
        return null;
      }
      return Object.assign({ nomorDO: this.activeDOKey }, this.tracking[this.activeDOKey]);
    },

    /**
     * Ringkasan Statistik DO
     */
    totalDOTersimpan: function () {
      return Object.keys(this.tracking).length;
    },
    totalDalamPerjalanan: function () {
      var self = this;
      return Object.keys(this.tracking).filter(function (k) {
        return self.tracking[k].status === 'Dalam Perjalanan';
      }).length;
    },
    totalTerkirim: function () {
      var self = this;
      return Object.keys(this.tracking).filter(function (k) {
        return self.tracking[k].status === 'Terkirim';
      }).length;
    }
  },

  // ====================================================================
  // WATCHERS (Pemantau Perubahan Data - Minimal 2 Sesuai Soal)
  // ====================================================================
  watch: {
    /**
     * WATCHER 1: Memantau perubahan paket yang dipilih pada formDO.paket
     * Ketika paket dipilih, otomatis update totalHarga dari array paket -> harga
     * dan memberikan umpan balik informasi paket.
     */
    'formDO.paket': function (newPaketKode, oldPaketKode) {
      if (newPaketKode) {
        var selected = this.paket.find(function (p) {
          return p.kode === newPaketKode;
        });
        if (selected) {
          this.formDO.totalHarga = selected.harga;
          this.triggerToast('Paket terpilih: ' + selected.nama + ' (' + this.formatRupiah(selected.harga) + ')', 'info');
        }
      } else {
        this.formDO.totalHarga = 0;
      }
    },

    /**
     * WATCHER 2: Memantau input NIM mahasiswa (formDO.nim)
     * Memastikan hanya digit numerik yang diizinkan dan memvalidasi panjang 9 digit.
     */
    'formDO.nim': function (newNIM, oldNIM) {
      if (newNIM) {
        // Bersihkan karakter non-digit
        var cleaned = newNIM.replace(/\D/g, '');
        if (cleaned !== newNIM) {
          this.$nextTick(function () {
            this.formDO.nim = cleaned;
          });
        }
        // Validasi feedback
        if (cleaned.length > 0 && cleaned.length < 9) {
          this.errorDO.nim = 'NIM mahasiswa UT umumnya terdiri dari 9 digit (saat ini: ' + cleaned.length + ' digit).';
        } else {
          delete this.errorDO.nim;
        }
      }
    },

    /**
     * WATCHER 3 (Tambahan): Memantau query pencarian (searchQuery)
     */
    searchQuery: function (query) {
      if (query.trim()) {
        // Otomatis arahkan activeDOKey ke hasil pertama jika ada
        var match = this.filteredTrackingList;
        if (match.length > 0) {
          this.activeDOKey = match[0].nomorDO;
        }
      }
    }
  },

  // ====================================================================
  // METHODS
  // ====================================================================
  methods: {
    // Format mata uang Rupiah
    formatRupiah: function (angka) {
      if (angka === null || angka === undefined) return 'Rp 0';
      return 'Rp ' + Number(angka).toLocaleString('id-ID');
    },

    // Format tanggal ke format lokal Indonesia
    formatTanggalIndo: function (strDate) {
      if (!strDate) return '-';
      var d = new Date(strDate);
      if (isNaN(d.getTime())) return strDate;
      return d.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },

    // Ambil tanggal hari ini (Local Time) sesuai ketentuan tugas
    setTanggalHariIni: function () {
      var now = new Date();
      var year = now.getFullYear();
      var month = String(now.getMonth() + 1).padStart(2, '0');
      var day = String(now.getDate()).padStart(2, '0');
      this.formDO.tanggalKirim = year + '-' + month + '-' + day;
      this.triggerToast('Tanggal kirim diatur ke hari ini: ' + this.formDO.tanggalKirim, 'info');
    },

    // Ambil timestamp waktu sekarang untuk timeline perjalanan
    getNowTimestamp: function () {
      var now = new Date();
      var year = now.getFullYear();
      var month = String(now.getMonth() + 1).padStart(2, '0');
      var day = String(now.getDate()).padStart(2, '0');
      var hours = String(now.getHours()).padStart(2, '0');
      var minutes = String(now.getMinutes()).padStart(2, '0');
      var seconds = String(now.getSeconds()).padStart(2, '0');
      return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
    },

    // Validasi Form Input Delivery Order Baru
    validateFormDO: function () {
      this.errorDO = {};
      var f = this.formDO;

      if (!f.nim || f.nim.trim().length < 9) {
        this.errorDO.nim = 'NIM wajib diisi dengan minimal 9 digit angka!';
      }
      if (!f.nama || f.nama.trim().length < 3) {
        this.errorDO.nama = 'Nama lengkap mahasiswa minimal 3 karakter!';
      }
      if (!f.ekspedisi) {
        this.errorDO.ekspedisi = 'Pilih jenis ekspedisi pengiriman!';
      }
      if (!f.paket) {
        this.errorDO.paket = 'Pilih paket bahan ajar yang dipesan!';
      }
      if (!f.tanggalKirim) {
        this.errorDO.tanggalKirim = 'Tanggal kirim wajib ditentukan!';
      }

      return Object.keys(this.errorDO).length === 0;
    },

    // Submit & Tambah Delivery Order Baru
    tambahDeliveryOrder: function () {
      if (!this.validateFormDO()) {
        this.triggerToast('Mohon lengkapi formulir input DO dengan benar!', 'danger');
        return;
      }

      var noDO = this.generatedDONumber;
      var newDO = {
        nim: this.formDO.nim.trim(),
        nama: this.formDO.nama.trim(),
        status: "Dalam Perjalanan",
        ekspedisi: this.formDO.ekspedisi,
        tanggalKirim: this.formDO.tanggalKirim,
        paket: this.formDO.paket,
        total: Number(this.formDO.totalHarga),
        perjalanan: [
          {
            waktu: this.getNowTimestamp(),
            keterangan: "Penerimaan di Loket: Gudang Pusat SITTA UT (Order dibuat)"
          }
        ]
      };

      // Simpan ke reactive state menggunakan Vue.set
      Vue.set(this.tracking, noDO, newDO);
      this.saveTrackingToStorage();

      // Set item yang baru dibuat sebagai item aktif di tampilan detail
      this.activeDOKey = noDO;

      // Reset Formulir Input
      this.resetFormDO();

      this.triggerToast('Delivery Order ' + noDO + ' berhasil dibuat!', 'success');
    },

    // Reset Form Input DO
    resetFormDO: function () {
      this.formDO = {
        nomorDO: '',
        nim: '',
        nama: '',
        ekspedisi: 'JNE Regular (3-5 hari)',
        paket: '',
        tanggalKirim: '',
        totalHarga: 0
      };
      this.errorDO = {};
      this.setTanggalHariIni();
    },

    // Pilih DO yang ingin dilihat detail riwayatnya
    selectDO: function (noDO) {
      this.activeDOKey = noDO;
    },

    // Tambah Checkpoint Perjalanan Baru secara Interaktif
    tambahCheckpoint: function () {
      if (!this.newCheckpoint.trim()) {
        alert('Ketikkan keterangan lokasi/status checkpoint pengiriman!');
        return;
      }

      if (this.activeDOKey && this.tracking[this.activeDOKey]) {
        var checkpointBaru = {
          waktu: this.getNowTimestamp(),
          keterangan: this.newCheckpoint.trim()
        };
        
        this.tracking[this.activeDOKey].perjalanan.push(checkpointBaru);
        this.newCheckpoint = '';
        this.saveTrackingToStorage();
        this.triggerToast('Checkpoint perjalanan berhasil ditambahkan!', 'success');
      }
    },

    // Ubah Status DO (misal menjadi 'Terkirim')
    updateStatusDO: function (statusTujuan) {
      if (this.activeDOKey && this.tracking[this.activeDOKey]) {
        this.tracking[this.activeDOKey].status = statusTujuan;
        if (statusTujuan === 'Terkirim') {
          this.tracking[this.activeDOKey].perjalanan.push({
            waktu: this.getNowTimestamp(),
            keterangan: "Paket Bahan Ajar telah selesai diantar dan DITERIMA oleh mahasiswa."
          });
        }
        this.saveTrackingToStorage();
        this.triggerToast('Status DO ' + this.activeDOKey + ' diperbarui menjadi ' + statusTujuan, 'success');
      }
    },

    // Simpan ke LocalStorage
    saveTrackingToStorage: function () {
      localStorage.setItem('sitta_tracking_data', JSON.stringify(this.tracking));
    },

    // Reset Data Tracking ke data template awal
    resetTrackingDataKeAwal: function () {
      if (confirm('Kembalikan data tracking ke template awal dummy data?')) {
        this.tracking = JSON.parse(JSON.stringify(initialTrackingData));
        localStorage.removeItem('sitta_tracking_data');
        this.activeDOKey = 'DO2025-001';
        this.triggerToast('Data tracking dikembalikan ke template awal.', 'info');
      }
    },

    // Toast Feedback
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
    // Muat data dari localStorage atau data acuan template
    var saved = localStorage.getItem('sitta_tracking_data');
    if (saved) {
      try {
        this.tracking = JSON.parse(saved);
      } catch (e) {
        this.tracking = JSON.parse(JSON.stringify(initialTrackingData));
      }
    } else {
      this.tracking = JSON.parse(JSON.stringify(initialTrackingData));
    }

    // Set tanggal kirim awal hari ini (menggunakan fungsi Date local time sesuai soal)
    this.setTanggalHariIni();

    // Set active DO awal
    var keys = Object.keys(this.tracking);
    if (keys.length > 0) {
      this.activeDOKey = keys[0];
    }
  }
});
