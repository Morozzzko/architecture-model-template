# Embed Views Extractor Plugin

A Structurizr DSL plugin that imports Markdown documentation, extracts embedded view definitions, adds those views to the workspace, and replaces the embedded blocks with Structurizr documentation embed references.

## Usage

In your `workspace.dsl`:

```structurizr
workspace {
    model {
        # ...
    }

    !plugin is.morozov.structurizr.EmbedViewsExtractorPlugin {
        path docs/arc42
    }

    views {
        # ...
    }
}
```

## Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `path` | `docs` | Directory to scan for markdown files |

## Markdown Syntax

In your markdown files, use fenced code blocks with the `structurizr{embed:ViewName}` language tag:

~~~markdown
```structurizr{embed:Context}
systemContext system "Context" "Shows the system context" {
    include *
    autoLayout lr
}
```
~~~

The plugin imports the Markdown files into workspace documentation, replaces matching blocks in-memory with `![](embed:ViewName)`, and adds the embedded views directly to the workspace.

## Building

```sh
make build
```

The JAR will be placed in the `plugins/` directory.
