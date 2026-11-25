import { useEffect, useState } from 'react';
import { X, Download, FileText, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { extractApiError } from '../utils/extractErrorMessage';

export default function DocumentPreviewModal({ loanId, doc, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loanId || !doc) return;
    let active = true;
    let objectUrl = null;

    const loadPreview = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/api/loans/${loanId}/documents/${doc.id}/download`, {
          responseType: 'blob',
        });
        const contentType = doc.mimeType || response.headers['content-type'] || 'application/octet-stream';
        const blob = new Blob([response.data], { type: contentType });
        objectUrl = window.URL.createObjectURL(blob);
        if (active) setBlobUrl(objectUrl);
      } catch (err) {
        if (active) setError(extractApiError(err, 'Failed to load document preview.'));
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPreview();

    return () => {
      active = false;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [loanId, doc]);

  if (!doc) return null;

  const isImage = doc.mimeType?.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(doc.fileName || '');
  const isPdf = doc.mimeType === 'application/pdf' || /\.pdf$/i.test(doc.fileName || '');

  const handleDownload = () => {
    if (!blobUrl) return;
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', doc.fileName || 'document');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
            <div className="truncate">
              <h3 className="text-sm font-bold text-slate-900 truncate">{doc.fileName}</h3>
              <p className="text-[11px] text-slate-500">
                {doc.docType} • {doc.verificationStatus}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={!blobUrl}
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-slate-100 flex items-center justify-center overflow-auto p-3">
          {loading ? (
            <div className="text-xs text-slate-500">Loading document preview...</div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : isImage ? (
            <img
              src={blobUrl}
              alt={doc.fileName}
              className="max-w-full max-h-full object-contain rounded-lg shadow-md"
            />
          ) : isPdf ? (
            <iframe
              src={blobUrl}
              title={doc.fileName}
              className="w-full h-full rounded-lg border border-slate-200 bg-white"
            />
          ) : (
            <div className="text-center space-y-3 p-6">
              <FileText className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600">Preview is not available for this file type.</p>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
