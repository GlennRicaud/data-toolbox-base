package systems.rcd.enonic.datatoolbox;

import com.google.common.html.HtmlEscapers;

public class RcdEscapeUtils {
    public static String escapeHtml(String s) {
        return HtmlEscapers.htmlEscaper().escape(s);
    }
}
