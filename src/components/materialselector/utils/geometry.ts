export const deg2rad = (deg: number) => (deg * Math.PI) / 180;

export const angleStepFor = (total: number) => (total > 0 ? 360 / total : 0);

export const angleForIndex = (index: number, total: number) =>
  angleStepFor(total) * index;

export const positionForIndex = (
  index: number,
  total: number,
  radius: number
): { x: number; z: number } => {
  const angle = angleForIndex(index, total);
  const x = Math.sin(deg2rad(angle)) * radius;
  const z = Math.cos(deg2rad(angle)) * radius;
  return { x, z };
};

export const cyclicDistance = (a: number, b: number, total: number): number => {
  const d = Math.abs(a - b);
  return Math.min(d, total - d);
};
