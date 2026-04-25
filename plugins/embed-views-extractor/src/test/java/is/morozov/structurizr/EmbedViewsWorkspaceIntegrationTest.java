package is.morozov.structurizr;

import com.structurizr.Workspace;
import com.structurizr.documentation.Section;
import com.structurizr.dsl.StructurizrDslParser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class EmbedViewsWorkspaceIntegrationTest {

    @TempDir
    Path tempDir;

    @Test
    void importsDocsExtractsEmbeddedViewDslAndMakesTheViewEmbeddableWithOnePlugin() throws Exception {
        Path docs = tempDir.resolve("docs");
        Files.createDirectories(docs);
        Files.writeString(docs.resolve("runtime.md"), """
                # Runtime

                ```structurizr{embed:UserRequestFlow}
                dynamic system UserRequestFlow "User request flow" {
                    user -> system.webapp "Uses"
                    autoLayout lr
                }
                ```
                """);
        Path workspaceDsl = tempDir.resolve("workspace.dsl");
        Files.writeString(workspaceDsl, """
                workspace {
                    !identifiers hierarchical

                    model {
                        user = person "User"
                        system = softwareSystem "Software System" {
                            webapp = container "Web App"
                        }

                        user -> system.webapp "Uses"
                    }

                    !plugin is.morozov.structurizr.EmbedViewsExtractorPlugin {
                        path docs
                    }

                    views {
                    }
                }
                """);

        StructurizrDslParser parser = new StructurizrDslParser();
        parser.parse(workspaceDsl.toFile());
        Workspace workspace = parser.getWorkspace();

        Section section = workspace.getDocumentation().getSections().iterator().next();
        assertEquals("""
                # Runtime

                ![](embed:UserRequestFlow)
                """, section.getContent());
        assertNotNull(workspace.getViews().getViewWithKey("UserRequestFlow"));
        assertEquals(false, Files.exists(tempDir.resolve(".generated/embedded-views.dsl")));
    }
}
