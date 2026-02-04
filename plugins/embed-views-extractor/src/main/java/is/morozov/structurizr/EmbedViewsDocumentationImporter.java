package is.morozov.structurizr;

import com.structurizr.documentation.Documentable;
import com.structurizr.documentation.Format;
import com.structurizr.documentation.Section;
import com.structurizr.importer.documentation.FormatFinder;
import com.structurizr.importer.documentation.RecursiveDefaultDocumentationImporter;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class EmbedViewsDocumentationImporter extends RecursiveDefaultDocumentationImporter {

    private static final Pattern EMBED_BLOCK_PATTERN = Pattern.compile(
            "```structurizr\\{embed:\\s*([^}]+?)\\}\\s*\\R(.*?)```",
            Pattern.DOTALL
    );

    @Override
    protected void importFile(Documentable documentable, File file) throws Exception {
        if (!FormatFinder.isMarkdownOrAsciiDoc(file)) {
            return;
        }

        Format format = FormatFinder.findFormat(file);
        String content = Files.readString(file.toPath(), StandardCharsets.UTF_8);
        String processed = replaceEmbedBlocks(content);

        Section section = new Section(format, processed);
        section.setFilename(file.getCanonicalPath());
        documentable.getDocumentation().addSection(section);
    }

    private String replaceEmbedBlocks(String input) {
        Matcher matcher = EMBED_BLOCK_PATTERN.matcher(input);
        StringBuffer sb = new StringBuffer();

        while (matcher.find()) {
            String viewName = matcher.group(1).trim();
            if (viewName.isEmpty()) {
                matcher.appendReplacement(sb, Matcher.quoteReplacement(matcher.group(0)));
                continue;
            }
            String replacement = "![](embed:" + viewName + ")";
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }

        matcher.appendTail(sb);
        return sb.toString();
    }
}
