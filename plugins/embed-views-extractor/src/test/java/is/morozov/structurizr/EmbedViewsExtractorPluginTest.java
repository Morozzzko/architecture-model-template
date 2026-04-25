package is.morozov.structurizr;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertThrows;

class EmbedViewsExtractorPluginTest {

    @TempDir
    Path tempDir;

    @Test
    void throwsWhenDocumentationPathDoesNotExist() {
        assertThrows(IllegalArgumentException.class, () -> TestPluginContexts.runPlugin(tempDir, "missing"));
    }
}
