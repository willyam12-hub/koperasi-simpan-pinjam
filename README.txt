KOPERASIKU - STRUKTUR MULTI-PAGE - FIVE SERVER

Teknologi:
- HTML
- CSS
- JavaScript
- localStorage

Tidak memakai:
- PHP
- XAMPP
- Apache
- MySQL
- phpMyAdmin

Struktur:
koperasi-simpan-pinjam/
├── index.html
├── assets/
│   ├── css/style.css
│   └── js/app.js
└── pages/
    ├── dashboard.html
    ├── data-master.html
    ├── form.html
    ├── simpanan.html
    ├── penarikan.html
    ├── pinjaman.html
    ├── angsuran.html
    └── laporan.html

Jalankan:
1. Buka folder di VS Code.
2. Install Five Server.
3. Klik kanan index.html.
4. Pilih Open with Five Server.

Login:
Email: admin@koperasiku.id
Password: admin123

Semua modul memakai data yang sama di localStorage sehingga saling terhubung.
Contoh:
Tambah anggota -> anggota muncul di Simpanan/Pinjaman.
Simpanan masuk -> saldo anggota bertambah.
Penarikan -> saldo berkurang dan tidak boleh melebihi saldo.
Pinjaman -> muncul di Angsuran.
Angsuran -> mengurangi sisa pinjaman.
Sisa 0 -> status pinjaman menjadi Lunas.
Semua transaksi -> muncul di Dashboard dan Laporan.
