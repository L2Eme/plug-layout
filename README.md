# plug-layout

## Usage

```ts
type TData = {
	name: string,
	version: number,
	instruction: 1,
	phone: {
		type: number,
		number: Buffer,
	},
	address: {
		type: number,
		number: Buffer,
	}
}

let layout = createLayout<TData>([
	StringPlug('name'),
	U8Plug('version'),
	ConstU8Plug('instruction', 1),
	StructPlug('phone', [
		U8Plug('type'),
		BufferPlug('number'),
	]),
	StructPlug('address', [
		U8Plug('type'),
		BufferPlug('number'),
	]),
])
```