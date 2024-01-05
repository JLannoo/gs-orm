type GSORMModelField = StringConstructor | NumberConstructor | BooleanConstructor | DateConstructor | ArrayConstructor | ObjectConstructor;

type GSORMModelFields<T> = {
	[K in keyof T]: GSORMModelField;
}

export class GSORMModel<T> {
	name: string;
	schema: GSORMModelFields<T>;

	constructor(name: string, schema: GSORMModelFields<T>) {
		this.name = name;
		this.schema = schema;
	}
}