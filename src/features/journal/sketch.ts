/** A freehand sketch stored alongside a page: a list of colored strokes. */

export interface SketchPoint {
  x: number;
  y: number;
}

export interface SketchStroke {
  color: string;
  points: SketchPoint[];
}

export function parseSketch(raw?: string | null): SketchStroke[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((stroke: any) => stroke && Array.isArray(stroke.points) && stroke.points.length > 0)
      .map((stroke: any) => ({
        color: typeof stroke.color === 'string' ? stroke.color : '#2C4F45',
        points: stroke.points
          .filter((p: any) => Number.isFinite(p?.x) && Number.isFinite(p?.y))
          .map((p: any) => ({ x: Number(p.x), y: Number(p.y) })),
      }))
      .filter((stroke) => stroke.points.length > 0);
  } catch {
    return [];
  }
}

export function serializeSketch(strokes: SketchStroke[]): string {
  const usable = strokes.filter((stroke) => stroke.points.length > 0);
  return usable.length > 0 ? JSON.stringify(usable) : '';
}

/** Smooth line through the sampled points. */
export function sketchPath(points: SketchPoint[]): string {
  if (points.length < 2) return '';
  let d = `M${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    d += ` Q${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`;
  }
  const last = points[points.length - 1];
  d += ` L${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
}
