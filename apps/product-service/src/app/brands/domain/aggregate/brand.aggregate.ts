import { CategoryCreate } from "../../../categories";

type Props = {
    id?: string;
    name: string;
    active: boolean;
    deletedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export type BrandCreate = {
    id?: string;
    name: string;
    active?: boolean;
    deletedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export class BrandAggregate {
    private props: Props;

    private constructor(props: Props) {
        this.props = props;
    }

    get id(): string | undefined {
        return this.props.id;
    }
    get name(): string {
        return this.props.name;
    }
    get active(): boolean {
        return this.props.active;
    }
    get deletedAt(): Date | undefined {
        return this.props.deletedAt;
    }
    static create(input: BrandCreate): BrandAggregate {
        const name = ( input.name ?? '' ).toString().trim();

        BrandAggregate.assertName(name);

        return new BrandAggregate({
            id: input.id,
            name,
            active: input.active ?? true,
            deletedAt: input.deletedAt,
            createdAt: input.createdAt ?? new Date(),
            updatedAt: input.updatedAt ?? new Date(),
        });
    }
    update(props: Partial<Pick<CategoryCreate, 'name' | 'active'>>): void {
        if(props.name !== undefined) {
            const name = props.name.toString().trim();
            BrandAggregate.assertName(name);
            this.props.name = name;
        }
        if(props.active !== undefined) {
            this.props.active = props.active;
        }
        this.touch();
    }
    activate(): void {
        this.props.active = true;
        this.touch();
    }
    deactivate(): void {
        this.props.active = false;
        this.touch();
    }
    private touch(): void {
     this.props.updatedAt = new Date();
    }
    private static assertName(name: string): void {
        if(name.length === 0) {
            throw new Error('Brand name cannot be empty');
        }
        if(name.length > 255) {
            throw new Error('Brand name cannot exceed 255 characters');
        }
    }

    toPrimitives() {
        return { ...this.props };
    }
}