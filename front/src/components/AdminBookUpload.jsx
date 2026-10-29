import { useState, useEffect } from 'react';
import { NavLink } from 'react-router';
import axiosClient from '../utils/axiosClient';
import {
  BookOpen,
  UploadCloud,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Layers,
  ArrowLeft,
  Search,
} from 'lucide-react';

export default function AdminBookUpload() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [source, setSource] = useState('Authorized Textbook');

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/book/list');
      setBooks(res.data.books || []);
    } catch (err) {
      console.error('Failed to fetch books:', err);
      setError('Could not load books list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Poll processing books every 4 seconds
  useEffect(() => {
    const hasProcessing = books.some((b) => b.status === 'Processing' || b.status === 'Uploaded');
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      axiosClient.get('/book/list').then((res) => {
        setBooks(res.data.books || []);
      }).catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, [books]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Please select a valid PDF file.');
        return;
      }
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '));
      }
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a PDF file to upload.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('pdf', selectedFile);
      formData.append('title', title || selectedFile.name);
      formData.append('author', author || 'Unknown Author');
      formData.append('source', source || 'Administrator Upload');

      const res = await axiosClient.post('/book/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(res.data.message || 'Book uploaded and queued for vector indexing!');
      setSelectedFile(null);
      setTitle('');
      setAuthor('');
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload and index book.');
    } finally {
      setUploading(false);
    }
  };

  const handleReindex = async (bookId) => {
    try {
      setError('');
      await axiosClient.post(`/book/reindex/${bookId}`);
      setSuccess('Re-indexing pipeline initiated.');
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to re-index book.');
    }
  };

  const handleDelete = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book and ALL its associated vector embeddings? This cannot be undone.')) {
      return;
    }
    try {
      setError('');
      await axiosClient.delete(`/book/delete/${bookId}`);
      setSuccess('Book and associated vectors removed successfully.');
      fetchBooks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete book.');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="min-h-screen bg-[#060b14] text-slate-200 font-sans p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <NavLink
            to="/admin"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all"
          >
            <ArrowLeft size={15} />
            <span>Back to Admin Hub</span>
          </NavLink>

          <button
            onClick={fetchBooks}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-400 hover:text-white transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <BookOpen size={20} />
            </span>
            DSA Book Knowledge Base (RAG)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload authorized DSA textbooks in PDF format. The system automatically extracts chapters, strips page artifacts, produces semantic chunks, generates vectors, and populates the vector retrieval database.
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Upload Form Card */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/10 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UploadCloud size={18} className="text-cyan-400" />
            Upload New Educational Textbook
          </h2>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Introduction to Algorithms (CLRS)"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Author / Publication
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Cormen, Leiserson, Rivest, Stein"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Educational Source / License
                </label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Open Educational License / Platform Curated"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            {/* File Upload Box */}
            <div className="border-2 border-dashed border-white/15 hover:border-cyan-500/40 rounded-xl p-6 text-center bg-slate-950/40 transition-colors">
              <input
                type="file"
                accept=".pdf,application/pdf"
                id="pdf-upload"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <FileText size={36} className="text-cyan-400/80" />
                <span className="text-sm font-medium text-white">
                  {selectedFile ? selectedFile.name : 'Click to select or drag and drop a PDF file'}
                </span>
                <span className="text-xs text-slate-500">
                  {selectedFile ? `${formatFileSize(selectedFile.size)}` : 'PDF files up to 50MB'}
                </span>
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {uploading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Uploading & Ingesting…</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={16} />
                    <span>Upload & Ingest Book</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Books List Table */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-cyan-400" />
              Indexed Textbooks ({books.length})
            </h2>
          </div>

          {books.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No textbooks have been uploaded yet. Upload your first PDF above to enable AI-powered book-grounded tutoring.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-400 uppercase tracking-wider bg-slate-950/60 border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Book</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Pages</th>
                    <th className="py-3 px-4">Chunks / Vectors</th>
                    <th className="py-3 px-4">Topics Detected</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {books.map((b) => (
                    <tr key={b._id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-white">{b.title}</p>
                        <p className="text-xs text-slate-400">{b.author} • {formatFileSize(b.fileSize)}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            b.status === 'Indexed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : b.status === 'Processing'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                              : b.status === 'Uploaded'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {b.status === 'Processing' && <RefreshCw size={12} className="animate-spin" />}
                          {b.status}
                        </span>
                        {b.errorMessage && (
                          <p className="text-[11px] text-red-400 mt-1 max-w-xs truncate" title={b.errorMessage}>
                            {b.errorMessage}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">{b.pageCount || 0}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-cyan-300 font-semibold">{b.totalChunks || 0}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(b.detectedTopics || []).map((t) => (
                            <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-slate-300 border border-white/5">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleReindex(b._id)}
                            title="Re-index this book"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-cyan-400 transition-colors"
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(b._id)}
                            title="Delete book and remove all vectors"
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
