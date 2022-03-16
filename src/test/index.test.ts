import {
	BufferPlug,
	StructPlug,
	fixedSizeLayout,
	createLayout,
} from '../layout'

let U8Plug = (property: string) => BufferPlug(property, fixedSizeLayout(
	1,
	(v, b) => b[0] = v,
	(b) => b[0],
))

describe("create a temp layout", () => {

	let l = createLayout([
		BufferPlug('name'),
		U8Plug('version'),
		StructPlug('phone', [
			U8Plug('type'),
			BufferPlug('number'),
		]),
		StructPlug('address', [
			U8Plug('type'),
			BufferPlug('number'),
		]),
	])

	// (async () => { })()

	let encoded_buff = l.encode(
		{
			name: Buffer.from([0, 1, 2, 3]),
			version: 255,
			phone: {
				type: 3,
				number: Buffer.from([2, 3, 3]),
			},
			address: {
				type: 4,
				number: Buffer.from([2, 3, 3]),
			}
		},
	)

	// console.log(encoded_buff)

	let decoded_obj = l.decode(
		encoded_buff,
	)
	// console.log(decoded_obj);

	let encoded_buff1 = l.encode(decoded_obj)

	test('decode then encode', () => {
		expect(encoded_buff).toEqual(encoded_buff1);
	})

})