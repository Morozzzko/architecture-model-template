package is.morozov.structurizr;

import com.structurizr.dsl.StructurizrDslPlugin;
import com.structurizr.dsl.StructurizrDslPluginContext;
import com.structurizr.model.Container;
import com.structurizr.model.Element;
import com.structurizr.model.SoftwareSystem;
import com.structurizr.model.StaticStructureElement;
import com.structurizr.view.AutomaticLayout;
import com.structurizr.view.ContainerView;
import com.structurizr.view.DynamicView;
import com.structurizr.view.ModelView;
import com.structurizr.view.SystemContextView;
import com.structurizr.view.SystemLandscapeView;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

public class EmbedViewsExtractorPlugin implements StructurizrDslPlugin {

    private static final Pattern CODE_BLOCK_PATTERN = Pattern.compile(
            "```structurizr\\{embed:\\s*([^}]+?)\\}\\s*\\R(.*?)```",
            Pattern.DOTALL
    );

    @Override
    public void run(StructurizrDslPluginContext context) {
        String directory = context.getParameter("path", "docs");

        File baseDir = new File(context.getDslFile().getParentFile(), directory);

        if (!baseDir.exists() || !baseDir.isDirectory()) {
            throw new IllegalArgumentException("EmbedViewsExtractor: Directory not found: " + baseDir.getAbsolutePath());
        }

        new EmbedViewsDocumentationImporter().importDocumentation(context.getWorkspace(), baseDir);

        List<ViewDefinition> viewDefinitions = extractViewDefinitionsFromMarkdown(baseDir);
        if (!viewDefinitions.isEmpty()) {
            addViews(context, viewDefinitions);
        }
    }

    private List<ViewDefinition> extractViewDefinitionsFromMarkdown(File directory) {
        List<ViewDefinition> definitions = new ArrayList<>();

        try (Stream<Path> paths = Files.walk(directory.toPath())) {
            paths.filter(Files::isRegularFile)
                    .filter(p -> p.toString().endsWith(".md"))
                    .sorted()
                    .forEach(path -> {
                        try {
                            String content = Files.readString(path);
                            Matcher matcher = CODE_BLOCK_PATTERN.matcher(content);
                            while (matcher.find()) {
                                String viewName = matcher.group(1).trim();
                                if (viewName.isEmpty()) {
                                    continue;
                                }
                                definitions.add(new ViewDefinition(
                                        path.getFileName().toString(),
                                        matcher.group(2).trim()
                                ));
                            }
                        } catch (IOException e) {
                            throw new RuntimeException("EmbedViewsExtractor: Failed to read file: " + path, e);
                        }
                    });
        } catch (IOException e) {
            throw new RuntimeException("EmbedViewsExtractor: Failed to walk directory: " + directory, e);
        }

        return definitions;
    }

    private void addViews(StructurizrDslPluginContext context, List<ViewDefinition> definitions) {
        for (ViewDefinition definition : definitions) {
            addView(context, definition.content);
        }
    }

    private void addView(StructurizrDslPluginContext context, String definition) {
        List<String> lines = definition.lines()
                .map(String::trim)
                .filter(line -> !line.isEmpty())
                .toList();

        if (lines.isEmpty()) {
            return;
        }

        List<String> header = tokenize(lines.get(0).replaceAll("\\s*\\{\\s*$", ""));
        if (header.isEmpty()) {
            return;
        }

        switch (header.get(0)) {
            case "dynamic" -> addDynamicView(context, header, lines);
            case "systemLandscape" -> addSystemLandscapeView(context, header, lines);
            case "systemContext" -> addSystemContextView(context, header, lines);
            case "container" -> addContainerView(context, header, lines);
            default -> throw new IllegalArgumentException("Unsupported embedded view type: " + header.get(0));
        }
    }

    private void addDynamicView(StructurizrDslPluginContext context, List<String> header, List<String> lines) {
        if (header.size() < 3) {
            throw new IllegalArgumentException("Expected: dynamic <scope> <key> [description]");
        }

        Element scope = findElement(context, header.get(1));
        String key = header.get(2);
        String description = header.size() > 3 ? header.get(3) : "";
        DynamicView view;

        if (scope instanceof SoftwareSystem softwareSystem) {
            view = context.getWorkspace().getViews().createDynamicView(softwareSystem, key, description);
        } else if (scope instanceof Container container) {
            view = context.getWorkspace().getViews().createDynamicView(container, key, description);
        } else {
            throw new IllegalArgumentException("Dynamic view scope must be a software system or container: " + header.get(1));
        }

        for (String line : lines.subList(1, lines.size())) {
            if (line.equals("}")) {
                continue;
            }

            List<String> tokens = tokenize(line);
            if (tokens.isEmpty()) {
                continue;
            }

            if (tokens.get(0).equals("autoLayout")) {
                enableAutomaticLayout(view, tokens);
            } else if (tokens.size() >= 3 && tokens.get(1).equals("->")) {
                StaticStructureElement source = findStaticStructureElement(context, tokens.get(0));
                StaticStructureElement destination = findStaticStructureElement(context, tokens.get(2));
                String relationshipDescription = tokens.size() > 3 ? tokens.get(3) : "";
                view.add(source, relationshipDescription, destination);
            }
        }
    }

