package is.morozov.structurizr;

import com.structurizr.Workspace;
import com.structurizr.documentation.Section;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EmbedViewsDocumentationImporterTest {

    @TempDir
    Path tempDir;

    @Test
    void importsMarkdownAndReplacesEmbeddedStructurizrBlocksWithEmbedReferences() throws Exception {
        Path docs = tempDir.resolve("docs");
        Files.createDirectories(docs);
        Files.writeString(docs.resolve("01-runtime.md"), """
                # Runtime

                Before.

                ```structurizr{embed:UserRequestFlow}
                dynamic system UserRequestFlow "User request flow" {
                    user -> system.webapp "Uses"
                    autoLayout lr
                }
                ```

                After.
                """);

        Workspace workspace = new Workspace("Name", "Description");

        new EmbedViewsDocumentationImporter().importDocumentation(workspace, docs.toFile());

        Section section = workspace.getDocumentation().getSections().iterator().next();
        assertEquals("""
                # Runtime

                Before.

                ![](embed:UserRequestFlow)

                After.
                """, section.getContent());
    }
}
