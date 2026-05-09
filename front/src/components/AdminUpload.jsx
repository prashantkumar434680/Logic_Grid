import { useParams } from 'react-router';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import axiosClient from '../utils/axiosClient';

function AdminUpload() {
  const { problemId } = useParams();

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setError,
    clearErrors,
    setValue,
  } = useForm();

  const selectedFile = watch('videoFile')?.[0];

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = e.dataTransfer.files;
      setValue('videoFile', files);
    }
  };

  // Upload video to Cloudinary
  const onSubmit = async (data) => {
    const file = data.videoFile[0];

    setUploading(true);
    setUploadProgress(0);
    clearErrors();

    try {
      // Step 1: Get upload signature from backend
      const signatureResponse = await axiosClient.get(
        `/video/create/${problemId}`
      );
      const {
        signature,
        timestamp,
        public_id,
        api_key,
        cloud_name,
        upload_url,
      } = signatureResponse.data;

      // Step 2: Create FormData for Cloudinary upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', signature);
      formData.append('timestamp', timestamp);
      formData.append('public_id', public_id);
      formData.append('api_key', api_key);

      // Step 3: Upload directly to Cloudinary
      const uploadResponse = await axios.post(upload_url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });

      const cloudinaryResult = uploadResponse.data;

      // Step 4: Save video metadata to backend
      const metadataResponse = await axiosClient.post('/video/save', {
        problemId: problemId,
        cloudinaryPublicId: cloudinaryResult.public_id,
        secureUrl: cloudinaryResult.secure_url,
        duration: cloudinaryResult.duration,
      });

      setUploadedVideo(metadataResponse.data.videoSolution);
      reset();
    } catch (err) {
      setError('root', {
        type: 'manual',
        message:
          err.response?.data?.message || 'Upload failed. Please try again.',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        backgroundImage:
          'radial-gradient(circle at 20% 50%, rgba(59, 158, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 158, 255, 0.05) 0%, transparent 50%)',
      }}
      className="p-4 sm:p-8 flex items-center justify-center"
    >
      <style>{`
        * {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
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

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes successCheckmark {
          0% {
            transform: scale(0) rotate(-45deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(0deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        .upload-container {
          width: 100%;
          max-width: 500px;
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .card-wrapper {
          background: linear-gradient(135deg, #1e293b 0%, #243548 100%);
          border: 1px solid rgba(59, 158, 255, 0.15);
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .card-wrapper:hover {
          border-color: rgba(59, 158, 255, 0.25);
          box-shadow: 0 25px 80px rgba(59, 158, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .card-header {
          margin-bottom: 1.5rem;
        }

        .card-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #f1f5f9;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.5px;
        }

        .card-subtitle {
          font-size: 0.85rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 0;
        }

        .form-group {
          margin-bottom: 1.75rem;
        }

        .drop-zone {
          position: relative;
          border: 2px dashed rgba(59, 158, 255, 0.4);
          border-radius: 12px;
          padding: 2.5rem 1.5rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(59, 158, 255, 0.03);
          overflow: hidden;
        }

        .drop-zone::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at center, rgba(59, 158, 255, 0.1), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .drop-zone.active,
        .drop-zone:hover {
          border-color: #3b9eff;
          background: rgba(59, 158, 255, 0.08);
        }

        .drop-zone.active::before {
          opacity: 1;
        }

        .drop-zone input {
          display: none;
        }

        .drop-zone-content {
          position: relative;
          z-index: 1;
        }

        .drop-zone-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          animation: float 3s ease-in-out infinite;
          display: inline-block;
        }

        .drop-zone-text {
          font-size: 0.95rem;
          color: #cbd5e1;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .drop-zone-hint {
          font-size: 0.8rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .file-info {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 10px;
          padding: 1rem;
          animation: slideIn 0.4s ease;
        }

        .file-info-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .file-info-title {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #4ade80;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .file-info-clear {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 0.9rem;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .file-info-clear:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
        }

        .file-info-rows {
          display: grid;
          gap: 0.75rem;
        }

        .file-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
        }

        .file-info-label {
          color: #cbd5e1;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
        }

        .file-info-value {
          color: #4ade80;
          font-weight: 600;
          font-family: 'Monaco', 'Courier New', monospace;
        }

        .progress-container {
          animation: slideIn 0.4s ease;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
          font-size: 0.85rem;
        }

        .progress-label {
          color: #cbd5e1;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
        }

        .progress-percent {
          color: #3b9eff;
          font-weight: 700;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.9rem;
        }

        .progress-bar-wrapper {
          width: 100%;
          height: 6px;
          background: rgba(59, 158, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
          border: 1px solid rgba(59, 158, 255, 0.2);
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #3b9eff, #5faeff);
          border-radius: 3px;
          transition: width 0.3s ease;
          box-shadow: 0 0 10px rgba(59, 158, 255, 0.6);
        }

        .alert {
          border-radius: 10px;
          padding: 1.25rem;
          font-size: 0.9rem;
          animation: slideIn 0.4s ease;
          border: 1px solid;
        }

        .alert-error {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
          border-color: rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }

        .alert-success {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
          border-color: rgba(16, 185, 129, 0.3);
          color: #86efac;
        }

        .alert-icon {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
          display: inline-block;
          animation: successCheckmark 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .alert-title {
          font-weight: 600;
          display: block;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
        }

        .alert-message {
          margin: 0.25rem 0;
          opacity: 0.95;
          font-family: 'Monaco', 'Courier New', monospace;
        }

        .button {
          width: 100%;
          padding: 0.875rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .button:hover:not(:disabled)::before {
          left: 100%;
        }

        .button-primary {
          background: linear-gradient(135deg, #3b9eff, #2d7fd4);
          color: white;
          box-shadow: 0 8px 20px rgba(59, 158, 255, 0.3);
          border: 1px solid rgba(59, 158, 255, 0.5);
        }

        .button-primary:hover:not(:disabled) {
          box-shadow: 0 12px 30px rgba(59, 158, 255, 0.5);
          border-color: #3b9eff;
          transform: translateY(-2px);
        }

        .button-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .button-primary.loading {
          animation: pulse 1.5s ease-in-out infinite;
        }

        .label-error {
          color: #fca5a5;
          font-size: 0.8rem;
          margin-top: 0.5rem;
          display: block;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
        }

        .success-actions {
          display: grid;
          gap: 0.75rem;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(16, 185, 129, 0.3);
        }

        .success-action {
          font-size: 0.85rem;
          color: #86efac;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
      `}</style>

      <div className="upload-container">
        <div className="card-wrapper">
          <div className="card-header">
            <h2 className="card-title">Upload Solution Video</h2>
            <p className="card-subtitle">Cloudinary powered</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="form-group">
            {/* Drag & Drop Zone */}
            <div className="form-group">
              <div
                className={`drop-zone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('videoFileInput')?.click()}
              >
                <input
                  id="videoFileInput"
                  type="file"
                  accept="video/*"
                  {...register('videoFile', {
                    required: 'Please select a video file',
                    validate: {
                      isVideo: (files) => {
                        if (!files || !files[0])
                          return 'Please select a video file';
                        const file = files[0];
                        return (
                          file.type.startsWith('video/') ||
                          'Please select a valid video file'
                        );
                      },
                      fileSize: (files) => {
                        if (!files || !files[0]) return true;
                        const file = files[0];
                        const maxSize = 100 * 1024 * 1024;
                        return (
                          file.size <= maxSize ||
                          'File size must be less than 100MB'
                        );
                      },
                    },
                  })}
                  disabled={uploading}
                />
                <div className="drop-zone-content">
                  <div className="drop-zone-icon">📹</div>
                  <div className="drop-zone-text">
                    {dragActive
                      ? 'Drop your video here'
                      : 'Drag & drop your video'}
                  </div>
                  <div className="drop-zone-hint">
                    or click to browse • up to 100 MB
                  </div>
                </div>
              </div>

              {errors.videoFile && (
                <span className="label-error">{errors.videoFile.message}</span>
              )}
            </div>

            {/* Selected File Info */}
            {selectedFile && (
              <div className="form-group">
                <div className="file-info">
                  <div className="file-info-header">
                    <div className="file-info-title">
                      <span>✓</span>
                      <span>File Selected</span>
                    </div>
                    <button
                      type="button"
                      className="file-info-clear"
                      onClick={() => setValue('videoFile', null)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="file-info-rows">
                    <div className="file-info-row">
                      <span className="file-info-label">📄 Name</span>
                      <span className="file-info-value">{selectedFile.name}</span>
                    </div>
                    <div className="file-info-row">
                      <span className="file-info-label">💾 Size</span>
                      <span className="file-info-value">
                        {formatFileSize(selectedFile.size)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="form-group">
                <div className="progress-container">
                  <div className="progress-header">
                    <span className="progress-label">⬆️ Uploading to Cloudinary</span>
                    <span className="progress-percent">{uploadProgress}%</span>
                  </div>
                  <div className="progress-bar-wrapper">
                    <div
                      className="progress-bar"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errors.root && (
              <div className="form-group">
                <div className="alert alert-error">
                  <span className="alert-icon">⚠️</span>
                  <span className="alert-title">Upload Failed</span>
                  <span className="alert-message">{errors.root.message}</span>
                </div>
              </div>
            )}

            {/* Success Message */}
            {uploadedVideo && (
              <div className="form-group">
                <div className="alert alert-success">
                  <span className="alert-icon">✓</span>
                  <span className="alert-title">Upload Successful</span>
                  <div className="success-actions">
                    <div className="success-action">
                      <span>⏱️</span>
                      <span>Duration: {formatDuration(uploadedVideo.duration)}</span>
                    </div>
                    <div className="success-action">
                      <span>🕐</span>
                      <span>
                        {new Date(uploadedVideo.uploadedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className={`button button-primary ${uploading ? 'loading' : ''}`}
            >
              {uploading ? '⬆️ Uploading...' : '↗️ Upload Video'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminUpload;