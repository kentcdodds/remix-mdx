# Remix MDX

I'm trying to improve upon built-in MDX support in Remix, but I want to do it outside of Remix. I'm hoping someone can take this over as a separate library and serve the MDX community better than the built-in support does.

We do want to keep it as part of the build to keep things simple (can deploy to anywhere and not have to worry about loading the MDX at runtime). If you want to do it at runtime we've already got mdx-bundler for that. That's not what we're doing here.

Todos:

- [x] live reload
- [x] routes within the app/routes directory
- [x] routes outside the app/routes directory
- [ ] all the route filename conventions (like `.`, `[`, and `]`)
- [x] customizing the compilation of MDX (plugins etc).
- [x] importing relative, absolute, and `~`-prefixed paths.
- [ ] custom components\*
- [x] add a `loader` export that responds with the frontmatter

\*We already have support for custom components, just make a variable binding in the MDX file called `components` and that'll work. But it would be more sensible to say people need to `export` something called `components` and use that instead. This will be a little tricky, but totally possible.

We're not going to be able to support importing MDX files inside JS files. That's out of scope.

## frontmatter

You can add `frontmatter` to your MDX file that will be returned from a generated loader export. NOTE the following conventions:

- The following keys will generate a meta export automatically:
  - title
  - description
  - keywords
  ```ts
  export function meta({ data }) {
    return {
      title: data.title,
      description: data.description,
      keywords: data.keywords,
    };
  }
  ```
- You can customize the meta export by including a `meta` key with the values other than the default loader data. You can also include a template string to customize the value even further:

  ```yaml
  ---
  meta: title: `My Blog - ${data.title}`
  charset: utf-8
  ---
  ```

  ```ts
  export function meta({ data }) {
    return {
      title: `My Blog - ${data.title}`,
      charset: `utf-8`,
    };
  }
  ```

- You can include a `headers` key to generate a headers object for your loader:

  ```yaml
  ---
  title: My super First Post
  description: Isn't this awesome?

  headers:
    Cache-Control: no-cache
  ---
  ```

  ```ts
  export function loader() {
    return json(
      {
        title: "My super First Post",
        description: "Isn't this awesome?",
      },
      { headers: { "Cache-Control": "no-cache" } }
    );
  }
  ```
