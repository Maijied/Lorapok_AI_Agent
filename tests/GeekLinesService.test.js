'use strict';

const { GeekLinesService } = require('../services/GeekLinesService');

describe('GeekLinesService', () => {
    test('catalog has at least 1000 unique lines', () => {
        const svc = new GeekLinesService();
        expect(svc.size()).toBeGreaterThanOrEqual(1000);
        const catalog = svc.getCatalog();
        expect(new Set(catalog).size).toBe(catalog.length);
    });

    test('estimateReadMs respects min/max bounds', () => {
        const svc = new GeekLinesService();
        const short = svc.estimateReadMs('hi');
        const long = svc.estimateReadMs('word '.repeat(80));
        expect(short).toBeGreaterThanOrEqual(2800);
        expect(long).toBeLessThanOrEqual(9000);
        expect(long).toBeGreaterThan(short);
    });

    test('next returns text and readMs', () => {
        const svc = new GeekLinesService();
        const a = svc.next();
        const b = svc.next();
        expect(a.text).toBeTruthy();
        expect(a.readMs).toBeGreaterThanOrEqual(2800);
        expect(b.index).not.toBe(a.index);
    });
});
