import { stripIndent } from 'common-tags';
import { createUnplugin } from 'unplugin';

import { virtualFile } from '../helpers.js';
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
      ...virtualFile({
        importPath: SECRET_INTERNAL_IMPORT,
        content: stripIndent`
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
        `,
      }),
    };
  }
);
