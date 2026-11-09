const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

async function loadLinkingModule() {
  const core = await import('@react-navigation/core');
  const filename = path.resolve(__dirname, '../src/routing/linking.ts');
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
    fileName: filename,
  }).outputText;

  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = module.paths;

  const mockConstants = {
    expoConfig: {
      experiments: { baseUrl: '/calmly' },
    },
  };
  mockConstants.default = mockConstants;

  loaded.require = (id) => {
    if (id === 'expo-linking') {
      return {
        createURL: (p) => `calmly://${p ? p.replace(/^\//, '') : ''}`,
      };
    }
    if (id === 'react-native') {
      return { Platform: { OS: 'web' } };
    }
    if (id === 'expo-constants') {
      return mockConstants;
    }
    if (id === '@react-navigation/core' || id === '@react-navigation/native') {
      return core;
    }
    return require(id);
  };

  global.window = {
    location: {
      origin: 'https://shubhchan.github.io',
      pathname: '/calmly/calm',
    },
  };

  loaded._compile(code, filename);
  return { ...loaded.exports, validatePathConfig: core.validatePathConfig };
}

test('getWebBasePath extracts baseUrl without extra slashes', async () => {
  const { getWebBasePath } = await loadLinkingModule();
  const base = getWebBasePath();
  assert.equal(base, 'calmly');
});

test('linking configuration passes React Navigation path validation', async () => {
  const { linking, validatePathConfig } = await loadLinkingModule();
  assert.doesNotThrow(() => {
    validatePathConfig(linking.config);
  });
});

test('root domain routing parses tabs and modal screens correctly', async () => {
  const { linking } = await loadLinkingModule();
  const options = { ...linking.config, path: '' };

  const home = linking.getStateFromPath('/', options);
  assert.equal(home?.routes?.[0]?.name, 'App');
  assert.equal(home?.routes?.[0]?.state?.routes?.[0]?.name, 'Home');

  const calm = linking.getStateFromPath('/calm', options);
  assert.equal(calm?.routes?.[0]?.name, 'App');
  assert.equal(calm?.routes?.[0]?.state?.routes?.[0]?.name, 'Calm');

  const journal = linking.getStateFromPath('/journal', options);
  assert.equal(journal?.routes?.[0]?.name, 'App');
  assert.equal(journal?.routes?.[0]?.state?.routes?.[0]?.name, 'Journal');

  const playground = linking.getStateFromPath('/calm/playground', options);
  assert.equal(playground?.routes?.[0]?.name, 'ZenPlayground');

  const entry = linking.getStateFromPath('/journal/entry/test-note', options);
  assert.equal(entry?.routes?.[0]?.name, 'JournalEntry');
  assert.equal(entry?.routes?.[0]?.params?.id, 'test-note');

  const habit = linking.getStateFromPath('/habits/h-42', options);
  assert.equal(habit?.routes?.[0]?.name, 'HabitDetail');
  assert.equal(habit?.routes?.[0]?.params?.id, 'h-42');
});

test('subpath base URL (/calmly) parses GitHub Pages URLs correctly', async () => {
  const { linking } = await loadLinkingModule();
  const options = { ...linking.config, path: 'calmly' };

  const baseExact = linking.getStateFromPath('/calmly', options);
  assert.equal(baseExact?.routes?.[0]?.name, 'App');
  assert.equal(baseExact?.routes?.[0]?.state?.routes?.[0]?.name, 'Home');

  const baseTrailing = linking.getStateFromPath('/calmly/', options);
  assert.equal(baseTrailing?.routes?.[0]?.name, 'App');
  assert.equal(baseTrailing?.routes?.[0]?.state?.routes?.[0]?.name, 'Home');

  const calm = linking.getStateFromPath('/calmly/calm', options);
  assert.equal(calm?.routes?.[0]?.name, 'App');
  assert.equal(calm?.routes?.[0]?.state?.routes?.[0]?.name, 'Calm');

  const playground = linking.getStateFromPath('/calmly/calm/playground', options);
  assert.equal(playground?.routes?.[0]?.name, 'ZenPlayground');

  const entry = linking.getStateFromPath('/calmly/journal/entry/note-99', options);
  assert.equal(entry?.routes?.[0]?.name, 'JournalEntry');
  assert.equal(entry?.routes?.[0]?.params?.id, 'note-99');
});

test('getPathFromState correctly preserves base path on web', async () => {
  const { linking } = await loadLinkingModule();

  const stateHome = {
    routes: [
      {
        name: 'App',
        state: {
          routes: [{ name: 'Home', state: { routes: [{ name: 'HomeMain' }] } }],
          index: 0,
        },
      },
    ],
    index: 0,
  };

  const stateCalm = {
    routes: [
      {
        name: 'App',
        state: {
          routes: [{ name: 'Calm', state: { routes: [{ name: 'CalmMain' }] } }],
          index: 0,
        },
      },
    ],
    index: 0,
  };

  const statePlayground = {
    routes: [{ name: 'ZenPlayground' }],
    index: 0,
  };

  // With base path 'calmly'
  const baseOptions = { ...linking.config, path: 'calmly' };
  assert.equal(linking.getPathFromState(stateHome, baseOptions), '/calmly');
  assert.equal(linking.getPathFromState(stateCalm, baseOptions), '/calmly/calm');
  assert.equal(linking.getPathFromState(statePlayground, baseOptions), '/calmly/calm/playground');

  // Without base path (root domain)
  const rootOptions = { ...linking.config, path: '' };
  assert.equal(linking.getPathFromState(stateHome, rootOptions), '/');
  assert.equal(linking.getPathFromState(stateCalm, rootOptions), '/calm');
  assert.equal(linking.getPathFromState(statePlayground, rootOptions), '/calm/playground');
});
