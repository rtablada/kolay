import { apiDocs as unApiDocs } from './api-docs/index.js';
import { copyFile as unCopyFile } from './copy-file.js';
import { copyToPublic as unCopyToPublic } from './copy-to-public.js';
import {
  createManifest as unCreateManifest,
  markdownPages as unMarkdownPages,
} from './create-manifest/index.js';

export const copyFile = unCopyFile.webpack;
export const copyToPublic = unCopyToPublic.webpack;
export const createManifest = unCreateManifest.webpack;
export const apiDocs = unApiDocs.webpack;
export const markdownPages = unMarkdownPages.webpack;
