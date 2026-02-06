export class Result<T, E = string> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E
  ) {}

  get isSuccess(): boolean {
    return this._isSuccess;
  }

  get isFailure(): boolean {
    return !this._isSuccess;
  }

  get value(): T {
    if (!this._isSuccess) {
      throw new Error('Cannot get value from failed Result');
    }
    return this._value as T;
  }

  get error(): E {
    if (this._isSuccess) {
      throw new Error('Cannot get error from successful Result');
    }
    return this._error as E;
  }

  static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, value);
  }

  static fail<U = never, F = string>(error: F): Result<U, F> {
    return new Result<U, F>(false, undefined, error);
  }
}
