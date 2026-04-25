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
        Path dslFile = directory.resolve("workspace.dsl");
        Files.writeString(dslFile, "workspace {}\n");

        StructurizrDslPluginContext context = new StructurizrDslPluginContext(
                new StructurizrDslParser(),
                dslFile.toFile(),
                new Workspace("Name", "Description"),
                Map.of("path", docsPath)
        );

        new EmbedViewsExtractorPlugin().run(context);
    }
}
