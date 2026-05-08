// import { useParams } from 'react-router';
// import React, { useState } from 'react';
// import { useForm } from 'react-hook-form';
// import axios from 'axios';
// import axiosClient from '../utils/axiosClient'

// function AdminUpload(){
    
//     const {problemId}  = useParams();
    
//     const [uploading, setUploading] = useState(false);
//     const [uploadProgress, setUploadProgress] = useState(0);
//     const [uploadedVideo, setUploadedVideo] = useState(null);
    
//       const {
//         register,
//         handleSubmit,
//         watch,
//         formState: { errors },
//         reset,
//         setError,
//         clearErrors
//       } = useForm();
    
//       const selectedFile = watch('videoFile')?.[0];
    
//       // Upload video to Cloudinary
//       const onSubmit = async (data) => {
//         const file = data.videoFile[0];
        
//         setUploading(true);
//         setUploadProgress(0);
//         clearErrors();
    
//         try {
//           // Step 1: Get upload signature from backend
//           const signatureResponse = await axiosClient.get(`/video/create/${problemId}`);
//           const { signature, timestamp, public_id, api_key, cloud_name, upload_url } = signatureResponse.data;
    
//           // Step 2: Create FormData for Cloudinary upload
//           const formData = new FormData();
//           formData.append('file', file);
//           formData.append('signature', signature);
//           formData.append('timestamp', timestamp);
//           formData.append('public_id', public_id);
//           formData.append('api_key', api_key);
    
//           // Step 3: Upload directly to Cloudinary
//           const uploadResponse = await axios.post(upload_url, formData, {
//             headers: {
//               'Content-Type': 'multipart/form-data',
//             },
//             onUploadProgress: (progressEvent) => {
//               const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
//               setUploadProgress(progress);
//             },
//           });
    
//           const cloudinaryResult = uploadResponse.data;
    
//           // Step 4: Save video metadata to backend
//           const metadataResponse = await axiosClient.post('/video/save', {
//             problemId:problemId,
//             cloudinaryPublicId: cloudinaryResult.public_id,
//             secureUrl: cloudinaryResult.secure_url,
//             duration: cloudinaryResult.duration,
//           });
    
//           setUploadedVideo(metadataResponse.data.videoSolution);
//           reset(); // Reset form after successful upload
          
//         } catch (err) {
//           // console.error('Upload error:', err);
//           setError('root', {
//             type: 'manual',
//             message: err.response?.data?.message || 'Upload failed. Please try again.'
//           });
//         } finally {
//           setUploading(false);
//           setUploadProgress(0);
//         }
//       };
    
//       // Format file size
//       const formatFileSize = (bytes) => {
//         if (bytes === 0) return '0 Bytes';
//         const k = 1024;
//         const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//         const i = Math.floor(Math.log(bytes) / Math.log(k));
//         return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//       };
    
//       // Format duration
//       const formatDuration = (seconds) => {
//         const mins = Math.floor(seconds / 60);
//         const secs = Math.floor(seconds % 60);
//         return `${mins}:${secs.toString().padStart(2, '0')}`;
//       };
    
//       return (
//         <div className="max-w-md mx-auto p-6">
//           <div className="card bg-base-100 shadow-xl">
//             <div className="card-body">
//               <h2 className="card-title">Upload Video</h2>
              
//               <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//                 {/* File Input */}
//                 <div className="form-control w-full">
//                   <label className="label">
//                     <span className="label-text">Choose video file</span>
//                   </label>
//                   <input
//                     type="file"
//                     accept="video/*"
//                     {...register('videoFile', {
//                       required: 'Please select a video file',
//                       validate: {
//                         isVideo: (files) => {
//                           if (!files || !files[0]) return 'Please select a video file';
//                           const file = files[0];
//                           return file.type.startsWith('video/') || 'Please select a valid video file';
//                         },
//                         fileSize: (files) => {
//                           if (!files || !files[0]) return true;
//                           const file = files[0];
//                           const maxSize = 100 * 1024 * 1024; // 100MB
//                           return file.size <= maxSize || 'File size must be less than 100MB';
//                         }
//                       }
//                     })}
//                     className={`file-input file-input-bordered w-full ${errors.videoFile ? 'file-input-error' : ''}`}
//                     disabled={uploading}
//                   />
//                   {errors.videoFile && (
//                     <label className="label">
//                       <span className="label-text-alt text-error">{errors.videoFile.message}</span>
//                     </label>
//                   )}
//                 </div>
    
//                 {/* Selected File Info */}
//                 {selectedFile && (
//                   <div className="alert alert-info">
//                     <div>
//                       <h3 className="font-bold">Selected File:</h3>
//                       <p className="text-sm">{selectedFile.name}</p>
//                       <p className="text-sm">Size: {formatFileSize(selectedFile.size)}</p>
//                     </div>
//                   </div>
//                 )}
    
