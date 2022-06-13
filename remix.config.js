const remdx = require("./mdx-routes");

/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  ignoredRouteFiles: ["**/.*", "**/*.mdx"],
  routes: async (defineRoutes) => {
    const mdxRouteInfo = await remdx.prepareMdxRoutes();
    const routes = defineRoutes((route) => {
      remdx.createMdxRoutes(mdxRouteInfo, route);
    });
    return routes;
  },
};
