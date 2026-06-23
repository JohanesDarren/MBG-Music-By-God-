from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import shutil
import os
import uuid

# We will try to import librosa and soundfile, but if they aren't installed, we will provide a fallback mock
# so the API doesn't crash on startup and users can see what they need to install.
# Trigger uvicorn reload
try:
    import librosa
    import soundfile as sf
    import numpy as np
    HAS_LIBROSA = True
    
    # Generate rich chord templates (9 qualities: Maj, Min, Dim, Aug, sus4, sus2, 7, Maj7, Min7)
    CHORD_CLASSES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    def generate_chord_templates():
        templates = []
        labels = []
        
        # Root is index 0, third is index 1, fifth is index 2, seventh is index 3
        # Custom weights favor roots (1.2) and fifths/thirds (1.0) and sevenths (0.8)
        qualities = {
            "Maj": {0: 1.2, 4: 1.0, 7: 1.0},
            "Min": {0: 1.2, 3: 1.0, 7: 1.0},
            "Dim": {0: 1.2, 3: 1.0, 6: 1.0},
            "Aug": {0: 1.2, 4: 1.0, 8: 1.0},
            "sus4": {0: 1.2, 5: 1.0, 7: 1.0},
            "sus2": {0: 1.2, 2: 1.0, 7: 1.0},
            "7": {0: 1.2, 4: 1.0, 7: 1.0, 10: 0.8},
            "Maj7": {0: 1.2, 4: 1.0, 7: 1.0, 11: 0.8},
            "Min7": {0: 1.2, 3: 1.0, 7: 1.0, 10: 0.8}
        }
        
        for i in range(12):
            for name, intervals in qualities.items():
                t = np.zeros(12)
                for semitone, weight in intervals.items():
                    t[(i + semitone) % 12] = weight
                templates.append(t)
                labels.append(f"{CHORD_CLASSES[i]} {name}")
                
        return np.array(templates), labels

    CHORD_TEMPLATES, CHORD_LABELS = generate_chord_templates()

except ImportError:
    HAS_LIBROSA = False
    CHORD_TEMPLATES, CHORD_LABELS = [], []

app = FastAPI()

# Enable CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a directory to store processed files
OUTPUT_DIR = "outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Mount the outputs directory so the frontend can access the processed files via URL
app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")

@app.post("/api/process/hpss")
async def process_hpss(file: UploadFile = File(...)):
    # Generate unique filenames
    file_id = str(uuid.uuid4())[:8]
    # Extract original extension
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".wav"
        
    input_path = os.path.join(OUTPUT_DIR, f"input_{file_id}{ext}")
    harmonic_path = os.path.join(OUTPUT_DIR, f"harmonic_{file_id}.wav")
    percussive_path = os.path.join(OUTPUT_DIR, f"percussive_{file_id}.wav")
    
    # Save the uploaded file
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    if HAS_LIBROSA:
        try:
            # 1. Load the audio file as stereo if possible (mono=False)
            y, sr = librosa.load(input_path, sr=None, mono=False)
            
            # 2. Perform Harmonic-Percussive Source Separation
            # Optimized margins: 1.2 for harmonic to cut drums, 1.8 for percussive to cut vocals/tonals
            harmonic, percussive = librosa.effects.hpss(y, margin=(1.2, 1.8))
            
            # 3. Save the separated audio stems
            # Transpose if stereo: soundfile expects (samples, channels), librosa is (channels, samples)
            if y.ndim > 1:
                sf.write(harmonic_path, harmonic.T, sr)
                sf.write(percussive_path, percussive.T, sr)
            else:
                sf.write(harmonic_path, harmonic, sr)
                sf.write(percussive_path, percussive, sr)
            
        except Exception as e:
            return {"error": str(e)}
    else:
        # Fallback: Just return the original file as both to simulate it working
        # (Useful if the user hasn't installed librosa yet)
        shutil.copy(input_path, harmonic_path)
        shutil.copy(input_path, percussive_path)

    # Return the URLs where the frontend can access these files
    # The /outputs mount handles serving them
    return {
        "harmonic": f"/outputs/harmonic_{file_id}.wav",
        "percussive": f"/outputs/percussive_{file_id}.wav"
    }