//                 {/* Upload Progress */}
//                 {uploading && (
//                   <div className="space-y-2">
//                     <div className="flex justify-between text-sm">
//                       <span>Uploading...</span>
//                       <span>{uploadProgress}%</span>
//                     </div>
//                     <progress 
//                       className="progress progress-primary w-full" 
//                       value={uploadProgress} 
//                       max="100"
//                     ></progress>
//                   </div>
//                 )}
    
//                 {/* Error Message */}
//                 {errors.root && (
//                   <div className="alert alert-error">
//                     <span>{errors.root.message}</span>
//                   </div>
//                 )}
    
//                 {/* Success Message */}
//                 {uploadedVideo && (
//                   <div className="alert alert-success">
//                     <div>
//                       <h3 className="font-bold">Upload Successful!</h3>
//                       <p className="text-sm">Duration: {formatDuration(uploadedVideo.duration)}</p>
//                       <p className="text-sm">Uploaded: {new Date(uploadedVideo.uploadedAt).toLocaleString()}</p>
//                     </div>
//                   </div>
//                 )}
    
//                 {/* Upload Button */}
//                 <div className="card-actions justify-end">
//                   <button
//                     type="submit"
//                     disabled={uploading}
//                     className={`btn btn-primary ${uploading ? 'loading' : ''}`}
//                   >
//                     {uploading ? 'Uploading...' : 'Upload Video'}
//                   </button>
//                 </div>
//               </form>
            
//             </div>
//           </div>
//         </div>
//     );
// }


// export default AdminUpload;

















import { useParams } from 'react-router';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import axiosClient from '../utils/axiosClient'

