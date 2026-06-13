package systems.rcd.enonic.datatoolbox;

import systems.rcd.fwk.core.exc.RcdException;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

//TODO Update RCD fwk to read directly from content and remove this class
public class SimplePropertiesReader {
    private static final Pattern PATTERN = Pattern.compile("^\\s*([^\\s#!]+)\\s*=\\s*(\\S+)");

    public Map<String, String> instRead(String content) {
        Map<String, String> properties = new HashMap<>();
        try (Stream<String> lines = content.lines()) {
            lines.forEach((line) -> {
                Matcher matcher = PATTERN.matcher(line);
                if (matcher.find()) {
                    properties.put(matcher.group(1), matcher.group(2));
                }
            });
            return properties;
        } catch (Exception e) {
            throw new RcdException("Error while reading properties document", e);
        }
    }
}