    private void addSystemLandscapeView(StructurizrDslPluginContext context, List<String> header, List<String> lines) {
        if (header.size() < 2) {
            throw new IllegalArgumentException("Expected: systemLandscape <key> [description]");
        }

        SystemLandscapeView view = context.getWorkspace().getViews().createSystemLandscapeView(header.get(1), header.size() > 2 ? header.get(2) : "");
        applyStaticViewDirectives(view, lines);
    }

    private void addSystemContextView(StructurizrDslPluginContext context, List<String> header, List<String> lines) {
        if (header.size() < 3) {
            throw new IllegalArgumentException("Expected: systemContext <softwareSystem> <key> [description]");
        }

        Element element = findElement(context, header.get(1));
        if (!(element instanceof SoftwareSystem softwareSystem)) {
            throw new IllegalArgumentException("System context view scope must be a software system: " + header.get(1));
        }

        SystemContextView view = context.getWorkspace().getViews().createSystemContextView(softwareSystem, header.get(2), header.size() > 3 ? header.get(3) : "");
        applyStaticViewDirectives(view, lines);
    }

    private void addContainerView(StructurizrDslPluginContext context, List<String> header, List<String> lines) {
        if (header.size() < 3) {
            throw new IllegalArgumentException("Expected: container <softwareSystem> <key> [description]");
        }

        Element element = findElement(context, header.get(1));
        if (!(element instanceof SoftwareSystem softwareSystem)) {
            throw new IllegalArgumentException("Container view scope must be a software system: " + header.get(1));
        }

        ContainerView view = context.getWorkspace().getViews().createContainerView(softwareSystem, header.get(2), header.size() > 3 ? header.get(3) : "");
        applyStaticViewDirectives(view, lines);
    }

    private void applyStaticViewDirectives(ModelView view, List<String> lines) {
        for (String line : lines.subList(1, lines.size())) {
            if (line.equals("}")) {
                continue;
            }

            List<String> tokens = tokenize(line);
            if (tokens.isEmpty()) {
                continue;
            }

            if (tokens.get(0).equals("include") && tokens.size() > 1 && tokens.get(1).equals("*")) {
                if (view instanceof SystemLandscapeView systemLandscapeView) {
                    systemLandscapeView.addAllElements();
                } else if (view instanceof SystemContextView systemContextView) {
                    systemContextView.addAllElements();
                } else if (view instanceof ContainerView containerView) {
                    containerView.addAllElements();
                }
            } else if (tokens.get(0).equals("autoLayout")) {
                enableAutomaticLayout(view, tokens);
            }
        }
    }

    private Element findElement(StructurizrDslPluginContext context, String identifier) {
        Element element = context.getDslParser().getIdentifiersRegister().getElement(identifier);
        if (element == null) {
            throw new IllegalArgumentException("Element not found: " + identifier);
        }

        return element;
    }

    private StaticStructureElement findStaticStructureElement(StructurizrDslPluginContext context, String identifier) {
        Element element = findElement(context, identifier);
        if (!(element instanceof StaticStructureElement staticStructureElement)) {
            throw new IllegalArgumentException("Element is not valid in this view: " + identifier);
        }

        return staticStructureElement;
    }

    private void enableAutomaticLayout(ModelView view, List<String> tokens) {
        if (tokens.size() > 1) {
            view.enableAutomaticLayout(rankDirection(tokens.get(1)));
        } else {
            view.enableAutomaticLayout();
        }
    }

    private AutomaticLayout.RankDirection rankDirection(String value) {
        return switch (value) {
            case "tb" -> AutomaticLayout.RankDirection.TopBottom;
            case "bt" -> AutomaticLayout.RankDirection.BottomTop;
            case "rl" -> AutomaticLayout.RankDirection.RightLeft;
            default -> AutomaticLayout.RankDirection.LeftRight;
        };
    }

    private List<String> tokenize(String line) {
        List<String> tokens = new ArrayList<>();
        Matcher matcher = Pattern.compile("\"([^\"]*)\"|\\S+").matcher(line);
        while (matcher.find()) {
            String quoted = matcher.group(1);
            tokens.add(quoted != null ? quoted : matcher.group());
        }

        return tokens;
    }

    private record ViewDefinition(String sourceFile, String content) {}
}
