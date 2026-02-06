import { Result } from '@ecommerce/common';
import { v4 as uuidv4 } from 'uuid';

export class Product {
  private constructor(
    private _id: string,
    private _name: string,
    private _description: string,
    private _price: number,
    private _stock: number,
    private _sku: string,
    private _category: string,
    private _imageUrls: string[],
    private _active: boolean,
    private _version: number
  ) {}

  static create(props: {
    name: string;
    description: string;
    price: number;
    stock: number;
    sku: string;
    category: string;
    imageUrls?: string[];
  }): Result<Product> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail('Product name is required');
    }
    if (props.price <= 0) {
      return Result.fail('Price must be positive');
    }
    if (props.stock < 0) {
      return Result.fail('Stock cannot be negative');
    }
    if (!props.sku || !Product.isValidSKU(props.sku)) {
      return Result.fail('Invalid SKU format (6-20 alphanumeric uppercase)');
    }
    return Result.ok(
      new Product(
        uuidv4(),
        props.name.trim(),
        props.description ?? '',
        props.price,
        props.stock,
        props.sku.toUpperCase().trim(),
        props.category?.trim() ?? '',
        props.imageUrls ?? [],
        true,
        1
      )
    );
  }

  /** Reconstitute from persistence (DB/cache). No validation. */
  static fromPersistence(
    id: string,
    name: string,
    description: string,
    price: number,
    stock: number,
    sku: string,
    category: string,
    imageUrls: string[],
    active: boolean,
    version: number
  ): Product {
    return new Product(id, name, description, price, stock, sku, category, imageUrls, active, version);
  }

  get id(): string {
    return this._id;
  }
  get name(): string {
    return this._name;
  }
  get description(): string {
    return this._description;
  }
  get price(): number {
    return this._price;
  }
  get stock(): number {
    return this._stock;
  }
  get sku(): string {
    return this._sku;
  }
  get category(): string {
    return this._category;
  }
  get imageUrls(): string[] {
    return this._imageUrls;
  }
  get active(): boolean {
    return this._active;
  }
  get version(): number {
    return this._version;
  }

  reserveStock(quantity: number): Result<void> {
    if (quantity <= 0) {
      return Result.fail('Quantity must be positive');
    }
    if (this._stock < quantity) {
      return Result.fail(
        `Insufficient stock. Available: ${this._stock}, Requested: ${quantity}`
      );
    }
    this._stock -= quantity;
    return Result.ok();
  }

  releaseStock(quantity: number): Result<void> {
    if (quantity <= 0) {
      return Result.fail('Quantity must be positive');
    }
    this._stock += quantity;
    return Result.ok();
  }

  updateInventory(delta: number): void {
    this._stock = Math.max(0, this._stock + delta);
  }

  update(props: Partial<{
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrls: string[];
  }>): void {
    if (props.name !== undefined) this._name = props.name.trim();
    if (props.description !== undefined) this._description = props.description;
    if (props.price !== undefined && props.price > 0) this._price = props.price;
    if (props.category !== undefined) this._category = props.category.trim();
    if (props.imageUrls !== undefined) this._imageUrls = props.imageUrls;
  }

  deactivate(): void {
    this._active = false;
  }

  activate(): void {
    this._active = true;
  }

  /** Increment version for optimistic locking (called by repository on save). */
  incrementVersion(): void {
    this._version += 1;
  }

  private static isValidSKU(sku: string): boolean {
    return /^[A-Z0-9]{6,20}$/i.test(sku.trim());
  }
}