function AdminUpload(){
    
    const {problemId}  = useParams();
    
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
        setValue
      } = useForm();
    
      const selectedFile = watch('videoFile')?.[0];
    
      // Handle drag events
      const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
          setDragActive(true);
        } else if (e.type === "dragleave") {
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
          const signatureResponse = await axiosClient.get(`/video/create/${problemId}`);
          const { signature, timestamp, public_id, api_key, cloud_name, upload_url } = signatureResponse.data;
    
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
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(progress);
            },
          });
    
          const cloudinaryResult = uploadResponse.data;
    
          // Step 4: Save video metadata to backend
          const metadataResponse = await axiosClient.post('/video/save', {
            problemId:problemId,
            cloudinaryPublicId: cloudinaryResult.public_id,
            secureUrl: cloudinaryResult.secure_url,
            duration: cloudinaryResult.duration,
          });
    
          setUploadedVideo(metadataResponse.data.videoSolution);
          reset();
          
        } catch (err) {
          setError('root', {
            type: 'manual',
            message: err.response?.data?.message || 'Upload failed. Please try again.'
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
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1a1f3a 100%)' }} className="p-4 sm:p-8 flex items-center justify-center">
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
            
            :root {
              --accent: #3b9eff;
              --accent-dark: #2d7fd4;
              --success: #10b981;
              --error: #ef4444;
              --bg-primary: #0f172a;
              --bg-secondary: #1e293b;
              --text-primary: #f1f5f9;
              --text-secondary: #cbd5e1;
            }

            * {
              box-sizing: border-box;
            }

            .upload-container {
              width: 100%;
              max-width: 480px;
              animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
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

            .card-wrapper {
              background: linear-gradient(135deg, #1e293b 0%, #243548 100%);
              border: 1px solid rgba(59, 158, 255, 0.15);
              border-radius: 16px;
              padding: 32px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
              backdrop-filter: blur(10px);
              transition: all 0.3s ease;
            }

            .card-wrapper:hover {
              border-color: rgba(59, 158, 255, 0.3);
              box-shadow: 0 25px 80px rgba(59, 158, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.08);
            }

            .card-title {
              font-family: 'Space Mono', monospace;
              font-size: 24px;
              font-weight: 700;
              color: var(--text-primary);
              margin-bottom: 8px;
              letter-spacing: -0.5px;
            }

            .card-subtitle {
              font-family: 'JetBrains Mono', monospace;
              font-size: 12px;
              color: var(--text-secondary);
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 24px;
            }

            .form-group {
              margin-bottom: 24px;
            }

            .drop-zone {
              position: relative;
              border: 2px dashed rgba(59, 158, 255, 0.4);
              border-radius: 12px;
              padding: 32px 24px;
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
              background: radial-gradient(circle at center, rgba(59, 158, 255, 0.08), transparent);
              opacity: 0;
              transition: opacity 0.3s ease;
              pointer-events: none;
            }

            .drop-zone.active,
            .drop-zone:hover {
              border-color: var(--accent);
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
              font-size: 40px;
              margin-bottom: 12px;
              animation: float 3s ease-in-out infinite;
            }

            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-8px); }
            }

            .drop-zone-text {
              font-family: 'JetBrains Mono', monospace;
              font-size: 13px;
              color: var(--text-secondary);
              margin-bottom: 4px;
            }

            .drop-zone-hint {
              font-family: 'JetBrains Mono', monospace;
              font-size: 11px;
              color: rgba(203, 213, 225, 0.6);
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .file-info {
              background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
              border: 1px solid rgba(16, 185, 129, 0.3);
              border-radius: 10px;
              padding: 16px;
              animation: slideIn 0.4s ease;
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

            .file-info-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
              font-family: 'JetBrains Mono', monospace;
              font-size: 12px;
            }

            .file-info-row:last-child {
              margin-bottom: 0;
            }

            .file-info-label {
              color: var(--text-secondary);
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .file-info-value {
              color: var(--text-primary);
              font-weight: 500;
            }

            .progress-container {
              animation: slideIn 0.4s ease;
            }

            .progress-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
              font-family: 'JetBrains Mono', monospace;
              font-size: 12px;
            }

            .progress-label {
              color: var(--text-secondary);
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .progress-percent {
              color: var(--accent);
              font-weight: 600;
              font-family: 'JetBrains Mono', monospace;
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
              background: linear-gradient(90deg, var(--accent), #5faeff);
              border-radius: 3px;
              transition: width 0.3s ease;
              box-shadow: 0 0 10px rgba(59, 158, 255, 0.6);
            }

            .alert {
              border-radius: 10px;
              padding: 16px;
              font-family: 'JetBrains Mono', monospace;
              font-size: 13px;
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

            .alert-title {
              font-weight: 600;
              margin-bottom: 6px;
              display: block;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-size: 12px;
            }

            .alert-message {
              margin: 4px 0;
              opacity: 0.9;
            }

            .button {
              width: 100%;
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              font-family: 'Space Mono', monospace;
              font-size: 13px;
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
              background: linear-gradient(135deg, var(--accent), var(--accent-dark));
              color: white;
              box-shadow: 0 8px 20px rgba(59, 158, 255, 0.3);
              border: 1px solid rgba(59, 158, 255, 0.5);
            }

            .button-primary:hover:not(:disabled) {
              box-shadow: 0 12px 30px rgba(59, 158, 255, 0.5);
              border-color: var(--accent);
              transform: translateY(-2px);
            }

            .button-primary:disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }

            .button-primary.loading {
              animation: pulse 1.5s ease-in-out infinite;
            }

            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }

            .label-error {
              color: #fca5a5;
              font-family: 'JetBrains Mono', monospace;
              font-size: 11px;
              margin-top: 6px;
              display: block;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
          `}</style>

          <div className="upload-container">
            <div className="card-wrapper">
              <h2 className="card-title">Upload Solution</h2>
              <p className="card-subtitle">Video walkthrough</p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                            if (!files || !files[0]) return 'Please select a video file';
                            const file = files[0];
                            return file.type.startsWith('video/') || 'Please select a valid video file';
                          },
                          fileSize: (files) => {
                            if (!files || !files[0]) return true;
                            const file = files[0];
                            const maxSize = 100 * 1024 * 1024;
                            return file.size <= maxSize || 'File size must be less than 100MB';
                          }
                        }
                      })}
                      disabled={uploading}
                    />
                    <div className="drop-zone-content">
                      <div className="drop-zone-icon">📹</div>
                      <div className="drop-zone-text">
                        {dragActive ? 'Drop your video here' : 'Drag & drop your video'}
                      </div>
                      <div className="drop-zone-hint">or click to browse • up to 100 MB</div>
                    </div>
                  </div>

                  {errors.videoFile && (
                    <span className="label-error">{errors.videoFile.message}</span>
                  )}
                </div>

                {/* Selected File Info */}
                {selectedFile && (
                  <div className="file-info">
                    <div className="file-info-row">
                      <span className="file-info-label">📄 File</span>
                      <span className="file-info-value">{selectedFile.name}</span>
                    </div>
                    <div className="file-info-row">
                      <span className="file-info-label">💾 Size</span>
                      <span className="file-info-value">{formatFileSize(selectedFile.size)}</span>
                    </div>
                  </div>
                )}

                {/* Upload Progress */}
                {uploading && (
                  <div className="progress-container">
                    <div className="progress-header">
                      <span className="progress-label">⬆️ Uploading</span>
                      <span className="progress-percent">{uploadProgress}%</span>
                    </div>
                    <div className="progress-bar-wrapper">
                      <div
                        className="progress-bar"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {errors.root && (
                  <div className="alert alert-error">
                    <span className="alert-title">⚠️ Upload failed</span>
                    <span className="alert-message">{errors.root.message}</span>
                  </div>
                )}

                {/* Success Message */}
                {uploadedVideo && (
                  <div className="alert alert-success">
                    <span className="alert-title">✓ Upload successful</span>
                    <div className="alert-message">
                      Duration: {formatDuration(uploadedVideo.duration)}
                    </div>
                    <div className="alert-message">
                      {new Date(uploadedVideo.uploadedAt).toLocaleString()}
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