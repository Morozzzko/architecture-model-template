package is.morozov.structurizr;

import com.structurizr.Workspace;
import com.structurizr.dsl.StructurizrDslParser;
import com.structurizr.dsl.StructurizrDslPluginContext;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

final class TestPluginContexts {

    private TestPluginContexts() {
    }

    static void runPlugin(Path directory, String docsPath) throws Exception {
        runPlugin(directory, docsPath, "embedded-views.dsl");
    }

    static void runPlugin(Path directory, String docsPath, String outputPath) throws Exception {
        Path dslFile = directory.resolve("workspace.dsl");
        Files.writeString(dslFile, "workspace {}\n");

        StructurizrDslPluginContext context = new StructurizrDslPluginContext(
                new StructurizrDslParser(),
                dslFile.toFile(),
                new Workspace("Name", "Description"),
                Map.of(
                        "path", docsPath,
                        "output", outputPath
                )
        );

        new EmbedViewsExtractorPlugin().run(context);
    }
}
