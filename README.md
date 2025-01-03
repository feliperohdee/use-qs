# use-qs

A TypeScript library that provides a powerful and flexible query string parsing and stringification solution, with support for nested objects, arrays, Maps, Sets, and custom transformations.

[![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/-Vitest-729B1B?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🚀 Features

- ✅ Type-safe parsing and stringification of query strings
- 🔄 Support for nested objects and arrays
- 📦 Built-in Map and Set serialization
- 🎯 Custom value transformations
- 🔒 Prefix filtering for namespaced parameters
- 🎨 Automatic kebab-case conversion
- 🧹 Configurable value omission
- 🔍 Handles special characters and edge cases
- 🎭 Maintains data integrity in round trips

## 📦 Installation

```bash
yarn add use-qs
```

## 🛠️ Usage

### Basic Usage

```typescript
import qs from 'use-qs';

// Parse query string
const parsed = qs.parse('?name=John&age=25');
// Result: { name: 'John', age: 25 }

// Stringify object
const stringified = qs.stringify({ name: 'John', age: 25 });
// Result: '?name=John&age=25'
```

### Nested Objects and Arrays

```typescript
// Parsing nested structures
const parsed = qs.parse('?user.name=John&user.skills[0]=js&user.skills[1]=ts');
// Result: { user: { name: 'John', skills: ['js', 'ts'] } }

// Stringifying nested structures
const stringified = qs.stringify({
	user: {
		name: 'John',
		skills: ['js', 'ts']
	}
});
// Result: '?user.name=John&user.skills[0]=js&user.skills[1]=ts'
```

### Map and Set Support

```typescript
// Parsing Map and Set
const parsed = qs.parse('?map=map([["key1","value1"]])&set=set(["value1","value2"])');
// Result: {
//   map: new Map([['key1', 'value1']]),
//   set: new Set(['value1', 'value2'])
// }

// Stringifying Map and Set
const stringified = qs.stringify({
	map: new Map([['key1', 'value1']]),
	set: new Set(['value1', 'value2'])
});
// Result: '?map=map([["key1","value1"]])&set=set(["value1","value2"])'
```

### Advanced Options

#### Prefix Option

```typescript
const options = { prefix: 'api-' };

// Parsing with prefix
const parsed = qs.parse('?api-name=John&api-age=25', options);
// Result: { name: 'John', age: 25 }

// Stringifying with prefix
const stringified = qs.stringify({ name: 'John', age: 25 }, options);
// Result: '?api-name=John&api-age=25'
```

#### Kebab Case Option

```typescript
const options = { kebabCase: true };

// Parsing kebab-case
const parsed = qs.parse('?first-name=John&last-name=Doe', options);
// Result: { firstName: 'John', lastName: 'Doe' }

// Stringifying to kebab-case
const stringified = qs.stringify({ firstName: 'John', lastName: 'Doe' }, options);
// Result: '?first-name=John&last-name=Doe'
```

#### Omit Values Option

```typescript
const options = {
  omitValues: ['', null, undefined] // Array of values to omit
  // OR
  omitValues: (value, key) => value === '' // Function to determine omission
};

const stringified = qs.stringify({
  name: 'John',
  age: null,
  email: ''
}, options);
// Result: '?name=John'
```

### Configuration Options

```typescript
type QsOptions = {
	addQueryPrefix?: boolean; // Add '?' prefix to stringified result
	kebabCase?: boolean; // Convert between camelCase and kebab-case
	omitValues?: any[] | ((value: any, key: string) => boolean); // Values to omit
	prefix?: string; // Prefix for keys
};
```

## 🧪 Testing

```bash
# Run tests
yarn test
```

## 📝 Notes

- The library automatically handles URL encoding/decoding
- Supports deep nesting of objects and arrays
- Maintains type safety with TypeScript
- Preserves data integrity in parse/stringify round trips
- Handles special characters and edge cases gracefully

## 📝 License

MIT © [Felipe Rohde](mailto:feliperohdee@gmail.com)

## ⭐ Show your support

Give a ⭐️ if this project helped you!

## 👨‍💻 Author

**Felipe Rohde**

- Twitter: [@felipe_rohde](https://twitter.com/felipe_rohde)
- Github: [@feliperohdee](https://github.com/feliperohdee)
- Email: feliperohdee@gmail.com
