// The user stands this far behind the grips, so the arms hang with a slight elbow bend.
export const REACH_OFFSET = 0.29;
export const STANDING_LEAN = 0.14;

/** Both feet flat beside the pelvis, hands on the grips. Positions are in the walker's space. */
export function standingPose(user, gripZ) {
  const z = gripZ - REACH_OFFSET * user.scale; // limbs scale with height, so does the distance to the grips
  const x = user.length.hipHalf * 0.92;
  return {
    pelvisZ: z,
    lean: STANDING_LEAN,
    yaw: 0,
    left: { x: -x, z: z + 0.02, y: 0 },
    right: { x, z: z + 0.02, y: 0 },
  };
}
