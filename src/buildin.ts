import {
	BufferPlug,
	fixedSizeLayout,
	dynamicSizeLayout,
} from './layout'

/** fixed size buffer */
export const FixedBufferPlug = (property: string, size: number) => BufferPlug(property, fixedSizeLayout(
	size,
	(v: Buffer, b) => { v.copy(b) },
	(b) => b,
))

/** convertion between buffer and u8 */
export const U8Plug = (property: string) => BufferPlug(property, fixedSizeLayout(
	1,
	(v, b) => {
		if (v > 255) throw new Error(`u8 plug ${property} encode error, value must in [0, 255], but got ${v}`)
		b[0] = v
	},
	(b) => b[0],
));

/** convertion between buffer and string */
export const StringPlug = (property: string) => BufferPlug(property, dynamicSizeLayout(
	(v) => Buffer.from(v),
	(b) => b.toString(),
));