@app.get("/")
def read_root():
    return {"message": "MBG FastAPI Backend is running!"}

@app.post("/api/process/chords")
async def process_chords(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())[:8]
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".wav"
        
    input_path = os.path.join(OUTPUT_DIR, f"chord_input_{file_id}{ext}")
    
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    if not HAS_LIBROSA:
        # Fallback dummy data if librosa isn't installed
        return [
            {"time": 0.0, "chord": "C Maj"},
            {"time": 4.5, "chord": "G Min"},
            {"time": 8.0, "chord": "F Maj"}
        ]
        
    try:
        import scipy.ndimage
        
        # Load audio (downsampled to 22050 for speed, forced to mono for analysis)
        y, sr = librosa.load(input_path, sr=22050, mono=True)
        
        # Get beat trackers
        tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
        
        # Ensure beat_frames is not empty
        if len(beat_frames) == 0:
            # Fall back to a grid of beats every 0.5s if beat tracking fails
            duration = librosa.get_duration(y=y, sr=sr)
            beat_times = np.arange(0, duration, 0.5)
            beat_frames = librosa.time_to_frames(beat_times, sr=sr)
        else:
            beat_times = librosa.frames_to_time(beat_frames, sr=sr)
            
        # Ensure array shapes are safely indexable
        beat_times = np.atleast_1d(beat_times)
        beat_frames = np.atleast_1d(beat_frames)
        
        # Compute RMS energy to identify silence / "No Chord" parts
        rms = librosa.feature.rms(y=y)
        beat_rms = librosa.util.sync(rms, beat_frames, aggregate=np.mean).squeeze()
        beat_rms = np.atleast_1d(beat_rms)
        
        # Absolute threshold of 0.001 to detect actual digital/acoustic silence only
        # This prevents quiet intros and acoustic parts from being marked as N.C.
        silence_threshold = 0.001
        
        # Compute CQT with default parameters (fast and perfectly aligned)
        C = np.abs(librosa.cqt(y=y, sr=sr))
        
        # Decompose CQT into harmonic and percussive parts to completely isolate chords from drums
        C_harmonic, _ = librosa.decompose.hpss(C)
        
        # Compute chromagram directly from the harmonic CQT matrix
        chromagram = librosa.feature.chroma_cqt(C=C_harmonic, sr=sr)
        
        # Sync chromagram to beat frames using median aggregation
        beat_chroma = librosa.util.sync(chromagram, beat_frames, aggregate=np.median).T
        
        # Normalize templates and beat_chroma for cosine similarity
        templates_norm = CHORD_TEMPLATES / np.linalg.norm(CHORD_TEMPLATES, axis=1, keepdims=True)
        norms = np.linalg.norm(beat_chroma, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        beat_chroma_norm = beat_chroma / norms
        
        # Compute similarities
        similarities = np.dot(beat_chroma_norm, templates_norm.T)
        
        # Apply temporal smoothing to similarity values across beats using a moving average window
        if similarities.shape[0] >= 3:
            similarities = scipy.ndimage.uniform_filter1d(similarities, size=3, axis=0)
            
        best_chord_indices = np.argmax(similarities, axis=1)
        best_chord_indices = np.atleast_1d(best_chord_indices)
        
        # Build chord list and simplify consecutive duplicate chords
        chords = []
        for i, (time, idx) in enumerate(zip(beat_times, best_chord_indices)):
            # Check for silence/low energy at this beat
            is_silent = beat_rms[i] < silence_threshold if i < len(beat_rms) else False
            chord_name = "N.C." if is_silent else CHORD_LABELS[idx]
            
            if not chords or chords[-1]["chord"] != chord_name:
                chords.append({
                    "time": float(time),
                    "chord": chord_name
                })
                
        # Always make sure the first chord starts at time 0.0 (prevents duplication)
        if chords:
            chords[0]["time"] = 0.0
        else:
            chords = [{"time": 0.0, "chord": "N.C."}]
            
        return chords
        
    except Exception as e:
        return {"error": str(e)}
