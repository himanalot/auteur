#!/usr/bin/env python3
"""
File Upload Server for React Frontend
Handles video and image file uploads
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
import logging
from werkzeug.utils import secure_filename
import mimetypes

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
UPLOAD_FOLDER = 'uploads'
MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024  # 2GB
ALLOWED_EXTENSIONS = {
    'video': ['mp4', 'mov', 'avi', 'wmv', 'webm'],
    'image': ['jpg', 'jpeg', 'png', 'webp', 'gif']
}

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename, file_type='video'):
    """Check if file extension is allowed"""
    if '.' not in filename:
        return False
    
    extension = filename.rsplit('.', 1)[1].lower()
    return extension in ALLOWED_EXTENSIONS.get(file_type, [])

def get_file_type(filename):
    """Determine if file is video or image"""
    if '.' not in filename:
        return None
    
    extension = filename.rsplit('.', 1)[1].lower()
    
    if extension in ALLOWED_EXTENSIONS['video']:
        return 'video'
    elif extension in ALLOWED_EXTENSIONS['image']:
        return 'image'
    
    return None

@app.route('/api/upload/video', methods=['POST'])
def upload_file():
    """Handle file upload endpoint"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided'
            }), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Get frame rate parameter
        frame_rate = request.form.get('frameRate', '1')
        try:
            frame_rate = float(frame_rate)
        except ValueError:
            frame_rate = 1.0
        
        # Determine file type
        file_type = get_file_type(file.filename)
        if not file_type:
            return jsonify({
                'success': False,
                'error': f'Unsupported file type. Supported: {", ".join(ALLOWED_EXTENSIONS["video"] + ALLOWED_EXTENSIONS["image"])}'
            }), 400
        
        # Check file size (Flask handles this automatically based on MAX_CONTENT_LENGTH)
        # But we can add custom validation here if needed
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        original_filename = secure_filename(file.filename)
        file_extension = original_filename.rsplit('.', 1)[1].lower()
        saved_filename = f"{file_id}.{file_extension}"
        file_path = os.path.join(UPLOAD_FOLDER, saved_filename)
        
        # Save file
        file.save(file_path)
        
        # Get file info
        file_size = os.path.getsize(file_path)
        mime_type = mimetypes.guess_type(file_path)[0] or f'{file_type}/*'
        
        logger.info(f"File uploaded successfully: {original_filename} ({file_size} bytes)")
        
        # Return success response
        return jsonify({
            'success': True,
            'fileId': file_id,
            'fileName': original_filename,
            'fileSize': file_size,
            'mimeType': mime_type,
            'frameRate': frame_rate,
            'savedPath': file_path
        })
        
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify({
            'success': False,
            'error': f'Upload failed: {str(e)}'
        }), 500

@app.route('/api/files/<file_id>', methods=['GET'])
def get_file_info(file_id):
    """Get information about an uploaded file"""
    try:
        # Find file with this ID
        for filename in os.listdir(UPLOAD_FOLDER):
            if filename.startswith(file_id):
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                file_size = os.path.getsize(file_path)
                mime_type = mimetypes.guess_type(file_path)[0]
                
                return jsonify({
                    'success': True,
                    'fileId': file_id,
                    'fileName': filename,
                    'fileSize': file_size,
                    'mimeType': mime_type,
                    'filePath': file_path
                })
        
        return jsonify({
            'success': False,
            'error': 'File not found'
        }), 404
        
    except Exception as e:
        logger.error(f"File info error: {e}")
        return jsonify({
            'success': False,
            'error': f'Failed to get file info: {str(e)}'
        }), 500

@app.route('/api/files/<file_id>', methods=['DELETE'])
def delete_file(file_id):
    """Delete an uploaded file"""
    try:
        # Find and delete file with this ID
        for filename in os.listdir(UPLOAD_FOLDER):
            if filename.startswith(file_id):
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                os.remove(file_path)
                
                logger.info(f"File deleted: {filename}")
                
                return jsonify({
                    'success': True,
                    'message': 'File deleted successfully'
                })
        
        return jsonify({
            'success': False,
            'error': 'File not found'
        }), 404
        
    except Exception as e:
        logger.error(f"File deletion error: {e}")
        return jsonify({
            'success': False,
            'error': f'Failed to delete file: {str(e)}'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'success': True,
        'status': 'healthy',
        'upload_folder': UPLOAD_FOLDER,
        'max_file_size': MAX_FILE_SIZE
    })

@app.errorhandler(413)
def too_large(e):
    """Handle file too large error"""
    return jsonify({
        'success': False,
        'error': f'File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB'
    }), 413

if __name__ == '__main__':
    print("📁 File Upload Server for React Frontend")
    print("=" * 50)
    print("✅ Handling video and image uploads")
    print("🌐 Server will be available at: http://127.0.0.1:3001")
    print(f"📂 Upload folder: {os.path.abspath(UPLOAD_FOLDER)}")
    print(f"📏 Max file size: {MAX_FILE_SIZE // (1024*1024)}MB")
    print("📝 Logs will appear below:")
    print("=" * 50)
    
    # Set max file size for Flask
    app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE
    
    # Run the server
    app.run(
        host='127.0.0.1',
        port=3001,
        debug=False,
        threaded=True
    )