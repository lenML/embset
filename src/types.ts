export type Vector = number[] & {};
export type Id = string & {};

export interface Point<T> {
  id: Id;
  value: Vector;
  metadata?: T;
}

export type SearchResult = {
  id: Id;
  metadata?: any;
} & SearchPoint;
export type MaybePromise<T> = T | PromiseLike<T>;
export interface EmbedModel<T = string> {
  embeds(inputs: T[]): Promise<Vector[]>;
}
export type SearchPoint = {
  point: Vector;
  index: number;
  score: number;
};
export interface EmbedDatabase {
  add(point: Vector, index: number): MaybePromise<void>;
  remove_ids(ids: number[]): MaybePromise<void>;
  search(query: Vector, topK: number): MaybePromise<SearchPoint[]>;
  resize(size: number): MaybePromise<void>;
  max_size(): number;
  total(): number;
}
