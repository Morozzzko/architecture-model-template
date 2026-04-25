# See https://github.com/structurizr/examples/tree/main/dsl for better examples and potential boilerplate

workspace {
    !identifiers hierarchical

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

    !plugin is.morozov.structurizr.EmbedViewsExtractorPlugin {
        path docs/arc42
    }

    views {
        systemLandscape "Landscape" "Everything we have" {
          include *
          autoLayout lr
        }
    }
}
