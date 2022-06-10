# Remix MDX

I'm trying to improve upon built-in MDX support in Remix, but I want to do it outside of Remix. I'm hoping someone can take this over as a separate library and serve the MDX community better than the built-in support does.

We do want to keep it as part of the build to keep things simple (can deploy to anywhere and not have to worry about loading the MDX at runtime). If you want to do it at runtime we've already got mdx-bundler for that. That's not what we're doing here.

Todos:

- [x] support live reload
- [x] support routes within the app/routes directory
- [x] support routes outside the app/routes directory
- [ ] support all the route filename conventions (like `.`, `[`, and `]`)
- [x] support customizing the compilation of MDX (plugins etc).
- [x] support importing relative, absolute, and `~`-prefixed paths.
- [ ] support custom components\*

\*We already have support for custom components, just make a variable binding in the MDX file called `components` and that'll work. But it would be more sensible to say people need to `export` something called `components` and use that instead. This will be a little tricky, but totally possible.

We're not going to be able to support importing MDX files inside JS files. That's out of scope.
