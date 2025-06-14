import { Plugin } from "vite";

export function htmlVersionInject(version: string): Plugin {
  return {
    name: 'html-version-inject',
    transformIndexHtml(html) {
      return html.replace(/__BUILD_VERSION__/g, version);
    }
  }
}
