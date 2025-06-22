// Camera settings
export const CAMERA_POSITION = [0, 0, 5] as const;
export const CAMERA_FOV = 50;

// Canvas settings
export const MAX_CANVAS_SIZE = 400;
export const CANVAS_PADDING = 24;
export const DEFAULT_CANVAS_SIZE = 300;

// Capture settings
export const CAPTURE_INTERVAL = 500; // milliseconds
export const CAPTURE_CHECK_INTERVAL = 50; // milliseconds
export const INITIAL_CAPTURE_DELAY = 500; // milliseconds
export const DEFAULT_CAPTURE_RESOLUTION = 1024;
export const CAPTURE_RESOLUTIONS = [512, 1024, 2048] as const;

// QR rendering settings
export const QR_MODULE_SCALE = 20; // pixels per module
export const QR_QUIET_ZONE = 4; // modules
export const QR_BOX_SIZE = [2, 2, 0.1] as const; // 3D box dimensions
export const FINDER_PATTERN_CORE_SIZE = 7; // 7x7 modules

// Tomato animation settings
export const TOMATO_RADIUS = 0.12;
export const TOMATO_START_POSITION = {
  x: { offset: 0.2 }, // Random range: -0.1 to 0.1
  y: { base: -0.5, offset: 0.1 }, // Random range: -0.55 to -0.45
  z: 3.5 // Fixed Z position
} as const;
export const TOMATO_TARGET_RADIUS = 1.0; // Half of QR box size
export const TOMATO_PARABOLA_HEIGHT = 1.5;
export const TOMATO_FLIGHT_DURATION = { base: 1.5, random: 0.5 } as const; // 1.5-2 seconds
export const TOMATO_COOLDOWN = 100; // milliseconds

// Damage spot settings
export const DAMAGE_SPOT_SIZE = { base: 30, random: 40 } as const; // 30-70 pixels
export const DAMAGE_SPOT_OPACITY = { base: 0.8, random: 0.2 } as const; // 0.8-1.0
export const DAMAGE_SPOT_RENDER_SCALE = 1.2; // Render area multiplier

// Damage gradient settings
export const DAMAGE_GRADIENT_COLORS = [
  { stop: 0, color: [140, 30, 30] },    // Dark center
  { stop: 0.5, color: [180, 50, 50] },  // Mid area
  { stop: 0.8, color: [220, 80, 80] },  // Outer area
  { stop: 1, color: [255, 100, 100] }   // Edge
] as const;

// Lighting settings
export const AMBIENT_LIGHT_INTENSITY = 0.5;
export const DIRECTIONAL_LIGHT_INTENSITY = 1;
export const DIRECTIONAL_LIGHT_POSITION = [10, 10, 5] as const;

// Material settings
export const TOMATO_MATERIAL = {
  color: '#e53e3e',
  roughness: 0.6,
  metalness: 0.1,
  emissive: '#ff6b6b',
  emissiveIntensity: 0.3
} as const;