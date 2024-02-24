import { tracked } from '@glimmer/tracking';
import { assert } from '@ember/debug';
import Service, { service } from '@ember/service';

import type ApiDocs from './api-docs';
import type Selected from './selected';
import type { Manifest } from './types';
import type RouterService from '@ember/routing/router-service';

const DEFAULT_MANIFEST = '/docs/manifest.json';
const DEFAULT_API_DOCS = '/api-docs.json';

export type SetupOptions = Parameters<DocsService['setup']>[0];

export default class DocsService extends Service {
  @service declare router: RouterService;
  @service('kolay/selected') declare selected: Selected;
  @service('kolay/api-docs') declare apiDocs: ApiDocs;

  @tracked manifestLocation = DEFAULT_MANIFEST;
  @tracked apiDocsLocation = DEFAULT_API_DOCS;
  @tracked additionalResolves?: Record<string, Record<string, unknown>>;
  @tracked additionalTopLevelScope?: Record<string, unknown>;
  @tracked remarkPlugins?: unknown[];
  _docs: Manifest | undefined;

  loadManifest: () => Promise<Manifest> = () =>
    Promise.resolve({
      list: [],
      tree: {},
    } as any);

  setup = async (options: {
    /**
     * The module of the manifest virtual module.
     * This should be set to `await import('kolay/manifest:virtual')
     */
    manifest?: any;

    /**
     * The module of the api docs virtual module.
     * This should be set to `await import('kolay/api-docs:virtual')
     */
    apiDocs?: any;

    /**
     * Additional invokables that you'd like to have access to
     * in the markdown, without a codefence.
     *
     * By default, the fallowing is available:
     * - for escaping styles / having a clean style-sandbox
     *   - <Shadowed>
     * - for rendering your typedoc:
     *   - <APIDocs>
     *   - <ComponentSignature>
     */
    topLevelScope?: Record<string, unknown>;

    /**
     * Additional modules you'd like to be able to import from.
     * This is in addition the the default modules provided by ember,
     * and allows you to have access to private libraries without
     * needing to publish those libraries to NPM.
     */
    resolve?: Record<string, Record<string, unknown>>;

    /**
     * Provide additional remark plugins to the default markdown compiler.
     *
     * These can be used to add fetaures like notes, callouts, footnotes, etc
     */
    remarkPlugins?: unknown[];
  }) => {
    if (options.manifest) {
      this.loadManifest = options.manifest.load;
    }

    if (options.apiDocs) {
      this.apiDocs.packages = options.apiDocs.packages;
      this.apiDocs.loadApiDocs = options.apiDocs.loadApiDocs;
    }

    if (options.resolve) {
      this.additionalResolves = options.resolve;
    }

    if (options.topLevelScope) {
      this.additionalTopLevelScope = options.topLevelScope;
    }

    this._docs = await this.loadManifest();
  };

  get docs() {
    assert(
      `Docs' manifest was not loaded. Be sure to call setup() before accessing anything on the docs service.`,
      this._docs,
    );

    return this._docs;
  }

  get manifest() {
    return this.docs;
  }

  /**
   * The flat list of all pages.
   * Each page knows the name of its immediate parent.
   */
  get pages() {
    return this.docs?.list ?? [];
  }

  /**
   * The full page hierachy
   */
  get tree() {
    return this.docs?.tree ?? {};
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  interface Registry {
    'kolay/docs': DocsService;
  }
}