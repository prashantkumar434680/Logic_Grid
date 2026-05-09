
import { useEffect, useState } from 'react';
import axiosClient from '../utils/axiosClient';
import { NavLink } from 'react-router';

const AdminVideo = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, title: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get('/problem/getAllProblem');
      setProblems(data);
    } catch (err) {
      setError('Failed to fetch problems');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (id, title) => {
    setDeleteModal({ isOpen: true, id, title });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, id: null, title: null });
  };

  const handleDelete = async () => {
    const { id } = deleteModal;
    try {
      setDeleting(true);
      await axiosClient.delete(`/video/delete/${id}`);
      setProblems(problems.filter((problem) => problem._id !== id));
      closeDeleteModal();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete video');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const filteredProblems = problems.filter((problem) =>
    problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    problem.difficulty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (typeof problem.tags === 'string' && problem.tags.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f172a' }}>
      <style>{`
        * {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .code-mono {
          font-family: 'JetBrains Mono', 'Monaco', monospace;
        }

        .accent-color {
          color: #3b9eff;
        }

        .accent-bg {
          background-color: #3b9eff;
        }

        .subtle-border {
          border-color: rgba(148, 163, 184, 0.2);
        }

        .table-row-hover:hover {
          background-color: rgba(59, 158, 255, 0.05);
          transition: background-color 0.2s ease;
        }

        .badge-difficulty {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.35rem 0.75rem;
          border-radius: 0.375rem;
          display: inline-block;
        }

        .badge-easy {
          background-color: rgba(34, 197, 94, 0.15);
          color: #4ade80;
        }

        .badge-medium {
          background-color: rgba(234, 179, 8, 0.15);
          color: #facc15;
        }

        .badge-hard {
          background-color: rgba(239, 68, 68, 0.15);
          color: #f87171;
        }

        .badge-tag {
          font-size: 0.7rem;
          padding: 0.25rem 0.625rem;
          background-color: rgba(59, 158, 255, 0.1);
          color: #3b9eff;
          border-radius: 0.25rem;
          display: inline-block;
          margin-right: 0.375rem;
          margin-bottom: 0.25rem;
        }

        .btn-upload {
          background-color: rgba(59, 158, 255, 0.1);
          color: #3b9eff;
          border: 1px solid rgba(59, 158, 255, 0.3);
          padding: 0.4rem 0.8rem;
          font-size: 0.875rem;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
        }

        .btn-upload:hover {
          background-color: rgba(59, 158, 255, 0.2);
          border-color: rgba(59, 158, 255, 0.5);
        }

        .btn-delete {
          background-color: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 0.4rem 0.8rem;
          font-size: 0.875rem;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-delete:hover {
          background-color: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
        }

        .action-group {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .search-input {
          background-color: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(148, 163, 184, 0.2);
          color: #f1f5f9;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          width: 100%;
        }

        .search-input:focus {
          outline: none;
          border-color: rgba(59, 158, 255, 0.5);
          background-color: rgba(30, 41, 59, 0.8);
          box-shadow: 0 0 0 3px rgba(59, 158, 255, 0.1);
        }

        .search-input::placeholder {
          color: #64748b;
        }

        .skeleton {
          background: linear-gradient(90deg, rgba(148, 163, 184, 0.1) 25%, rgba(148, 163, 184, 0.05) 50%, rgba(148, 163, 184, 0.1) 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }

        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        .error-banner {
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 0.5rem;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #f87171;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          color: #94a3b8;
        }

        .btn-primary {
          background-color: #3b9eff;
          color: white;
          border: none;
          padding: 0.5rem 1.25rem;
          border-radius: 0.375rem;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          background-color: #2980d9;
        }

        .btn-secondary {
          background-color: transparent;
          color: #94a3b8;
          border: 1px solid rgba(148, 163, 184, 0.3);
          padding: 0.5rem 1.25rem;
          border-radius: 0.375rem;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background-color: rgba(148, 163, 184, 0.1);
          border-color: rgba(148, 163, 184, 0.5);
        }

        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .modal-content {
          background-color: #1e293b;
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 0.75rem;
          padding: 2rem;
          max-width: 450px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background-color: rgba(30, 41, 59, 0.5);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 0.5rem;
          padding: 1.25rem;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #3b9eff;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.85rem;
          color: #94a3b8;
          font-weight: 500;
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          backgroundColor: '#1e293b',
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#f1f5f9',
              margin: '0',
              letterSpacing: '-0.5px',
            }}
          >
            Video Management
          </h1>
          <p
            style={{
              color: '#94a3b8',
              marginTop: '0.5rem',
              fontSize: '0.95rem',
            }}
          >
            Upload and manage solution videos for problems
          </p>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '2rem',
        }}
      >
        {/* Error Alert */}
        {error && (
          <div className="error-banner" style={{ marginBottom: '1.5rem' }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="10" cy="10" r="9" />
              <line x1="10" y1="6" x2="10" y2="10" />
              <circle cx="10" cy="14" r="1" fill="currentColor" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{
                  height: '56px',
                  borderRadius: '0.375rem',
                }}
              />
            ))}
          </div>
        ) : problems.length === 0 ? (
          // Empty State
          <div className="empty-state">
            <div
              style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                opacity: 0.5,
              }}
            >
              🎬
            </div>
            <h2
              style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#cbd5e1',
                marginBottom: '0.5rem',
              }}
            >
              No problems found
            </h2>
            <p
              style={{
                fontSize: '0.95rem',
                marginBottom: '1.5rem',
              }}
            >
              Create problems first to manage their solution videos.
            </p>
            <button
              onClick={fetchProblems}
              className="btn-primary"
            >
              Refresh
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{problems.length}</div>
                <div className="stat-label">Total Problems</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {problems.filter((p) => p.difficulty?.toLowerCase() === 'easy').length}
                </div>
                <div className="stat-label">Easy Problems</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {problems.filter((p) => p.difficulty?.toLowerCase() === 'medium').length}
                </div>
                <div className="stat-label">Medium Problems</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {problems.filter((p) => p.difficulty?.toLowerCase() === 'hard').length}
                </div>
                <div className="stat-label">Hard Problems</div>
              </div>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                <svg
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '18px',
                    height: '18px',
                    color: '#64748b',
                    pointerEvents: 'none',
                  }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search problems by title, difficulty, or tags..."
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    paddingLeft: '2.5rem',
                  }}
                />
              </div>
            </div>

            {/* Results Count */}
            {searchQuery && (
              <p
                style={{
                  color: '#94a3b8',
                  fontSize: '0.9rem',
                  marginBottom: '1rem',
                }}
              >
                Showing {filteredProblems.length} of {problems.length} problems
              </p>
            )}

            {/* Table */}
            {filteredProblems.length === 0 ? (
              <div className="empty-state">
                <div
                  style={{
                    fontSize: '2rem',
                    marginBottom: '1rem',
                    opacity: 0.5,
                  }}
                >
                  🔍
                </div>
                <h2
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#cbd5e1',
                    marginBottom: '0.5rem',
                  }}
                >
                  No results found
                </h2>
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: '#94a3b8',
                  }}
                >
                  Try adjusting your search query
                </p>
              </div>
            ) : (
              <div
                style={{
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '0.75rem',
                  overflow: 'hidden',
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      color: '#f1f5f9',
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          backgroundColor: 'rgba(30, 41, 59, 0.5)',
                          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                        }}
                      >
                        <th
                          style={{
                            padding: '1rem',
                            textAlign: 'left',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color: '#cbd5e1',
                            letterSpacing: '0.5px',
                            width: '5%',
                          }}
                        >
                          #
                        </th>
                        <th
                          style={{
                            padding: '1rem',
                            textAlign: 'left',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color: '#cbd5e1',
                            letterSpacing: '0.5px',
                            width: '35%',
                          }}
                        >
                          Title
                        </th>
                        <th
                          style={{
                            padding: '1rem',
                            textAlign: 'left',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color: '#cbd5e1',
                            letterSpacing: '0.5px',
                            width: '15%',
                          }}
                        >
                          Difficulty
                        </th>
                        <th
                          style={{
                            padding: '1rem',
                            textAlign: 'left',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color: '#cbd5e1',
                            letterSpacing: '0.5px',
                            width: '25%',
                          }}
                        >
                          Tags
                        </th>
                        <th
                          style={{
                            padding: '1rem',
                            textAlign: 'center',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color: '#cbd5e1',
                            letterSpacing: '0.5px',
                            width: '20%',
                          }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProblems.map((problem, index) => (
                        <tr
                          key={problem._id}
                          className="table-row-hover"
                          style={{
                            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                          }}
                        >
                          <td
                            style={{
                              padding: '1rem',
                              color: '#94a3b8',
                              fontSize: '0.9rem',
                            }}
                          >
                            {index + 1}
                          </td>
                          <td
                            style={{
                              padding: '1rem',
                              fontSize: '0.95rem',
                              fontWeight: '500',
                            }}
                          >
                            {problem.title}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span
                              className={`badge-difficulty badge-${problem.difficulty.toLowerCase()}`}
                            >
                              {problem.difficulty}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.5rem',
                              }}
                            >
                              {typeof problem.tags === 'string'
                                ? problem.tags.split(',').map((tag, i) => (
                                    <span
                                      key={i}
                                      className="badge-tag"
                                    >
                                      {tag.trim()}
                                    </span>
                                  ))
                                : Array.isArray(problem.tags)
                                ? problem.tags.map((tag, i) => (
                                    <span
                                      key={i}
                                      className="badge-tag"
                                    >
                                      {tag}
                                    </span>
                                  ))
                                : <span className="badge-tag">{problem.tags}</span>}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: '1rem',
                              textAlign: 'center',
                            }}
                          >
                            <div className="action-group">
                              <NavLink
                                to={`/admin/upload/${problem._id}`}
                                className="btn-upload"
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="17 8 12 3 7 8" />
                                  <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                Upload
                              </NavLink>
                              <button
                                onClick={() =>
                                  openDeleteModal(problem._id, problem.title)
                                }
                                className="btn-delete"
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  <line x1="10" y1="11" x2="10" y2="17" />
                                  <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#f1f5f9',
                  marginBottom: '0.5rem',
                }}
              >
                Delete Video?
              </h2>
              <p
                style={{
                  color: '#94a3b8',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                }}
              >
                You're about to delete the video for <strong style={{ color: '#cbd5e1' }}>"{deleteModal.title}"</strong>.
                This action cannot be undone.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={closeDeleteModal}
                className="btn-secondary"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-primary"
                style={{
                  backgroundColor: '#ef4444',
                }}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVideo;