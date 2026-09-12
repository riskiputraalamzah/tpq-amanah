export const SPTJM_MISSING_LABELS = {
  tpqProfile_missing: "Profil TPQ belum tersedia",
  tpqName: "Nama TPQ",
  tpqAddress: "Alamat TPQ",
  tpqHeadName: "Nama Kepala TPQ",
  user_missing: "Data guru tidak ditemukan",
  userName: "Nama guru",
  userNik: "NIK guru",
  userBirthPlace: "Tempat lahir guru",
  userBirthDate: "Tanggal lahir guru",
  userAddress: "Alamat guru",
  userPosition: "Jabatan guru",
};

export function missingFieldLabel(code) {
  return SPTJM_MISSING_LABELS[String(code || "")] || String(code || "-");
}

export function readinessHeadline(ready) {
  return ready ? "SPTJM siap diproses" : "SPTJM belum siap";
}

export function profileFixTarget(missing) {
  const list = Array.isArray(missing) ? missing : [];
  const needsTeacher = list.some((c) => String(c).startsWith("user"));
  const needsTpq = list.some((c) => String(c).startsWith("tpq"));
  return { needsTeacher, needsTpq };
}