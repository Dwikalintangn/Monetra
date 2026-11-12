import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  FileJson,
  ShieldAlert,
  Copy,
  ClipboardPaste,
} from 'lucide-react';
import { Transaction } from '../types/finance';
import {
  getCurrentYearMonth,
  validateTransactionsPayload,
} from '../utils/formatCurrency';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onImportTransactions: (
    imported: Transaction[],
    mode: 'merge' | 'replace'
  ) => void;
  onResetAllData: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onImportTransactions,
  onResetAllData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [showPasteBox, setShowPasteBox] = useState<boolean>(false);
  const [pastedJson, setPastedJson] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Double confirmation state untuk Reset Data (FR-5)
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const [resetConfirmText, setResetConfirmText] = useState('');

  if (!isOpen) return null;

  // FR-5: Export JSON (contoh: monetra-backup-2026-11.json)
  const handleExportJSON = () => {
    try {
      const yearMonth = getCurrentYearMonth();
      const fileName = `monetra-backup-${yearMonth}.json`;
      const jsonContent = JSON.stringify(transactions, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMessage({
        type: 'success',
        text: `Berhasil mengunduh ${transactions.length} transaksi ke file ${fileName}.`,
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Gagal mengekspor data JSON. Silakan coba kembali.',
      });
    }
  };

  // Salin JSON ke clipboard (memudahkan transfer cepat lewat WhatsApp/chat antar perangkat)
  const handleCopyJSON = async () => {
    try {
      const jsonContent = JSON.stringify(transactions);
      await navigator.clipboard.writeText(jsonContent);
      setStatusMessage({
        type: 'success',
        text: `Teks JSON (${transactions.length} transaksi) disalin ke clipboard. Anda bisa langsung paste ke WhatsApp atau catatan.`,
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Gagal menyalin otomatis ke clipboard. Gunakan tombol Unduh File Backup sebagai gantinya.',
      });
    }
  };

  // Shared helper untuk validasi & import JSON dari file maupun paste teks
  const processJsonImport = (rawText: string, sourceLabel: string): boolean => {
    try {
      const parsed: unknown = JSON.parse(rawText);
      const validation = validateTransactionsPayload(parsed);

      if (!validation.valid) {
        setStatusMessage({
          type: 'error',
          text: validation.error || 'Data JSON tidak sesuai skema Monetra.',
        });
        return false;
      }

      onImportTransactions(validation.transactions, importMode);
      setStatusMessage({
        type: 'success',
        text:
          importMode === 'replace'
            ? `Berhasil memuat dan menimpa data dengan ${validation.transactions.length} transaksi dari ${sourceLabel}.`
            : `Berhasil menggabungkan ${validation.transactions.length} transaksi dari ${sourceLabel}.`,
      });
      return true;
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Format teks bukan merupakan JSON yang valid atau struktur datanya rusak.',
      });
      return false;
    }
  };

  // FR-5: Import JSON dengan validasi skema ketat
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Isi file tidak dapat dibaca.');
        }
        processJsonImport(text, `file ${file.name}`);
      } catch {
        setStatusMessage({
          type: 'error',
          text: 'Isi file tidak dapat dibaca.',
        });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const handlePasteImport = () => {
    const trimmed = pastedJson.trim();
    if (!trimmed) {
      setStatusMessage({
        type: 'error',
        text: 'Mohon tempelkan teks JSON backup terlebih dahulu.',
      });
      return;
    }
    const ok = processJsonImport(trimmed, 'teks JSON');
    if (ok) {
      setPastedJson('');
      setShowPasteBox(false);
    }
  };

  const handleConfirmResetFinal = () => {
    if (resetConfirmText.trim().toUpperCase() !== 'HAPUS') {
      return;
    }
    onResetAllData();
    setResetStep(0);
    setResetConfirmText('');
    setStatusMessage({
      type: 'success',
      text: 'Seluruh data transaksi lokal berhasil dihapus dan direset ke Rp 0.',
    });
  };

  const handleClose = () => {
    setResetStep(0);
    setResetConfirmText('');
    setShowPasteBox(false);
    setPastedJson('');
    setStatusMessage(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-modal-title"
    >
      <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center">
              <FileJson className="w-4 h-4" />
            </div>
            <div>
              <h2 id="backup-modal-title" className="text-base font-bold text-slate-900">
                Kelola Data &amp; Portabilitas Lokal
              </h2>
              <p className="text-xs text-slate-500">
                Key penyimpanan: <code className="font-mono text-slate-700">monetra_finance_v1</code>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs font-semibold ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* 1. Export JSON */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  1. Export Backup JSON
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unduh seluruh riwayat transaksi ({transactions.length} transaksi) dari
                  browser ini ke file <code className="font-mono">.json</code>.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700 shrink-0">
                {transactions.length} item
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  Unduh File (.json)
                </span>
              </button>

              <button
                type="button"
                onClick={handleCopyJSON}
                className="sm:w-auto py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center gap-2 transition-colors"
                title="Salin data sebagai teks JSON untuk dikirim cepat via WhatsApp"
              >
                <Copy className="w-4 h-4 shrink-0" />
                <span>Salin Teks JSON</span>
              </button>
            </div>
          </div>

          {/* 2. Import JSON */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                2. Import / Restore JSON
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pulihkan data dari file backup Monetra. Sistem memvalidasi skema setiap
                transaksi secara otomatis sebelum menyimpan.
              </p>
            </div>

            {/* Pilihan Mode Import */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-200/70 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setImportMode('merge')}
                className={`py-2 px-3 rounded-lg font-bold transition-all ${
                  importMode === 'merge'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gabungkan Data
              </button>
              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`py-2 px-3 rounded-lg font-bold transition-all ${
                  importMode === 'replace'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Timpa Seluruh Data
              </button>
            </div>

            {/* Tanpa filter accept ketat agar file .json dari WhatsApp di HP tidak tersembunyi/abu-abu */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4 shrink-0" />
                <span>Pilih File Backup (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPasteBox((prev) => !prev)}
                className="sm:w-auto py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center gap-2 transition-colors"
              >
                <ClipboardPaste className="w-4 h-4 shrink-0" />
                <span>{showPasteBox ? 'Tutup Paste' : 'Tempel Teks'}</span>
              </button>
            </div>

            {showPasteBox && (
              <div className="space-y-2 pt-1">
                <textarea
                  rows={4}
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  placeholder='Tempelkan teks JSON backup di sini (contoh: [{"id":...}])'
                  className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <button
                  type="button"
                  onClick={handlePasteImport}
                  className="w-full py-2 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                >
                  Proses &amp; Import Teks JSON
                </button>
              </div>
            )}

            <p className="text-[11px] text-slate-500 leading-relaxed">
              <strong>Tips HP/WhatsApp:</strong> File yang diunduh di WhatsApp Android biasanya
              tersimpan di folder <code className="font-mono">Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Documents</code> atau
              gunakan fitur <strong>Salin &amp; Tempel Teks JSON</strong> agar lebih praktis.
            </p>
          </div>

          {/* 3. Reset Data (Dengan Konfirmasi Ganda / Double Confirmation) */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-3">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-rose-900">
                  3. Reset Seluruh Data
                </h3>
                <p className="text-xs text-rose-700/80 mt-0.5">
                  Menghapus seluruh transaksi di browser ini secara permanen. Pastikan Anda
                  sudah mengunduh backup JSON jika data masih diperlukan.
                </p>
              </div>
            </div>

            {resetStep === 0 && (
              <button
                type="button"
                disabled={transactions.length === 0}
                onClick={() => setResetStep(1)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-rose-700 bg-white hover:bg-rose-100 border border-rose-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Seluruh Data ({transactions.length} Transaksi)</span>
              </button>
            )}

            {/* Konfirmasi Tahap 1 */}
            {resetStep === 1 && (
              <div className="p-3 rounded-xl bg-white border border-rose-200 space-y-2.5">
                <p className="text-xs font-bold text-rose-800">
                  Konfirmasi 1/2: Apakah Anda yakin ingin menghapus semua data transaksi?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setResetStep(2)}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors"
                  >
                    Ya, Lanjutkan
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetStep(0)}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Konfirmasi Tahap 2 (Ketik HAPUS) */}
            {resetStep === 2 && (
              <div className="p-3 rounded-xl bg-white border border-rose-300 space-y-2.5">
                <p className="text-xs font-bold text-rose-900">
                  Konfirmasi 2/2: Ketik kata <code className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded">HAPUS</code> di bawah ini untuk mereset permanen:
                </p>
                <input
                  type="text"
                  placeholder="Ketik HAPUS"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={resetConfirmText.trim().toUpperCase() !== 'HAPUS'}
                    onClick={handleConfirmResetFinal}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Reset Permanen Sekarang
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep(0);
                      setResetConfirmText('');
                    }}
                    className="py-2 px-3 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            Selesai &amp; Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

