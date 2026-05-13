# See https://github.com/structurizr/examples/tree/main/dsl for better examples and potential boilerplate

workspace {
    !identifiers hierarchical

    # Imports docs and extracts embedded view DSL into a file that is included from the views block.
    # Embedded blocks are parsed by Structurizr, so any valid view DSL remains valid here.
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

            webapp = container "Web App" {
                description "Primary user-facing interface."
            }
        }
        user -> system "Uses"
        user -> system.webapp "Uses"
    }

    !adrs docs/decisions

    views {
        systemLandscape "Landscape" "Everything we have" {
          include *
          autoLayout lr
        }

        !include .generated/embedded-views.dsl
    }
}
