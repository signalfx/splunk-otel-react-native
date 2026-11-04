const { withSplunkRumConfig } = require('./index');

describe('withSplunkRumConfig', () => {
  it('injects one matching identity into runtime code and the source map', async () => {
    const originalSerializer = jest.fn(async (_entry, preModules) => {
      const code =
        preModules.map((module) => module.output[0].data.code).join('\n') +
        '\napp();';
      return {
        code,
        map: JSON.stringify({
          version: 3,
          sources: ['index.ts'],
          mappings: '',
          sourcesContent: [code],
        }),
      };
    });
    const config = withSplunkRumConfig({
      serializer: { customSerializer: originalSerializer },
    });

    const output = await config.serializer.customSerializer(
      'index.js',
      [],
      { transformOptions: { dev: false }, dependencies: new Map() },
      {}
    );
    const sourceMap = JSON.parse(output.map);

    expect(sourceMap.sourceMapId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
    expect(output.code).toContain(
      `__splunkRumSourceMapRegistrations[(new Error).stack]="${sourceMap.sourceMapId}"`
    );
    expect(output.code).toContain(
      `"__splunkRumSourceMapId=${sourceMap.sourceMapId}",{value:true}`
    );
    expect(output.code).toContain(`//# sourceMapId=${sourceMap.sourceMapId}`);
    expect(output.code).not.toContain('00000000-0000-4000-8000-000000000000');
  });

  it('does not alter development serialization', async () => {
    const originalSerializer = jest.fn(() => 'development-code');
    const config = withSplunkRumConfig({
      serializer: { customSerializer: originalSerializer },
    });
    const output = await config.serializer.customSerializer(
      'index.js',
      [],
      { transformOptions: { dev: true }, dependencies: new Map() },
      {}
    );
    expect(output).toBe('development-code');
  });

  it('generates a fresh identity for every production serialization', async () => {
    const originalSerializer = jest.fn(async (_entry, preModules) => {
      const code =
        preModules.map((module) => module.output[0].data.code).join('\n') +
        '\nidenticalAppCode();';
      return {
        code,
        map: JSON.stringify({
          version: 3,
          sources: ['index.ts'],
          mappings: '',
          sourcesContent: [code],
        }),
      };
    });
    const config = withSplunkRumConfig({
      serializer: { customSerializer: originalSerializer },
    });
    const serialize = () =>
      config.serializer.customSerializer(
        'index.js',
        [],
        { transformOptions: { dev: false }, dependencies: new Map() },
        {}
      );

    const first = await serialize();
    const second = await serialize();
    const firstId = JSON.parse(first.map).sourceMapId;
    const secondId = JSON.parse(second.map).sourceMapId;

    expect(firstId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
    expect(secondId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
    expect(secondId).not.toBe(firstId);
    expect(first.code).toContain(`//# sourceMapId=${firstId}`);
    expect(second.code).toContain(`//# sourceMapId=${secondId}`);
  });
});
