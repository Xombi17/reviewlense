// All lengths in metres. The walker faces +Z; the user stands behind it at -Z.
export const COLORS = {
  orange: 0xf26b1d,
  background: 0xe9eaed,
  lockOn: 0x2ecc71,
  lockOff: 0xff5a36,
};

export const DIM = {
  halfWidth: 0.25, // frame centre-line to walker centre-line (0.5 m between frames)
  foldHalfWidth: 0.065, // same, with the walker folded for storage
  frontZ: 0.14, // front upright axis
  rearFootZ: -0.19, // rear foot axis (overall depth ~0.45 m incl. feet)
  rearSplay: 0.075, // how far the rear foot sits outside the frame plane
  tubeRadius: 0.015,
  upperTubeRadius: 0.0135,
  collarRadius: 0.0225,
  footHeight: 0.09,
  topCollarY: 0.6, // top of the fixed lower front tube
  junctionY: 0.41, // where the rear leg leaves the front upright
  panelY: 0.5, // rest-panel hinge height (~60 % of handle height)
  panelHeight: 0.14,
  panelThickness: 0.03,
  heightRange: [0.75, 0.95],
  angleRange: [-5, 30], // degrees, positive = rear of the grip tilts down
};

export const DEFAULT_STATE = {
  handleHeight: 0.85,
  handleAngle: 10,
  panelOpen: 0, // 0 folded flush, 1 unfolded perch
  lock: 1, // 1 locked (lever pushed down), 0 released
  fold: 0, // 0 in use, 1 folded for storage
};
