from flask import Flask, request, jsonify, render_template
import cadquery as cq
import os
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
    """Convert a STEP file to mesh data suitable for Three.js rendering."""
    try:
        # Load file
        assembly = cq.importers.importStep(step_file)

        # Get all solids from assembly
        solids = assembly.solids().vals() if hasattr(assembly, 'solids') else [assembly]

        mesh_data = {
            'faces': [],
            'edges': [],
            'vertices': [],
            'bounding_box': None,
        }

        vertices_flat = []
        vertices_nested = []
        faces_flat = []
        edges_flat = []

        for solid in solids:
            # Convert to mesh
            vertices, faces = solid.tessellate(0.1)

            for v in vertices:
                vertices_flat.extend([v.x, v.y, v.z])
                vertices_nested.append([v.x, v.y, v.z])


            face_list = []
            for f in faces:
                if len(f) == 3:
                    face_list.extend(list(f))
                elif len(f) > 3:
                    # Triangulate face if it has more than 3 vertices
                    for i in range(1, len(f) - 1):
                        face_list.extend([f[0], f[i], f[i + 1]])
            faces_flat.extend(face_list)

            edge_set = set()
            for f in faces: # Use original faces rather than triangulated faces
                for i in range(len(f)):
                    v1 = f[i]
                    v2 = f[(i+1) % len(f)]
                    edge = tuple(sorted((v1, v2)))
                    edge_set.add(edge)
            
            for edge in edge_set:
                edges_flat.extend([edge[0], edge[1]])

        mesh_data['vertices'] = vertices_flat
        mesh_data['faces'] = faces_flat
        mesh_data['edges'] = edges_flat

        # Calculate bounding box
        if vertices_nested:
            np_vertices = np.array(vertices_nested)
            min_coords = np_vertices.min(axis=0)
            max_coords = np_vertices.max(axis=0)
            mesh_data['bounding_box'] = {
                'min': min_coords.tolist(),
                'max': max_coords.tolist(),
                'center': ((min_coords + max_coords) / 2).tolist()
            }

        return mesh_data
                
    except Exception as e:
        raise RuntimeError(f"Failed to process STEP file: {str(e)}")

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