import { expect, describe, it } from 'vitest';
import qs from './index.js';

describe('/index', () => {
	describe('parse', () => {
		describe('basic parsing', () => {
			it('should parse simple key-value pairs', () => {
				expect(qs.parse('?a=b&c=d')).toEqual({ a: 'b', c: 'd' });
			});

			it('should parse simple key-value pairs without starting ? and ending with ampersand', () => {
				expect(qs.parse('a=b&c=d&')).toEqual({ a: 'b', c: 'd' });
			});

			it('should handle empty values', () => {
				expect(qs.parse('?empty=&null&undefined=')).toEqual({
					empty: '',
					null: '',
					undefined: ''
				});
				// Merged duplicate test
				expect(qs.parse('?empty=&null=&undefined=')).toEqual({
					empty: '',
					null: '',
					undefined: ''
				});
			});

			it('should handle special characters and edge cases', () => {
				expect(qs.parse(`?special=${encodeURIComponent('!@#$%^&*()_+')}`)).toEqual({
					special: '!@#$%^&*()_+'
				});
				expect(qs.parse('?equation=1+1=2')).toEqual({
					equation: '1+1=2'
				});
			});

			it('should parse JSON values', () => {
				expect(qs.parse('?config={"theme":"dark","enabled":true}')).toEqual({
					config: { theme: 'dark', enabled: true }
				});
			});
		});

		describe('nested structures', () => {
			it('should parse nested objects with dot notation', () => {
				expect(qs.parse('?user.name=John&user.address.street=Main')).toEqual({
					user: {
						name: 'John',
						address: {
							street: 'Main'
						}
					}
				});
			});

			it('should parse arrays with indices', () => {
				expect(qs.parse('?arr[0]=1&arr[1]=2')).toEqual({
					arr: [1, 2]
				});
			});

			it('should parse deeply nested structures', () => {
				const input = '?a.b[0].c[0].d.e[0]=value';

				expect(qs.parse(input)).toEqual({
					a: {
						b: [
							{
								c: [
									{
										d: {
											e: ['value']
										}
									}
								]
							}
						]
					}
				});
			});

			it('should parse complex nested arrays and objects', () => {
				const input = '?users[0].name=John&users[0].skills[0]=js&users[0].skills[1]=ts&users[1].name=Jane&users[1].skills[0]=python';

				expect(qs.parse(input)).toEqual({
					users: [
						{ name: 'John', skills: ['js', 'ts'] },
						{ name: 'Jane', skills: ['python'] }
					]
				});
			});

			it('should handle mixed array notations', () => {
				const input = '?filters.price[0].min=10&filters.price[0].max=100&filters.categories=["electronics","books"]';

				expect(qs.parse(input)).toEqual({
					filters: {
						price: [
							{
								min: 10,
								max: 100
							}
						],
						categories: ['electronics', 'books']
					}
				});
			});
		});

		describe('prefix option', () => {
			it('should parse with prefix', () => {
				const options = { prefix: 'api-' };

				expect(qs.parse('?api-name=John&api-age=25', options)).toEqual({
					name: 'John',
					age: 25
				});
			});

			it('should ignore non-prefixed keys when prefix is specified', () => {
				const options = { prefix: 'api-' };

				expect(qs.parse('?api-name=John&other.age=25', options)).toEqual({
					name: 'John'
				});
			});

			it('should handle nested objects with prefix', () => {
				const options = { prefix: 'api-' };

				expect(qs.parse('?api-user.name=John&api-user.details.age=25', options)).toEqual({
					user: {
						name: 'John',
						details: {
							age: 25
						}
					}
				});
			});

			it('should handle arrays with prefix', () => {
				const options = { prefix: 'api-' };

				expect(qs.parse('?api-users[0].name=John&api-users[1].name=Jane', options)).toEqual({
					users: [{ name: 'John' }, { name: 'Jane' }]
				});
			});
		});

		describe('kebab-case', () => {
			it('should parse kebab-case keys to camelCase', () => {
				const options = { case: 'kebab-case' as const };

				expect(qs.parse('?first-name=John&last-name=Doe', options)).toEqual({
					firstName: 'John',
					lastName: 'Doe'
				});
			});

			it('should parse kebab-case keys to camelCase if restoreCase is camelCase', () => {
				const options = {
					case: 'kebab-case' as const,
					restoreCase: 'camelCase' as const
				};

				expect(qs.parse('?first-name=John&last-name=Doe', options)).toEqual({
					firstName: 'John',
					lastName: 'Doe'
				});
			});

			it('should parse kebab-case keys to snake_case if restoreCase is snake_case', () => {
				const options = {
					case: 'kebab-case' as const,
					restoreCase: 'snake_case' as const
				};

				expect(qs.parse('?first-name=John&last-name=Doe', options)).toEqual({
					first_name: 'John',
					last_name: 'Doe'
				});
			});

			it('should keep kebab-case if restoreCase is false', () => {
				const options = {
					case: 'kebab-case' as const,
					restoreCase: false as const
				};

				expect(qs.parse('?first-name=John&last-name=Doe', options)).toEqual({
					['first-name']: 'John',
					['last-name']: 'Doe'
				});
			});

			it('should handle nested kebab-case keys', () => {
				const options = { case: 'kebab-case' as const };

				expect(qs.parse('?user-data.first-name=John&user-data.contact-info.phone-number=123', options)).toEqual({
					userData: {
						firstName: 'John',
						contactInfo: {
							phoneNumber: 123
						}
					}
				});
			});

			it('should handle arrays with kebab-case keys', () => {
				const options = { case: 'kebab-case' as const };

				expect(qs.parse('?user-list[0].first-name=John&user-list[1].first-name=Jane', options)).toEqual({
					userList: [{ firstName: 'John' }, { firstName: 'Jane' }]
				});
			});
		});

		describe('combined prefix and kebab-case options', () => {
			it('should handle both prefix and kebab-case', () => {
				const options = { prefix: 'api-', case: 'kebab-case' as const };

				expect(qs.parse('?api-user-data.first-name=John&api-user-data.last-name=Doe', options)).toEqual({
					userData: {
						firstName: 'John',
						lastName: 'Doe'
					}
				});
			});

			it('should handle complex nested structures with both options', () => {
				const options = { prefix: 'api-', case: 'kebab-case' as const };
				const input = '?api-user-list[0].contact-info.phone-numbers[0]=123&api-user-list[0].contact-info.phone-numbers[1]=456';

				expect(qs.parse(input, options)).toEqual({
					userList: [
						{
							contactInfo: {
								phoneNumbers: [123, 456]
							}
						}
					]
				});
			});
		});

		describe('snake_case', () => {
			it('should parse snake_case keys to camelCase', () => {
				const options = { case: 'snake_case' as const };

				expect(qs.parse('?first_name=John&last_name=Doe', options)).toEqual({
					firstName: 'John',
					lastName: 'Doe'
				});
			});
		});

		describe('Map and Set support', () => {
			it('should parse Map values', () => {
				const input = '?map=map([["key1","value1"],["key2","value2"]])';

				expect(qs.parse(input)).toEqual({
					map: new Map([
						['key1', 'value1'],
						['key2', 'value2']
					])
				});
			});

			it('should parse Set values', () => {
				const input = '?set=set(["value1","value2","value3"])';

				expect(qs.parse(input)).toEqual({
					set: new Set(['value1', 'value2', 'value3'])
				});
			});
		});
	});

	describe('stringify', () => {
		describe('basic stringification', () => {
			it('should stringify simple objects', () => {
				expect(qs.stringify({ a: 'b', c: 'd' })).toEqual('?a=b&c=d');
			});

			it('should stringify simple objects wthout queryPrefix', () => {
				expect(qs.stringify({ a: 'b', c: 'd' }, { addQueryPrefix: false })).toEqual('a=b&c=d');
			});

			it('should handle empty and null values', () => {
				const input = {
					empty: '',
					null: null,
					undefined: undefined,
					emptyArray: [],
					emptyObject: {}
				};
				expect(qs.stringify(input)).toEqual('');
			});

			it('should handle special characters', () => {
				const input = { special: '!@#$%^&*()_+' };
				const result = qs.stringify(input);

				expect(qs.parse(result)).toEqual(input);
			});
		});

		describe('complex structures', () => {
			it('should stringify nested objects with dot notation', () => {
				const input = {
					user: {
						name: 'John',
						address: {
							street: 'Main',
							city: 'NY'
						}
					}
				};
				expect(qs.stringify(input)).toEqual('?user.name=John&user.address.street=Main&user.address.city=NY');
			});

			it('should stringify arrays with proper indices', () => {
				const input = {
					users: [
						{ name: 'John', skills: ['js', 'ts'] },
						{ name: 'Jane', skills: ['python'] }
					]
				};
				expect(qs.stringify(input)).toEqual(
					'?users[0].name=John&users[0].skills[0]=js&users[0].skills[1]=ts&users[1].name=Jane&users[1].skills[0]=python'
				);
			});

			it('should handle extremely deep nesting', () => {
				let deepObj: any = { value: 'deep' };

				for (let i = 0; i < 10; i++) {
					deepObj = { next: deepObj };
				}

				const result = qs.stringify(deepObj);
				expect(result).toContain('next.next.next.next.next.next.next.next.next.next.value=deep');
			});

			it('should handle large arrays', () => {
				const input = {
					array: Array.from({ length: 100 }, (_, i) => ({
						id: i,
						value: `value${i}`
					}))
				};
				const result = qs.stringify(input);

				expect(result).toContain('array[0].id=0');
				expect(result).toContain('array[99].value=value99');
			});
		});

		describe('data integrity', () => {
			it('should maintain data integrity in round trips for simple cases', () => {
				const testCases = [
					{ input: '?a=1&b=2' },
					{ input: '?arr[0]=1&arr[1]=2' },
					{ input: '?obj.a=1&obj.b=2' },
					{ input: '?param=value=with=equals' }
				];

				testCases.forEach(({ input }) => {
					const parsed = qs.parse(input);
					const stringified = qs.stringify(parsed);
					const roundTrip = qs.parse(stringified);

					expect(roundTrip).toEqual(parsed);
				});
			});

			it('should handle complex mixed data types consistently', () => {
				const input = {
					string: 'value',
					number: 123,
					boolean: true,
					date: new Date('2023-01-01'),
					array: [1, 'two', false],
					nested: {
						array: [{ x: 1 }, { x: 2 }],
						object: { a: 1, b: 2 }
					}
				};

				const parsed = qs.parse(qs.stringify(input));

				expect(parsed).toMatchObject({
					...input,
					date: input.date.toISOString()
				});
			});

			it('should maintain consistency with complex nested structures', () => {
				const complexObject = {
					config: {
						theme: {
							colors: ['#fff', '#000'],
							mode: 'dark'
						},
						features: [
							{ id: 1, enabled: true, settings: { timeout: 1000 } },
							{ id: 2, enabled: false, settings: { timeout: 2000 } }
						],
						metadata: {
							created: new Date('2023-01-01').toISOString(),
							tags: ['important', 'critical']
						}
					}
				};

				const roundTrip = qs.parse(qs.stringify(complexObject));

				expect(roundTrip).toMatchObject(complexObject);
			});

			it('should handle special edge cases consistently', () => {
				const input = {
					'key.with.dots': 'value',
					'array[0]': 'direct',
					'nested.array[0].key': 'value',
					mixed: [{ 'key.with.dots': 'value' }],
					'deep.nested[0].array[0].with[0].many[0].brackets': 'value'
				};

				const result = qs.stringify(input);

				expect(qs.parse(result)).toBeDefined();
				expect(() => qs.parse(result)).not.toThrow();
			});
		});

		describe('prefix option', () => {
			it('should stringify with prefix', () => {
				const options = { prefix: 'api-' };
				const input = { name: 'John', age: 25 };
				expect(qs.stringify(input, options)).toEqual('?api-name=John&api-age=25');
			});

			it('should handle nested objects with prefix', () => {
				const options = { prefix: 'api-' };
				const input = {
					user: {
						name: 'John',
						details: { age: 25 }
					}
				};
				expect(qs.stringify(input, options)).toEqual('?api-user.name=John&api-user.details.age=25');
			});

			it('should handle arrays with prefix', () => {
				const options = { prefix: 'api-' };
				const input = {
					users: [{ name: 'John' }, { name: 'Jane' }]
				};

				expect(qs.stringify(input, options)).toEqual('?api-users[0].name=John&api-users[1].name=Jane');
			});
		});

		describe('kebab-case', () => {
			it('should stringify to kebab-case', () => {
				const options = { case: 'kebab-case' as const };
				const input = {
					firstName: 'John',
					lastName: 'Doe'
				};

				expect(qs.stringify(input, options)).toEqual('?first-name=John&last-name=Doe');
			});

			it('should handle nested objects with kebab-case', () => {
				const options = { case: 'kebab-case' as const };
				const input = {
					userData: {
						firstName: 'John',
						contactInfo: {
							phoneNumber: '123'
						}
					}
				};

				expect(qs.stringify(input, options)).toEqual('?user-data.first-name=John&user-data.contact-info.phone-number=123');
			});

			it('should handle arrays with kebab-case', () => {
				const options = { case: 'kebab-case' as const };
				const input = {
					userList: [{ firstName: 'John' }, { firstName: 'Jane' }]
				};

				expect(qs.stringify(input, options)).toEqual('?user-list[0].first-name=John&user-list[1].first-name=Jane');
			});
		});

		describe('combined prefix and kebab-case options', () => {
			it('should handle both prefix and kebab-case', () => {
				const options = { prefix: 'api-', case: 'kebab-case' as const };
				const input = {
					userData: {
						firstName: 'John',
						lastName: 'Doe'
					}
				};

				expect(qs.stringify(input, options)).toEqual('?api-user-data.first-name=John&api-user-data.last-name=Doe');
			});

			it('should handle complex nested structures with both options', () => {
				const options = { prefix: 'api-', case: 'kebab-case' as const };
				const input = {
					userList: [
						{
							contactInfo: {
								phoneNumbers: ['123', '456']
							}
						}
					]
				};

				expect(qs.stringify(input, options)).toEqual(
					'?api-user-list[0].contact-info.phone-numbers[0]=123&api-user-list[0].contact-info.phone-numbers[1]=456'
				);
			});

			it('should maintain data integrity in round trips with both options', () => {
				const options = { prefix: 'api-', case: 'kebab-case' as const };
				const input = {
					userData: {
						firstName: 'John',
						contactInfo: {
							phoneNumbers: [123, 456],
							primaryEmail: 'john@example.com'
						}
					}
				};
				const stringified = qs.stringify(input, options);
				const parsed = qs.parse(stringified, options);

				expect(parsed).toEqual(input);
			});
		});

		describe('snake_case', () => {
			it('should stringify to snake_case', () => {
				const options = { case: 'snake_case' as const };
				const input = {
					firstName: 'John',
					lastName: 'Doe'
				};

				expect(qs.stringify(input, options)).toEqual('?first_name=John&last_name=Doe');
			});
		});

		describe('omitValues option', () => {
			it('should omit default values (null, undefined, empty string)', () => {
				const input = {
					active: true,
					age: null,
					email: undefined,
					name: 'John',
					phone: ''
				};

				expect(qs.stringify(input)).toEqual('?active=true&name=John');
			});

			it('should omit values using custom function', () => {
				const input = {
					active: true,
					age: null,
					email: undefined,
					name: 'John',
					phone: ''
				};

				const options = {
					omitValues: (value: any, key: string) => {
						if (key.includes('name')) {
							return true;
						}

						return false;
					}
				};

				expect(qs.stringify(input, options)).toEqual('?active=true&age=&email=&phone=');
			});

			it('should handle combined options with omitValues', () => {
				const input = {
					active: true,
					age: null,
					email: undefined,
					name: 'John',
					phone: ''
				};

				const options = {
					prefix: 'api-',
					kebabCase: true,
					omitValues: ['John', null, undefined, '']
				};

				expect(qs.stringify(input, options)).toEqual('?api-active=true');
			});
		});

		describe('Map and Set support', () => {
			it('should stringify Map values', () => {
				expect(
					qs.stringify({
						map: new Map([
							['key1', 'value1'],
							['key2', 'value2']
						]),
						map1: new Map()
					})
				).toEqual('?map=map([["key1","value1"],["key2","value2"]])');
			});

			it('should stringify Set values', () => {
				expect(
					qs.stringify({
						set: new Set(['value1', 'value2', 'value3']),
						set1: new Set()
					})
				).toEqual('?set=set(["value1","value2","value3"])');
			});
		});
	});
});
