Subsets of Inter and JetBrains Mono (SIL OFL 1.1, licenses alongside), cut from the `@fontsource`
packages with:

    uvx --from fonttools --with brotli pyftsubset <font>.woff2 \
      --unicodes="U+0020-007E,U+00A0-00FF,U+2009,U+2013-2014,U+2018-201D,U+2022,U+2026,U+2032-2033,U+2039-203A,U+2190-2193,U+2212,U+2605" \
      --layout-features=kern --flavor=woff2 --no-hinting --desubroutinize

JetBrains Mono uses `--layout-features=''` (no ligatures). The cards embed these files as they are and
the film's captions are set in them, so after changing them, run `bun run film` and `bun run build`.
