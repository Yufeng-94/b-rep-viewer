from flask import Flask, request, jsonify, render_template
import cadquery as cq
import os
import json
import numpy as np
from pathlib import Path

# Create a Flash application instance
app = Flask(__name__)

# Config settings
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 *1024

# Ensure the upload folder exists
Path(app.config['UPLOAD_FOLDER']).mkdir(exist_ok=True)

def step_to_mesh_data(step_file):
    pass

# Flash routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Check if the file is a STEP file
    if file and ((file.filename.endswith('.step')) or 
                 (file.filename.endswith('.stp'))):
        try:
            # Save uploaded file temporarily
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(filepath)

            # Process the STEP file
            mesh_data = step_to_mesh_data(filepath)

            # Clean up the temporary file
            os.remove(filepath)

            return jsonify(mesh_data)
        
        except Exception as e:
            return jsonify({'error': str(e)}), 500
        
    return jsonify({'error': 'Invalid file format. Only STEP files are supported.'}), 400