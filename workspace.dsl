# See https://github.com/structurizr/examples/tree/main/dsl for better examples and potential boilerplate

workspace {
    !identifiers hierarchical
    !docs docs/arc42 com.structurizr.importer.documentation.RecursiveDefaultDocumentationImporter
    
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
    }
}
