# Embed Views Extractor Plugin

A Structurizr DSL plugin that extracts view definitions from markdown files and generates a DSL file that can be included in your workspace.

## Usage

In your `workspace.dsl`:

```structurizr
workspace {
    !plugin is.morozov.structurizr.EmbedViewsExtractorPlugin {
        path docs/arc42
        output .generated/embedded-views.dsl
    }

    model {
        # ...
    }

    views {
        # ...
        !include .generated/embedded-views.dsl
    }
}
```

## Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `path` | `docs` | Directory to scan for markdown files |
| `output` | `embedded-views.dsl` | Output file path for generated DSL |

## Markdown Syntax

In your markdown files, use fenced code blocks with the `structurizr{embed}` language tag:

~~~markdown
```structurizr{embed}
systemContext system "Context" "Shows the system context" {
    include *
    autoLayout lr
}
```
~~~

The plugin extracts these blocks and writes them to the output file, which is then included by the DSL parser.

## Building

```sh
make build
```

The JAR will be placed in the `plugins/` directory.
