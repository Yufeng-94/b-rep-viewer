# Web-based B-Rep Viewer

A web application for visualizing B-rep geometry from STEP files. Upload a STEP file to view and interact with the 3D model in your browser, with options to toggle faces, edges, and vertices.

![App demo]('./images/demo.gif')


## 📝 Repository Structure

```
b-rep-viewer/
├── app.py                 # Flask backend server
├── pyproject.toml         # Poetry dependencies management
├── templates/
│   └── index.html         # Main web interface
├── static/
│    └── js/
│        └── viewer.js     # Three.js visualization frontend
└── step_geometries/       # Sample STEP files for tests
```

## ⚙️ Installation & Setup

The dependencies are managed by [Poetry](https://python-poetry.org/) in `pyproject.toml`. 

```bash
# Install dependencies
poetry lock
poetry install

# Activate virtual environment
eval $(poetry env activate)
```

## 🚀 Running the Application

While in the activated environment, the run:

```bash
# Set Flask environment variable
export FLASK_APP=app.py

# Run the App
flask run
```

Open your browser and navigate to http://localhost:5000 to use the application.

## 🧑‍💻 Usage

### STEP File Uploading

Two options to upload a STEP file:

1. Drap the file and drop to the page;
2. Click the drop zone to open a file selection diaglog;

Once the file is uploaded, it will be converted to a mesh geometry and shown on the page.

### Interactive Controls

1. **Mouse Drag:** Rotate the model
2. **Mouse Wheel:** Zoom in/out
3. **Touch Gestures:** Rotate and zoom on mobile devices

### View Mode Toggles

Use buttons in the upper-left corner to switch between:

1. **Show Faces:** Display only surface geometry
2. **Show Edges:** Display only edge wireframes
3. **Show Vertices:** Display only vertex points
4. **Show All:** Display complete model with all components

### Resetting

Refresh the page to clear the current model and return to the upload interface.

## 🤖 Tochnology Stack

1. **Backend:** Python, Flask, CadQuery
2. **Frontend:** HTML5, CSS3, JavaScript, Three.js
3. **3D Processing:** B-rep to mesh conversion via CadQuery tessellation
4. **File Handling:** STEP file import and processing

