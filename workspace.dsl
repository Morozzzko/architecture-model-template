# See https://github.com/structurizr/examples/tree/main/dsl for better examples and potential boilerplate

workspace {
    !identifiers hierarchical
    !docs docs/arc42 is.morozov.structurizr.EmbedViewsDocumentationImporter
    # Extracts view definitions from ```structurizr{embed:ViewName} code blocks in markdown files
    # and writes them to .generated/embedded-views.dsl, which is !include'd in the views block
    !plugin is.morozov.structurizr.EmbedViewsExtractorPlugin {
        path docs/arc42
        output .generated/embedded-views.dsl
    }

    model {
        user = person "User" {
            description "A user of the system."
        }
        system = softwareSystem "Software System" {
            description "A software system."
        }
        user -> system "Uses"
    }

    views {
        systemLandscape "Landscape" "Everything we have" {
          include *
          autoLayout lr
        }

        # Views extracted from markdown files by EmbedViewsExtractorPlugin
        !include .generated/embedded-views.dsl
    }
}
