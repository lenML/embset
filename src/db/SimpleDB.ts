import { Vector, SearchPoint, EmbedDatabase, MaybePromise } from "../types";

function cosine(a: Vector, b: Vector): number {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const normB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  return dot / (normA * normB + 1e-8);
}

export class SimpleDB implements EmbedDatabase {
  private points: (Vector | undefined)[] = [];

  add(point: Vector, index: number): MaybePromise<void> {
    this.points[index] = point;
  }

  remove_ids(ids: number[]): MaybePromise<void> {
    for (const id of ids) {
      if (id >= 0 && id < this.points.length) {
        this.points[id] = undefined;
      }
    }
  }

  search(query: Vector, topK: number): MaybePromise<SearchPoint[]> {
    const results: SearchPoint[] = [];
    for (let i = 0; i < this.points.length; i++) {
      const point = this.points[i];
      if (!point) continue;
      results.push({
        index: i,
        point,
        score: cosine(query, point),
      });
    }
    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  resize(size: number): MaybePromise<void> {
    // pass
  }

  max_size(): number {
    return Infinity;
  }

  total() {
    return this.points.length;
  }
}
