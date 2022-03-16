import * as plug from '@line100/plug';

function assert(value: any, message: string) {
	if (!value) {
		throw new Error(message)
	}
}

// 使用layout的问题，必须在创建layout的时候，明确有多少个字节，否则无法使用blob装填

export type LayoutAction = {
	readonly type: 'decode',
	readonly payload: Buffer,
} | {
	readonly type: 'encode',
	readonly payload: {[i: string]: any},
}

export type LayoutPlug = plug.TPlug<LayoutContext>

export class LayoutContext {

	retBuffs: Buffer[] = [];
	index: number = 0;

	retStack: {[i: string]: any}[] = [{}];

	addBuffer(b: Buffer) {
		this.retBuffs.push(b);
	}

	addProperty(name: string, v: any) {
		this.retStack[0][name] = v;
	}

	startStruct(name: string) {
		let parentObj = this.retStack[0];
		if (parentObj[name]) {
			throw new Error('startStruct error, duplicated property in parent.');
		}
		let newObj = {};
		parentObj[name] = newObj;
		this.retStack.unshift(newObj);
	}

	endStruct() {
		if (this.retStack.length < 2) {
			throw new Error('endStruct error, stack must greater than 2.')
		}
		this.retStack.shift();
	}

}

export type TBufferPlugLayout = {
	encode(v: any): Buffer,
	decode(b: Buffer): { v: any, offset: number },
}

export function fixedSizeLayout<T = any>(
	fixedSize: number,
	encode: (v: T, fixedBuffer: Buffer) => void,
	decode: (b: Buffer) => T,
): TBufferPlugLayout {
	return {
		encode(v) {
			let fixedBuffer = Buffer.alloc(fixedSize);
			encode(v, fixedBuffer);
			return fixedBuffer;
		},
		decode(b) {
			return { v: decode(b.slice(0, fixedSize)), offset: fixedSize }
		},
	}
}

export function dynamicSizeLayout<T = any>(
	encode: (v: T) => Buffer,
	decode: (b: Buffer) => T,
): TBufferPlugLayout {
	return {
		encode(v) {
			let b = encode(v);
			let buff = Buffer.allocUnsafe(4 + b.length);
			let offset = buff.writeUInt32LE(b.length);
			b.copy(buff, offset);
			return buff;
		},
		decode(b) {
			let len = b.readUInt32LE();
			let offset = 4 + len;
			let buff = b.slice(4, offset);
			return { v: decode(buff), offset };
		},
	}
}

/** default is dynamic buffer layout */
const defaultOption = dynamicSizeLayout(
	b => b === undefined ? Buffer.alloc(0) : b,
	b => b.length === 0 ? undefined : b,
)

/** create a buffer plug with a name */
export const BufferPlug = function (
	property: string,
	opts: TBufferPlugLayout = defaultOption,
): LayoutPlug {
	let decode = opts.decode;

	return function (handler) {
		return (action: LayoutAction) => {

			if (action.type === 'encode') {
				let encoded = opts.encode(action.payload[property])
				assert(Buffer.isBuffer(encoded), 'encoded is buffer');
				this.addBuffer(encoded);
			}
			else { // decode
				assert(this.index < action.payload.length, 'decode out of payload length');
				let { v, offset } = decode(action.payload.slice(this.index));
				this.index += offset;
				this.addProperty(property, v);
			}

			// move to next
			// return the result chain to root
			return handler(action);
		}
	}
}

export const StructPlug = function (property: string, subPlugs: LayoutPlug[]): LayoutPlug {

	let subPlug = plug.combinePlugs(...subPlugs);

	return function (handler) {
		return (action: LayoutAction) => {

			let subHandler = subPlug.bind(this)((v) => v);

			if (action.type === 'encode') {
				let obj = action.payload[property];
				if (typeof obj === 'object') {
					subHandler({ 'type': 'encode', payload: obj })
				}
			}
			else {
				this.startStruct(property)
				subHandler(action);
				this.endStruct()
			}

			return handler(action);
		}
	}
}

export function CreateLayoutHandler (plugs: LayoutPlug[]): plug.THandler {

	let p: LayoutPlug = function(_handler) {
		return plug.createHandler(this, plugs, (a: LayoutAction) => {
			if (a.type === 'encode') {
				return Buffer.concat(this.retBuffs);
			}
			else {
				return this.retStack[0];
			}
		})
	}

	return (action: LayoutAction) => {
		let context = new LayoutContext();
		return p.bind(context)(null as any)(action);
	}
}

/** wrap handler with {encode, decode} */
export function createLayout<T>(plugs: LayoutPlug[]) {

	let handler = CreateLayoutHandler(plugs)

	return {
		encode(v: T): Buffer {
			return handler({ type: 'encode', payload: v })
		},
		decode(b: Buffer): T {
			return handler({ type: 'decode', payload: b })
		},
	}
}