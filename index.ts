import camelCase from 'lodash/camelCase';
import endsWith from 'lodash/endsWith';
import first from 'lodash/first';
import flattenDeep from 'lodash/flattenDeep';
import isArray from 'lodash/isArray';
import isDate from 'lodash/isDate';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isMap from 'lodash/isMap';
import isNil from 'lodash/isNil';
import isObject from 'lodash/isObject';
import isSet from 'lodash/isSet';
import kebabCase from 'lodash/kebabCase';
import map from 'lodash/map';
import reduce from 'lodash/reduce';
import set from 'lodash/set';
import size from 'lodash/size';
import slice from 'lodash/slice';
import snakeCase from 'lodash/snakeCase';
import startsWith from 'lodash/startsWith';
import trim from 'lodash/trim';
import trimStart from 'lodash/trimStart';

type QsCase = 'camelCase' | 'snake_case' | 'kebab-case';
type QsOptions = {
	addQueryPrefix?: boolean;
	case?: QsCase;
	omitValues?: any[] | ((value: any, key: string) => boolean);
	prefix?: string;
	restoreCase?: QsCase | false;
};

const SPECIAL_CHARS_REGEX = /[&=#]/;

const needsEncoding = (value: string): boolean => {
	return SPECIAL_CHARS_REGEX.test(value);
};

const isEncoded = (value: string): boolean => {
	try {
		return decodeURIComponent(value) !== value;
	} catch {
		return false;
	}
};

const transformKey = (key: string, options?: QsOptions): string => {
	if (!options?.case) {
		return key;
	}

	// Split on dots to handle nested keys
	const parts = key.split('.');
	const transformedParts = map(parts, part => {
		// Handle array notation separately
		const splitParts = part.split('[');
		const basePart = first(splitParts);
		const arrayParts = slice(splitParts, 1);

		if (basePart) {
			let casePart = basePart;

			if (options.case === 'snake_case') {
				casePart = snakeCase(basePart);
			} else if (options.case === 'camelCase') {
				casePart = camelCase(basePart);
			} else if (options.case === 'kebab-case') {
				casePart = kebabCase(basePart);
			}

			if (size(arrayParts) > 0) {
				return `${casePart}[${arrayParts.join('[')}`;
			}

			return casePart;
		}

		return '';
	});

	return transformedParts.join('.');
};

const reverseTransformKey = (key: string, options?: QsOptions): string => {
	const restoreCase = options?.restoreCase ?? (options?.case ? 'camelCase' : false);

	if (!restoreCase) {
		return key;
	}

	const parts = key.split('.');
	const transformedParts = map(parts, part => {
		const splitParts = part.split('[');
		const basePart = first(splitParts);
		const arrayParts = slice(splitParts, 1);

		if (basePart) {
			let casePart = basePart;

			if (restoreCase === 'camelCase') {
				casePart = camelCase(basePart);
			} else if (restoreCase === 'snake_case') {
				casePart = snakeCase(basePart);
			} else if (restoreCase === 'kebab-case') {
				casePart = kebabCase(basePart);
			}

			if (size(arrayParts) > 0) {
				return `${casePart}[${arrayParts.join('[')}`;
			} else {
				return casePart;
			}
		}
		return '';
	});

	return transformedParts.join('.');
};

const addPrefix = (key: string, options?: QsOptions): string => {
	if (!options?.prefix) {
		return key;
	}
	return `${options.prefix}${key}`;
};

const removePrefix = (key: string, options?: QsOptions): string => {
	if (!options?.prefix) {
		return key;
	}

	return startsWith(key, options.prefix) ? key.slice(size(options.prefix)) : key;
};

const shouldOmitValue = (value: any, key: string, options?: QsOptions): boolean => {
	if (!options?.omitValues) {
		return isNil(value) || value === '' || (isMap(value) && value.size === 0) || (isSet(value) && value.size === 0);
	}

	if (isFunction(options.omitValues)) {
		return options.omitValues(value, key);
	}

	return options.omitValues.includes(value);
};

const parse = (str: string, options?: QsOptions): Record<string, any> => {
	if (isEmpty(str)) {
		return {};
	}

	const cleanStr = trimStart(trim(str, ' '), '?');
	const result = reduce(
		cleanStr.split('&'),
		(reduction: Record<string, any>, param: string) => {
			if (isEmpty(param)) {
				return reduction;
			}

			const parts = param.split('=');
			const key = first(parts);
			const valueParts = slice(parts, 1);

			if (isEmpty(key)) {
				return reduction;
			}

			// Skip if key doesn't match prefix
			if (options?.prefix && !startsWith(key, options.prefix)) {
				return reduction;
			}

			const rawValue = valueParts.join('=');
			const value = isEncoded(rawValue) ? decodeURIComponent(rawValue) : rawValue;

			// Transform the key path for processing
			const transformedKey = reverseTransformKey(removePrefix(key!, options), options);
			const path = map(transformedKey.split('.'), segment => {
				const matches = segment.match(/\[(\d+)\]/g);
				if (matches) {
					return segment.replace(/\[(\d+)\]/g, '.$1').split('.');
				} else {
					return segment;
				}
			});

			const flatPath = flattenDeep(path);
			let parsedValue: any = value;

			try {
				if (startsWith(value, 'map(') && endsWith(value, ')')) {
					parsedValue = new Map(JSON.parse(value.slice(4, -1)));
				} else if (startsWith(value, 'set(') && endsWith(value, ')')) {
					parsedValue = new Set(JSON.parse(value.slice(4, -1)));
				} else {
					parsedValue = JSON.parse(value);
				}
			} catch {
				// Keep original value if not JSON parseable
			}

			return set(reduction, flatPath, parsedValue);
		},
		{}
	);

	return result;
};

const stringify = (obj: Record<string, any>, options?: QsOptions): string => {
	const processValue = (value: any): string => {
		if (isNil(value)) {
			return '';
		}

		let stringValue: string;

		if (isDate(value)) {
			stringValue = value.toISOString();
		} else if (isMap(value)) {
			stringValue = `map(${JSON.stringify([...value])})`;
		} else if (isSet(value)) {
			stringValue = `set(${JSON.stringify([...value])})`;
		} else if (isObject(value) && !isArray(value)) {
			stringValue = JSON.stringify(value);
		} else {
			stringValue = String(value);
		}

		return needsEncoding(stringValue) ? encodeURIComponent(stringValue) : stringValue;
	};

	const buildKeyValuePairs = (input: any, prefix: string = ''): string[] => {
		return reduce(
			input,
			(reduction: string[], value: any, key: string) => {
				const keyPath = prefix ? `${prefix}.${key}` : key;

				if (shouldOmitValue(value, keyPath, options)) {
					return reduction;
				}

				if (isArray(value)) {
					if (isEmpty(value)) {
						return reduction;
					}

					const arrayPairs = map(value, (item, index) => {
						const arrayKey = transformKey(`${keyPath}[${index}]`, options);

						if (isObject(item) && !isDate(item)) {
							return buildKeyValuePairs(item, arrayKey);
						} else {
							return `${addPrefix(arrayKey, options)}=${processValue(item)}`;
						}
					});

					return [...reduction, ...flattenDeep(arrayPairs)];
				}

				if (isObject(value) && !isDate(value) && !isMap(value) && !isSet(value)) {
					if (isEmpty(value)) {
						return reduction;
					}

					return [...reduction, ...buildKeyValuePairs(value, keyPath)];
				}

				const transformedKey = transformKey(keyPath, options);

				return [...reduction, `${addPrefix(transformedKey, options)}=${processValue(value)}`];
			},
			[]
		);
	};

	if (isEmpty(obj)) {
		return '';
	}

	const pairs = buildKeyValuePairs(obj);

	return size(pairs) ? `${(options?.addQueryPrefix ?? true) ? '?' : ''}${pairs.join('&')}` : '';
};

export { QsOptions };
export default {
	parse,
	stringify
};
