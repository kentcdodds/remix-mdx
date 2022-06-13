const path = require("path");
const fs = require("fs");
const fm = require("front-matter");
const glob = require("glob");
const babel = require("@babel/core");
const resolve = require("resolve");
const chokidar = require("chokidar");
const fromRoot = (...paths) => path.join(process.cwd(), ...paths);

const globise = function (pattern, options) {
  return new Promise((resolve, reject) => {
    glob(pattern, options, (err, files) =>
      err === null ? resolve(files) : reject(err)
    );
  });
};

let watcher;

async function prepareMdxRoutes({
  mdxFiles = "**/*.mdx",
  root = fromRoot("app/routes"),
  compileMdxFile,
} = {}) {
  if (watcher) await watcher.close();

  const globToMdxFiles = path.join(root, mdxFiles);
  const files = await globise(globToMdxFiles, { realpath: true });
  const cachePaths = {};
  for (const file of files) {
    cachePaths[file] = await compileMdxRoute(file, compileMdxFile);
  }

  watcher = chokidar
    .watch(globToMdxFiles)
    .on("change", async (updatedFile) =>
      compileMdxRoute(updatedFile, compileMdxFile)
    );

  return { files, cachePaths, root };
}

function createMdxRoutes({ files, cachePaths, root }, route) {
  for (const file of files) {
    route(file.replace(`${root}/`, "").replace(/.mdx$/, ""), cachePaths[file]);
  }
}

async function compileMdxFile(filePath) {
  const [compileMdx, remarkFrontmatter] = await Promise.all([
    import("@mdx-js/mdx").then((mod) => mod.compile),
    import("remark-frontmatter").then((mod) => mod.default),
  ]);

  const content = await fs.promises.readFile(filePath, "utf8");
  const frontmatter = fm(content);

  const result = await compileMdx(content, {
    remarkPlugins: [remarkFrontmatter],
  });
  return { code: result.value, frontmatter: frontmatter.attributes };
}

async function compileMdxRoute(filePath, compileMdx = compileMdxFile) {
  const { code, frontmatter } = await compileMdx(filePath);
  const { code: babelCode } = babel.transform(code, {
    plugins: [
      {
        name: "babel-plugin-fix-imports",
        visitor: {
          ImportDeclaration(astPath) {
            const importPath = astPath.node.source.value;
            if (path.isAbsolute(importPath) || importPath.startsWith("~")) {
              return;
            }
            const basedir = path.dirname(filePath);
            const absolutePath = resolve.sync(importPath, {
              basedir,
              extensions: [".js", ".jsx", ".ts", ".tsx", ".mdx"],
            });
            astPath.node.source.value = absolutePath;
          },
          ExportDefaultDeclaration(path) {
            const hasComponents = path.scope.getBinding("components");
            if (!hasComponents) return;

            if (babel.types.isIdentifier(path.node.declaration)) {
              path.replaceWith(
                babel.template(
                  `export default () => React.createElement(%%EXPORT_NAME%%, {components});`
                )({
                  EXPORT_NAME: path.node.declaration.name,
                })
              );
            }
          },
        },
      },
    ],
  });

  const cachePath = `${fromRoot(
    ".cache/mdx-routes",
    filePath.replace(process.cwd(), "")
  )}.js`;

  fs.mkdirSync(path.dirname(cachePath), { recursive: true });

  const [stringifyObject] = await Promise.all([
    import("stringify-object").then((mod) => mod.default),
  ]);

  let { meta, headers, ...loaderData } = frontmatter;
  if (!meta) meta = {};
  if (!loaderData) loaderData = {};
  const metaKeys = Array.from(
    new Set(["title", "description", "keywords", ...Object.keys(meta ?? {})])
  );
  const metaObject = metaKeys
    .map((key) =>
      meta[key]
        ? `${key}: \`${meta[key]}\``
        : loaderData[key]
        ? `${key}: data.${key}`
        : undefined
    )
    .filter(Boolean)
    .join(",\n");

  const js = `import { json } from "@remix-run/node";
${babelCode}
export function meta({data}) {
  return {
${metaObject}
  };
}
export function loader() {
  return json(${stringifyObject(loaderData, {
    singleQuotes: false,
  })}${headers ? `, { headers: ${stringifyObject(headers)} }` : ""});
}
`;

  await fs.promises.writeFile(cachePath, js);

  return cachePath;
}

module.exports = { prepareMdxRoutes, createMdxRoutes };
