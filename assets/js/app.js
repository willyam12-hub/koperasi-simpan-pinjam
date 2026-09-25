const STORAGE_KEY = "koperasiku_data_v3";

function defaultData() {
    return {
        anggota: [],
        simpanan: [],
        pinjaman: [],
        angsuran: []
    };
}

function getData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        const data = defaultData();
        saveData(data);
        return data;
    }

    try {
        return JSON.parse(raw);
    } catch (e) {
        const data = defaultData();
        saveData(data);
        return data;
    }
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function protectPage() {
    if (localStorage.getItem("koperasi_login") !== "true") {
        window.location.href = "../index.html";
    }
}

function logout() {
    localStorage.removeItem("koperasi_login");
    window.location.href = "../index.html";
}

function setActive(page) {
    document.querySelectorAll(".nav a").forEach(a => {
        a.classList.toggle("active", a.dataset.page === page);
    });
}

function setToday() {
    const el = document.getElementById("today");
    if (!el) return;
    el.textContent = new Intl.DateTimeFormat("id-ID", {
        day: "2-digit", month: "short", year: "numeric"
    }).format(new Date());
}

function setDateValue(id) {
    const el = document.getElementById(id);
    if (el && !el.value) {
        el.value = new Date().toISOString().slice(0, 10);
    }
}

