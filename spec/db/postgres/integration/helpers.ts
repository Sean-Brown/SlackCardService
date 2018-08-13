import * as expect from 'expect';

export function fail(message: string) {
    expect(true).toBe(false, message);
}
