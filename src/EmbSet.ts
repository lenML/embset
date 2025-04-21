import Debug from "debug";
const log = Debug("embset");

import {
  EmbedDatabase,
  Vector,
  EmbedModel,
  Point,
  SearchResult,
} from "./types";

export class EmbSet<Input = string, Metadata = any> {
  private points = new Map<string, Point<Metadata>>();
  private db: EmbedDatabase;
  private model: EmbedModel<Input>;
  private max_size: number;
  private cursor = 0;

  constructor({
    db,
    model,
    max_size = 256,
  }: {
    db: EmbedDatabase;
    model: EmbedModel<Input>;
    max_size?: number;
  }) {
    this.db = db;
    this.model = model;
    this.max_size = max_size;
  }

  /**
   * Find all points in the set that satisfy the given function
   * @param {function(Point<Metadata>): boolean} fn - the function to test
   * @returns {Point[]} all points in the set that pass the test
   */
  public _find(fn: (item: Point<Metadata>) => boolean) {
    return Array.from(this.points.values()).filter(fn);
  }

  /**
   * Resize the internal database to the given size
   * @param {number} max_size
   */
  public resize(max_size: number) {
    log(`resizing to ${max_size}`);
    this.max_size = max_size;
    this.db.resize(this.max_size);
  }

  /**
   * Add a new point to the set
   * @param {Vector} value - the vector to add
   * @param {any} [metadata] - any additional metadata to store
   * @returns {Promise<Point>} the added point
   */
  async add_emb(value: Vector, metadata: any = null) {
    const id = this.cursor;
    this.cursor += 1;
    const point = {
      id: id.toString(),
      value,
      metadata,
    };
    this.points.set(id.toString(), point);
    // auto resize
    if (this.points.size >= this.max_size) {
      this.resize(this.max_size * 2);
    }
    await this.db.add(value, id);
    return point as Point<Metadata>;
  }

  /**
   * Add a new item to the index
   * @param {any} metadata - an optional metadata object
   * @returns {Promise<Point>} - the newly added point
   */

  async add(input: Input, metadata: any = null) {
    const [vector] = await this.model.embeds([input]);
    return this.add_emb(vector, metadata);
  }

  async adds(inputs: { value: Input; metadata?: any }[]) {
    const vectors = await this.model.embeds(inputs.map((i) => i.value));
    for (let i = 0; i < inputs.length; i++) {
      this.add_emb(vectors[i], inputs[i].metadata);
    }
  }

  /**
   * Search the index for the nearest neighbors to a given query
   * @param {Input} query - the query vector
   * @param {number} [topK] - the number of neighbors to return
   * @returns {Promise<SearchResult[]>} - the search results
   */
  async search(query: Input, topK = 10) {
    const [vector] = await this.model.embeds([query]);
    return this.search_embed(vector);
  }

  async search_embed(vector: Vector, topK = 10) {
    const neighbors = await this.db.search(vector, topK);
    const results = neighbors.map((n) => {
      const point = this.points.get(n.index.toString());
      return { ...n, ...point } as SearchResult;
    });
    return results;
  }

  /**
   * Remove points from the set and the database by their IDs
   * @param {(string | number)[]} ids - the IDs of the points to remove
   * @returns {Promise<void>} - resolves when the points are removed
   */

  async remove_ids(ids: (string | number)[]) {
    await this.db.remove_ids(ids.map(Number));
    for (const id of ids) {
      this.points.delete(id.toString());
    }
  }
}