function rupiah(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function nextId(rows) {
    return rows.length
        ? Math.max(...rows.map(x => Number(x.id))) + 1
        : 1;
}

function memberName(id) {
    const member = getData().anggota.find(x => Number(x.id) === Number(id));
    return member ? `${member.id_anggota} - ${member.nama}` : "-";
}

function memberBalance(id) {
    return getData().simpanan.reduce((saldo, row) => {
        if (Number(row.anggota_id) !== Number(id)) return saldo;
        return row.arah === "MASUK"
            ? saldo + Number(row.nominal)
            : saldo - Number(row.nominal);
    }, 0);
}

function fillMemberOptions(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Pilih anggota</option>';

    getData().anggota
        .filter(x => x.status === "Aktif")
        .forEach(member => {
            const option = document.createElement("option");
            option.value = member.id;
            option.textContent = `${member.id_anggota} - ${member.nama}`;
            select.appendChild(option);
        });
}

function loadMemberForm(id) {
    const member = getData().anggota.find(x => Number(x.id) === Number(id));
    if (!member) return;

    document.getElementById("formTitle").textContent = "Edit Anggota";
    document.getElementById("memberId").value = member.id;
    document.getElementById("memberName").value = member.nama;
    document.getElementById("memberNik").value = member.nik || "";
    document.getElementById("memberPhone").value = member.telepon || "";
    document.getElementById("memberAddress").value = member.alamat || "";
    document.getElementById("memberStatus").value = member.status;
    document.getElementById("memberDate").value = member.tanggal_daftar || "";
}

function saveMember(e) {
    e.preventDefault();

    const data = getData();
    const id = Number(document.getElementById("memberId").value || 0);
    const nama = document.getElementById("memberName").value.trim();

    if (!nama) {
        alert("Nama anggota wajib diisi.");
        return;
    }

    if (id) {
        const member = data.anggota.find(x => Number(x.id) === id);
        member.nama = nama;
        member.nik = document.getElementById("memberNik").value.trim();
        member.telepon = document.getElementById("memberPhone").value.trim();
        member.alamat = document.getElementById("memberAddress").value.trim();
        member.status = document.getElementById("memberStatus").value;
        member.tanggal_daftar = document.getElementById("memberDate").value;
    } else {
        data.anggota.push({
            id: nextId(data.anggota),
            id_anggota: "AGT-" + String(Date.now()).slice(-8),
            nama,
            nik: document.getElementById("memberNik").value.trim(),
            telepon: document.getElementById("memberPhone").value.trim(),
            alamat: document.getElementById("memberAddress").value.trim(),
            status: document.getElementById("memberStatus").value,
            tanggal_daftar: document.getElementById("memberDate").value
        });
    }

    saveData(data);
    alert("Data anggota berhasil disimpan.");
    window.location.href = "data-master.html";
}

function renderMembers() {
    const table = document.getElementById("memberTable");
    if (!table) return;

    const keyword = (document.getElementById("memberSearch")?.value || "").toLowerCase();
    const rows = getData().anggota.filter(x =>
        `${x.id_anggota} ${x.nama} ${x.nik || ""} ${x.telepon || ""}`
            .toLowerCase().includes(keyword)
    );

    if (!rows.length) {
        table.innerHTML = '<tr><td colspan="8" class="empty">Belum ada anggota.</td></tr>';
        return;
    }

    table.innerHTML = rows.map((m, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${escapeHtml(m.id_anggota)}</td>
            <td>${escapeHtml(m.nama)}</td>
            <td>${escapeHtml(m.nik || "-")}</td>
            <td>${escapeHtml(m.telepon || "-")}</td>
            <td><span class="badge ${m.status === "Aktif" ? "success" : "danger"}">${m.status}</span></td>
            <td>${rupiah(memberBalance(m.id))}</td>
            <td>
                <a class="btn small" href="form.html?id=${m.id}">Edit</a>
            </td>
        </tr>
    `).join("");
}

function saveSaving(e) {
    e.preventDefault();

    const data = getData();
    const anggota_id = Number(document.getElementById("savingMember").value);
    const nominal = Number(document.getElementById("savingAmount").value);

    if (!anggota_id || nominal <= 0) {
        alert("Anggota dan nominal wajib diisi.");
        return;
    }

    data.simpanan.push({
        id: nextId(data.simpanan),
        anggota_id,
        jenis_simpanan: document.getElementById("savingType").value,
        arah: "MASUK",
        nominal,
        tanggal: document.getElementById("savingDate").value,
        keterangan: document.getElementById("savingNote").value.trim() || "Setoran simpanan"
    });

    saveData(data);
    e.target.reset();
    setDateValue("savingDate");
    renderSavings();
    alert("Simpanan berhasil ditambahkan.");
}

function renderSavings() {
    const table = document.getElementById("savingTable");
    if (!table) return;

    const rows = getData().simpanan.filter(x => x.arah === "MASUK").slice().reverse();

    if (!rows.length) {
        table.innerHTML = '<tr><td colspan="6" class="empty">Belum ada simpanan.</td></tr>';
        return;
    }

    table.innerHTML = rows.map((r, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${escapeHtml(memberName(r.anggota_id))}</td>
            <td>${r.jenis_simpanan}</td>
            <td>${rupiah(r.nominal)}</td>
            <td>${r.tanggal}</td>
            <td>${escapeHtml(r.keterangan)}</td>
        </tr>
    `).join("");
}

function updateWithdrawBalance() {
    const id = Number(document.getElementById("withdrawMember")?.value || 0);
    const saldo = memberBalance(id);
    const balance = document.getElementById("withdrawBalance");
    const amount = document.getElementById("withdrawAmount");

    if (balance) balance.value = rupiah(saldo);
    if (amount) amount.max = saldo;
}

function saveWithdrawal(e) {
    e.preventDefault();

    const data = getData();
    const anggota_id = Number(document.getElementById("withdrawMember").value);
    const nominal = Number(document.getElementById("withdrawAmount").value);
    const saldo = memberBalance(anggota_id);

    if (!anggota_id || nominal <= 0) {
        alert("Anggota dan nominal wajib diisi.");
        return;
    }

    if (nominal > saldo) {
        alert(`Penarikan melebihi saldo. Saldo tersedia ${rupiah(saldo)}.`);
        return;
    }

    data.simpanan.push({
        id: nextId(data.simpanan),
        anggota_id,
        jenis_simpanan: "Sukarela",
        arah: "KELUAR",
        nominal,
        tanggal: document.getElementById("withdrawDate").value,
        keterangan: document.getElementById("withdrawNote").value.trim() || "Penarikan simpanan"
    });

    saveData(data);
    e.target.reset();
    setDateValue("withdrawDate");
    updateWithdrawBalance();
    renderWithdrawals();
    alert("Penarikan berhasil.");
}

function renderWithdrawals() {
    const table = document.getElementById("withdrawTable");
    if (!table) return;

    const rows = getData().simpanan.filter(x => x.arah === "KELUAR").slice().reverse();

    if (!rows.length) {
        table.innerHTML = '<tr><td colspan="5" class="empty">Belum ada penarikan.</td></tr>';
        return;
    }

    table.innerHTML = rows.map((r, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${escapeHtml(memberName(r.anggota_id))}</td>
            <td>${rupiah(r.nominal)}</td>
            <td>${r.tanggal}</td>
            <td>${escapeHtml(r.keterangan)}</td>
        </tr>
    `).join("");
}

function calculateLoan() {
    const p = Number(document.getElementById("loanAmount")?.value || 0);
    const b = Number(document.getElementById("loanInterest")?.value || 0);
    const t = Number(document.getElementById("loanTenor")?.value || 0);
    const box = document.getElementById("loanSimulation");

    if (!box || !p || !t) {
        if (box) box.textContent = "Isi jumlah pinjaman dan tenor untuk melihat simulasi.";
        return;
    }

    const bunga = p * (b / 100) * (t / 12);
    const total = p + bunga;
    const perBulan = total / t;

    box.innerHTML = `
        <strong>Simulasi Pinjaman</strong><br>
        Pokok: <b>${rupiah(p)}</b><br>
        Bunga: <b>${b}% per tahun</b><br>
        Tenor: <b>${t} bulan</b><br>
        Total bunga: <b>${rupiah(bunga)}</b><br>
        Total kewajiban: <b>${rupiah(total)}</b><br>
        Angsuran per bulan: <b>${rupiah(perBulan)}</b>
    `;
}

function saveLoan(e) {
    e.preventDefault();

    const data = getData();
    const anggota_id = Number(document.getElementById("loanMember").value);
    const jumlah = Number(document.getElementById("loanAmount").value);
    const bungaPersen = Number(document.getElementById("loanInterest").value);
    const tenor = Number(document.getElementById("loanTenor").value);

    if (!anggota_id || jumlah <= 0 || bungaPersen < 0 || tenor < 1) {
        alert("Data pinjaman belum lengkap.");
        return;
    }

    const totalBunga = jumlah * (bungaPersen / 100) * (tenor / 12);
    const totalKewajiban = jumlah + totalBunga;
    const angsuran = totalKewajiban / tenor;
    const id = nextId(data.pinjaman);

    data.pinjaman.push({
        id,
        no_pinjaman: "PJM-" + new Date().toISOString().slice(0,10).replaceAll("-", "") + "-" + id,
        anggota_id,
        jumlah_pinjaman: jumlah,
        bunga_persen: bungaPersen,
        tenor_bulan: tenor,
        total_bunga: totalBunga,
        total_kewajiban: totalKewajiban,
        angsuran_per_bulan: angsuran,
        sudah_dibayar: 0,
        sisa_pinjaman: totalKewajiban,
        status: "Aktif",
        tanggal: document.getElementById("loanDate").value
    });

    saveData(data);
    e.target.reset();
    document.getElementById("loanInterest").value = 12;
    document.getElementById("loanTenor").value = 12;
    setDateValue("loanDate");
    calculateLoan();
    renderLoans();
    alert(`Pinjaman berhasil dibuat. Total kewajiban ${rupiah(totalKewajiban)}.`);
}

function renderLoans() {
    const table = document.getElementById("loanTable");
    if (!table) return;

    const rows = getData().pinjaman.slice().reverse();

    if (!rows.length) {
        table.innerHTML = '<tr><td colspan="9" class="empty">Belum ada pinjaman.</td></tr>';
        return;
    }

    table.innerHTML = rows.map(loan => `
        <tr>
            <td>${escapeHtml(loan.no_pinjaman)}</td>
            <td>${escapeHtml(memberName(loan.anggota_id))}</td>
            <td>${rupiah(loan.jumlah_pinjaman)}</td>
            <td>${loan.bunga_persen}%</td>
            <td>${loan.tenor_bulan} bulan</td>
            <td>${rupiah(loan.total_kewajiban)}</td>
            <td>${rupiah(loan.angsuran_per_bulan)}</td>
            <td>${rupiah(loan.sisa_pinjaman)}</td>
            <td><span class="badge ${loan.status === "Aktif" ? "warning" : "success"}">${loan.status}</span></td>
        </tr>
    `).join("");
}

function fillLoanOptions() {
    const select = document.getElementById("installmentLoan");
    if (!select) return;

    select.innerHTML = '<option value="">Pilih pinjaman aktif</option>';

    getData().pinjaman
        .filter(x => x.status === "Aktif" && Number(x.sisa_pinjaman) > 0)
        .forEach(loan => {
            const option = document.createElement("option");
            option.value = loan.id;
            option.textContent = `${loan.no_pinjaman} - ${memberName(loan.anggota_id)}`;
            select.appendChild(option);
        });
}

function updateInstallmentInfo() {
    const id = Number(document.getElementById("installmentLoan")?.value || 0);
    const loan = getData().pinjaman.find(x => Number(x.id) === id);

    if (!loan) {
        document.getElementById("installmentBalance").value = "Rp 0";
        document.getElementById("normalInstallment").value = "Rp 0";
        document.getElementById("installmentAmount").value = "";
        return;
    }

    document.getElementById("installmentBalance").value = rupiah(loan.sisa_pinjaman);
    document.getElementById("normalInstallment").value =
        rupiah(Math.min(loan.angsuran_per_bulan, loan.sisa_pinjaman));

    document.getElementById("installmentAmount").value =
        Math.min(loan.angsuran_per_bulan, loan.sisa_pinjaman);

    document.getElementById("installmentAmount").max = loan.sisa_pinjaman;
}

function saveInstallment(e) {
    e.preventDefault();

    const data = getData();
    const pinjamanId = Number(document.getElementById("installmentLoan").value);
    const nominal = Number(document.getElementById("installmentAmount").value);

    const index = data.pinjaman.findIndex(x => Number(x.id) === pinjamanId);

    if (index < 0) {
        alert("Pilih pinjaman aktif.");
        return;
    }

    const loan = data.pinjaman[index];

    if (nominal <= 0) {
        alert("Nominal angsuran harus lebih dari 0.");
        return;
    }

    if (nominal > Number(loan.sisa_pinjaman)) {
        alert(`Nominal tidak boleh melebihi sisa pinjaman ${rupiah(loan.sisa_pinjaman)}.`);
        return;
    }

    const previous = data.angsuran.filter(x => Number(x.pinjaman_id) === pinjamanId);

    data.angsuran.push({
        id: nextId(data.angsuran),
        pinjaman_id: pinjamanId,
        angsuran_ke: previous.length + 1,
        nominal,
        tanggal: document.getElementById("installmentDate").value,
        keterangan: document.getElementById("installmentNote").value.trim() || "Pembayaran angsuran"
    });

    loan.sudah_dibayar = Number(loan.sudah_dibayar) + nominal;
    loan.sisa_pinjaman = Math.max(0, Number(loan.sisa_pinjaman) - nominal);

    if (loan.sisa_pinjaman <= 0.01) {
        loan.sisa_pinjaman = 0;
        loan.status = "Lunas";
    }

    saveData(data);
    e.target.reset();
    setDateValue("installmentDate");
    fillLoanOptions();
    updateInstallmentInfo();
    renderInstallments();

    alert("Angsuran berhasil disimpan.");
}

function renderInstallments() {
    const table = document.getElementById("installmentTable");
    if (!table) return;

    const rows = getData().angsuran.slice().reverse();

    if (!rows.length) {
        table.innerHTML = '<tr><td colspan="7" class="empty">Belum ada angsuran.</td></tr>';
        return;
    }

    table.innerHTML = rows.map((row, i) => {
        const loan = getData().pinjaman.find(x => Number(x.id) === Number(row.pinjaman_id));
        return `
            <tr>
                <td>${i + 1}</td>
                <td>${loan ? escapeHtml(loan.no_pinjaman) : "-"}</td>
                <td>${loan ? escapeHtml(memberName(loan.anggota_id)) : "-"}</td>
                <td>${row.angsuran_ke}</td>
                <td>${rupiah(row.nominal)}</td>
                <td>${row.tanggal}</td>
                <td>${escapeHtml(row.keterangan)}</td>
            </tr>
        `;
    }).join("");
}

function buildTransactions() {
    const data = getData();
    const rows = [];

    data.simpanan.forEach(x => {
        rows.push({
            jenis: x.arah === "MASUK" ? "Simpanan" : "Penarikan",
            tanggal: x.tanggal,
            anggota: memberName(x.anggota_id),
            nominal: x.nominal,
            keterangan: x.keterangan
        });
    });

    data.pinjaman.forEach(x => {
        rows.push({
            jenis: "Pinjaman",
            tanggal: x.tanggal,
            anggota: memberName(x.anggota_id),
            nominal: x.jumlah_pinjaman,
            keterangan: x.no_pinjaman
        });
    });

    data.angsuran.forEach(x => {
        const loan = data.pinjaman.find(p => Number(p.id) === Number(x.pinjaman_id));
        rows.push({
            jenis: "Angsuran",
            tanggal: x.tanggal,
            anggota: loan ? memberName(loan.anggota_id) : "-",
            nominal: x.nominal,
            keterangan: x.keterangan
        });
    });

    return rows.sort((a,b) => b.tanggal.localeCompare(a.tanggal));
}

function renderDashboard() {
    const data = getData();

    const saldo = data.simpanan.reduce((t,x) =>
        x.arah === "MASUK" ? t + Number(x.nominal) : t - Number(x.nominal), 0);

    const totalPinjaman = data.pinjaman.reduce((t,x) => t + Number(x.jumlah_pinjaman), 0);
    const sisa = data.pinjaman.reduce((t,x) => t + Number(x.sisa_pinjaman), 0);
    const aktif = data.pinjaman.filter(x => x.status === "Aktif").length;
    const lunas = data.pinjaman.filter(x => x.status === "Lunas").length;
    const angsuran = data.angsuran.reduce((t,x) => t + Number(x.nominal), 0);

    document.getElementById("totalAnggota").textContent = data.anggota.length;
    document.getElementById("saldoSimpanan").textContent = rupiah(saldo);
    document.getElementById("totalPinjaman").textContent = rupiah(totalPinjaman);
    document.getElementById("sisaPinjaman").textContent = rupiah(sisa);
    document.getElementById("pinjamanAktif").textContent = aktif;
    document.getElementById("pinjamanLunas").textContent = lunas;
    document.getElementById("totalAngsuran").textContent = rupiah(angsuran);

    const table = document.getElementById("dashboardTransactions");
    const rows = buildTransactions().slice(0, 8);

    table.innerHTML = rows.length ? rows.map(x => `
        <tr>
            <td><span class="badge">${x.jenis}</span></td>
            <td>${x.tanggal}</td>
            <td>${escapeHtml(x.anggota)}</td>
            <td>${rupiah(x.nominal)}</td>
            <td>${escapeHtml(x.keterangan)}</td>
        </tr>
    `).join("") : '<tr><td colspan="5" class="empty">Belum ada transaksi.</td></tr>';
}

function renderReport() {
    const data = getData();

    const masuk = data.simpanan.filter(x => x.arah === "MASUK")
        .reduce((t,x) => t + Number(x.nominal), 0);

    const keluar = data.simpanan.filter(x => x.arah === "KELUAR")
        .reduce((t,x) => t + Number(x.nominal), 0);

    const saldo = masuk - keluar;
    const pinjaman = data.pinjaman.reduce((t,x) => t + Number(x.jumlah_pinjaman), 0);
    const sisa = data.pinjaman.reduce((t,x) => t + Number(x.sisa_pinjaman), 0);
    const angsuran = data.angsuran.reduce((t,x) => t + Number(x.nominal), 0);
    const aktif = data.pinjaman.filter(x => x.status === "Aktif").length;

    document.getElementById("reportMembers").textContent = data.anggota.length;
    document.getElementById("reportSavings").textContent = rupiah(saldo);
    document.getElementById("reportLoans").textContent = rupiah(pinjaman);
    document.getElementById("reportInstallments").textContent = rupiah(angsuran);
    document.getElementById("reportIn").textContent = rupiah(masuk);
    document.getElementById("reportOut").textContent = rupiah(keluar);
    document.getElementById("reportRemaining").textContent = rupiah(sisa);
    document.getElementById("reportActive").textContent = aktif;

    const table = document.getElementById("reportTable");
    const rows = buildTransactions();

    table.innerHTML = rows.length ? rows.map(x => `
        <tr>
            <td><span class="badge">${x.jenis}</span></td>
            <td>${x.tanggal}</td>
            <td>${escapeHtml(x.anggota)}</td>
            <td>${rupiah(x.nominal)}</td>
            <td>${escapeHtml(x.keterangan)}</td>
        </tr>
    `).join("") : '<tr><td colspan="5" class="empty">Belum ada transaksi.</td></tr>';
}
