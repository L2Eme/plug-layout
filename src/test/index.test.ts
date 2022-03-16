import {
	BufferPlug,
	StructPlug,
	createLayout,
} from '../layout'

import {
	U8Plug,
	ConstU8Plug,
	StringPlug,
} from '../buildin'

describe("create a temp layout", () => {

	let l = createLayout<any>([
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

	// (async () => { })()

	let encoded_buff = l.encode(
		{
			name: 'hello',
			version: 255,
			instruction: 1,
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