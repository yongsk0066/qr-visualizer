# QR Code Detection Process

The detection process transforms an image containing a QR code into a tri-state matrix ready for decoding.

## Step 1: Image Input
- File upload with drag-and-drop support
- Camera capture (manual/real-time modes)
- Virtual 3D camera for testing
- Support for PNG, JPG, JPEG, GIF formats

## Step 2: Grayscale Conversion
- ITU-R BT.709 luma coefficients
- Real-time histogram visualization
- Statistical analysis (min/max/mean/std deviation)

## Step 3: Binarization
- Sauvola adaptive thresholding algorithm
- Window size: 31px, k parameter: 0.2
- Integral images for O(1) local statistics
- Threshold map visualization

## Step 4: Finder Pattern Detection
- OpenCV.js contour-based detection
- Hierarchical contour analysis for nested squares
- Multiple epsilon values for polygon approximation (0.02-0.1)
- Top 3 patterns selection with position-based classification
- QR boundary calculation using line intersection

## Step 5: Homography Transformation
- Initial transformation using 3 Finder Patterns
- Bottom-right corner calculation via line intersection
- Perspective transformation with OpenCV.js
- Refined homography with re-detection on rectified image
- Timing pattern analysis for precise version detection

## Step 6: Module Sampling
- Grid-based sampling at module centers
- Tri-state classification: Black (1), White (0), Unknown (-1)
- Adaptive thresholding for robust classification
- Sampling statistics and confidence metrics
- ~2.6% unknown modules for typical images

## Technical Implementation
- OpenCV.js for computer vision algorithms
- Canvas API for image manipulation
- WebRTC getUserMedia for camera access
- Three.js for virtual camera simulation
- 20+ comprehensive tests