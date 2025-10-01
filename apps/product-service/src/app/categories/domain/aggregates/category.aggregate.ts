type Props = {
  id?: string;
  name: string;
  slug: string;
  image?: string;
  active: boolean;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  children: CategoryAggregate[];
};

export type CategoryCreate = {
  id?: string;
  name: string;
  slug: string;
  image?: string;
  active?: boolean;
  parentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  children?: CategoryAggregate[];
};

export class CategoryAggregate {
  private props: Props;

  private constructor(props: Props) {
    this.props = props;
  }

  // Getters keep API simple for callers (junior-friendly)
  get id(): string | undefined { return this.props.id; }
  get name(): string { return this.props.name; }
  get slug(): string { return this.props.slug; }
  get image(): string | undefined { return this.props.image; }
  get active(): boolean { return this.props.active; }
  get parentId(): string | undefined { return this.props.parentId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get deletedAt(): Date | undefined { return this.props.deletedAt; }
  get children(): ReadonlyArray<CategoryAggregate> { return this.props.children; }

  static create(input: CategoryCreate): CategoryAggregate {
    const name = (input.name ?? '').trim();
    const slug = (input.slug ?? '').trim();
    // validate basic invariants
    CategoryAggregate.assertName(name);
    CategoryAggregate.assertSlug(slug);

    return new CategoryAggregate({
      id: input.id,
      name,
      slug,
      image: input.image,
      active: input.active ?? true,
      parentId: input.parentId,
      createdAt: input.createdAt ?? new Date(),
      updatedAt: input.updatedAt ?? new Date(),
      deletedAt: input.deletedAt,
      children: input.children ?? [],
    });
  }

  updateDetails(props: Partial<Pick<CategoryCreate, 'name' | 'slug' | 'image' | 'active' | 'parentId'>>): void {
    if (props.name !== undefined) {
      const name = props.name.trim();
      CategoryAggregate.assertName(name);
      this.props.name = name;
    }
    if (props.slug !== undefined) {
      const slug = props.slug.trim();
      CategoryAggregate.assertSlug(slug);
      this.props.slug = slug;
    }
    if (props.image !== undefined) this.props.image = props.image;
    if (props.active !== undefined) this.props.active = props.active;
    if (props.parentId !== undefined) this.props.parentId = props.parentId;
    this.touch();
  }

  activate(): void { this.props.active = true; this.touch(); }
  deactivate(): void { this.props.active = false; this.touch(); }

  addChild(child: CategoryAggregate): void {
    if (child.id && this.id && child.id === this.id) throw new Error('Category cannot be its own child');
    this.props.children.push(child);
    this.touch();
  }

  removeChild(childId: string): void {
    this.props.children = this.props.children.filter((c) => c.id !== childId);
    this.touch();
  }

  private touch(): void { this.props.updatedAt = new Date(); }

  private static assertName(name: string): void {
    if (!name) throw new Error('Category name is required');
    if (name.length > 255) throw new Error('Name too long (max 255)');
  }

  private static assertSlug(slug: string): void {
    if (!slug) throw new Error('Category slug is required');
    if (!/^[-a-z0-9]+$/.test(slug)) throw new Error('Slug only allows lowercase, digits, hyphen');
  }

  toPrimitives() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      image: this.image,
      active: this.active,
      parentId: this.parentId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      children: this.children.map((c) => c.toPrimitives()),
    };
  }
}
