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

/** const u8 */
export const ConstU8Plug = (property: string, constV: number) => {
	if (constV > 255) {
		throw new Error(`const u8 plug ${property} error, const value must in [0, 255], but got ${constV}`);
	}
	return BufferPlug(property, fixedSizeLayout(
		1,
		(_v, b) => { b[0] = constV },
		(b) => {
			if (b[0] !== constV) {
				throw new Error(`const u8 plug ${property} decode error, const ${constV} but got ${b[0]}`)
			}
			return b[0];
		}
	));
}

/** convertion between buffer and string */
export const StringPlug = (property: string) => BufferPlug(property, dynamicSizeLayout(
	(v) => Buffer.from(v),
	(b) => b.toString(),
));