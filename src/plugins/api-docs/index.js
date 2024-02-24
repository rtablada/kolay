import { stripIndent } from 'common-tags';
import { createUnplugin } from 'unplugin';

import { generateTypeDocJSON } from './typedoc.js';

const SECRET_INTERNAL_IMPORT = 'kolay/api-docs:virtual';

/**
 * Generates JSON from typedoc given a target path.
 *
 * May be used multiple times to generate multiple docs
 * for multiple libraries
 *
 * example:
 * ```js
 * import { typedoc, helpers } from 'kolay';
 *
 * typedoc.webpack({
 *   dest: '/api-docs/ember-primitives.json
 *   entryPoints: [
 *     helpers.pkgGlob(
 *       require.resolve('ember-primitives'),
 *        'declarations'
 *      )
 *   ]
 * })
 * ```
 */
export const apiDocs = createUnplugin(
  /**
   * @param {import('./types.ts').APIDocsOptions} options
   */
  (options) => {
    const name = 'kolay-api-docs';

    /**
     * @param {string} pkgName
     */
    function getDest(pkgName) {
      return `${options.dest ?? 'docs'}/${pkgName}.json`;
    }

    return {
      name,
      /**
       * 1. generate typedoc config
       * 2. given the
       */
      async buildEnd() {
        await Promise.all(
          options.packages.map(async (pkgName) => {
            let data = await generateTypeDocJSON({ packageName: pkgName });

            if (data) {
              let dest = getDest(pkgName);

              this.emitFile({
                type: 'asset',
                fileName: dest,
                source: JSON.stringify(data),
              });
            }
          })
        );
      },
      /**
       * RUNTIME Support / virtual module
       *
       * The virtual file that this generates is used by the API Docs service
       * and it manages the loading / loaded state for each potential api docs document.
       */
      resolveId(id) {
        if (id === SECRET_INTERNAL_IMPORT) {
          return {
            id: `\0${id}`,
          };
        }

        return;
      },
      loadInclude(id) {
        if (!id.startsWith('\0')) return false;

        return id.slice(1) === SECRET_INTERNAL_IMPORT;
      },
      load(id) {
        if (!id.startsWith('\0')) return;

        if (id.slice(1) !== SECRET_INTERNAL_IMPORT) return;

        let content = stripIndent`
          export const packageNames = [
            ${options.packages.map((raw) => `'${raw}',`).join('\n  ')}
          ];

          export const loadApiDocs = {
            ${options.packages
              .map((name) => {
                return `'${name}': () => fetch('/${getDest(name)}'),`;
              })
              .join('\n  ')}
          };
        `;

        return content;
      },
    };
  }
);